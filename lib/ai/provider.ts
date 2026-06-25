// ============================================================
//  lib/ai/providers.ts
//
//  Three 100% free providers (no credit card required):
//
//  1. OpenRouter  — 29+ free models (DeepSeek, Llama, Gemma...)
//                   Get key: https://openrouter.ai/keys
//
//  2. Gemini      — Most generous: 1,500 req/day, 1M tokens/day
//                   Get key: https://aistudio.google.com/app/apikey
//
//  3. Mistral     — 1 billion tokens/month free (Experiment plan)
//                   Get key: https://console.mistral.ai
//                   No credit card needed, just sign up
// ============================================================

import {
  ProviderConfig,
  AIGenerateRequest,
  AIGenerateResponse,
  ProviderError,
  QUOTA_STATUS_CODES,
  QUOTA_KEYWORDS,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────

function detectQuotaError(statusCode: number, body: string): boolean {
  if (QUOTA_STATUS_CODES.has(statusCode)) return true;
  const lower = body.toLowerCase();
  return QUOTA_KEYWORDS.some((kw) => lower.includes(kw));
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const json = await res.json() as Record<string, unknown>;
    const err = json?.error as Record<string, unknown> | undefined;
    return (
      (err?.message as string) ||
      (err?.code as string) ||
      (json?.message as string) ||
      JSON.stringify(json)
    );
  } catch {
    return await res.text().catch(() => `HTTP ${res.status}`);
  }
}

// ══════════════════════════════════════════════════════════════
//  1. OPENROUTER
//  OpenAI-compatible endpoint
//  Free models (append :free to model name):
//    meta-llama/llama-3.1-8b-instruct:free
//    deepseek/deepseek-r1:free
//    google/gemma-3-27b-it:free
//    microsoft/phi-4:free
//    deepseek/deepseek-v3-0324:free   ← great for code generation
// ══════════════════════════════════════════════════════════════
export async function callOpenRouter(
  config: ProviderConfig,
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const messages = req.systemPrompt
    ? [{ role: "system" as const, content: req.systemPrompt }, ...req.messages]
    : req.messages;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "App Builder",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new ProviderError(
      "openrouter",
      res.status,
      detectQuotaError(res.status, errBody),
      `OpenRouter [${res.status}]: ${errBody}`
    );
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model?: string;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0].message.content,
    provider: "openrouter",
    model: data.model ?? config.model,
    tokensUsed: data.usage?.total_tokens,
  };
}

// ══════════════════════════════════════════════════════════════
//  2. GEMINI (Google AI Studio)
//  Free tier: 15 req/min, 1,500 req/day, 1M tokens/day
//  Free models:
//    gemini-2.0-flash          ← recommended (fast + capable)
//    gemini-1.5-flash
//    gemini-2.5-flash-lite
// ══════════════════════════════════════════════════════════════
export async function callGemini(
  config: ProviderConfig,
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  // Gemini uses "contents" with "parts" — roles: "user" | "model"
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.7,
    },
  };

  if (req.systemPrompt) {
    body.systemInstruction = { parts: [{ text: req.systemPrompt }] };
  }

  const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new ProviderError(
      "gemini",
      res.status,
      detectQuotaError(res.status, errBody),
      `Gemini [${res.status}]: ${errBody}`
    );
  }

  const data = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new ProviderError("gemini", 200, false, "Empty response from Gemini");
  }

  return {
    content: text,
    provider: "gemini",
    model: config.model,
    tokensUsed:
      (data.usageMetadata?.promptTokenCount ?? 0) +
      (data.usageMetadata?.candidatesTokenCount ?? 0),
  };
}

// ══════════════════════════════════════════════════════════════
//  3. MISTRAL (La Plateforme — Experiment plan)
//  Free tier: 1 BILLION tokens/month, 2 req/min, no credit card
//  OpenAI-compatible endpoint
//  Free models:
//    mistral-small-latest      ← best free general model
//    codestral-latest          ← specialized for code generation ✅
//    open-mistral-nemo         ← lightweight, fast
//    mistral-large-latest      ← most capable (may need paid)
//
//  Sign up: https://console.mistral.ai
//  Get key:  console.mistral.ai → API Keys → Create new key
// ══════════════════════════════════════════════════════════════
export async function callMistral(
  config: ProviderConfig,
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const messages = req.systemPrompt
    ? [{ role: "system" as const, content: req.systemPrompt }, ...req.messages]
    : req.messages;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new ProviderError(
      "mistral",
      res.status,
      detectQuotaError(res.status, errBody),
      `Mistral [${res.status}]: ${errBody}`
    );
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model?: string;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0].message.content,
    provider: "mistral",
    model: data.model ?? config.model,
    tokensUsed: data.usage?.total_tokens,
  };
}
// ══════════════════════════════════════════════════════════════
//  4. HUGGING FACE (Inference API)
//  Free tier: rate-limited per model, no credit card
//  Best free models for code generation:
//    Qwen/Qwen2.5-Coder-32B-Instruct   ← best free code model
//    mistralai/Mistral-7B-Instruct-v0.3
//    meta-llama/Meta-Llama-3-8B-Instruct
//
//  Sign up: https://huggingface.co
//  Get key: huggingface.co/settings/tokens → New token (Read)
//  Set env: HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx
//           HUGGINGFACE_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct
// ══════════════════════════════════════════════════════════════
export async function callHuggingFace(
  config: ProviderConfig,
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  // Build a single prompt string from messages
  // HF Inference API (text-generation) doesn't use chat format natively
  const systemBlock = req.systemPrompt
    ? `<|system|>\n${req.systemPrompt}\n`
    : "";

  const conversationBlock = req.messages
    .map((m) =>
      m.role === "user"
        ? `<|user|>\n${m.content}\n`
        : `<|assistant|>\n${m.content}\n`
    )
    .join("");

  const prompt = `${systemBlock}${conversationBlock}<|assistant|>\n`;

  const res = await fetch(
    `${config.baseUrl}/${config.model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: req.maxTokens ?? 4096,
          temperature: req.temperature ?? 0.7,
          return_full_text: false,   // ← only return generated part
          do_sample: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new ProviderError(
      "huggingface",
      res.status,
      detectQuotaError(res.status, errBody),
      `HuggingFace [${res.status}]: ${errBody}`
    );
  }

  // HF returns: [{ generated_text: "..." }]
  const data = await res.json() as Array<{ generated_text?: string }>;
  const text = data?.[0]?.generated_text;

  if (!text) {
    throw new ProviderError(
      "huggingface",
      200,
      false,
      "Empty response from HuggingFace"
    );
  }

  return {
    content: text,
    provider: "huggingface",
    model: config.model,
    tokensUsed: undefined, // HF doesn't return token counts on free tier
  };
}