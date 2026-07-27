// ============================================================
//  lib/ai/router.ts
//
//  Singleton AIFallbackRouter — OpenRouter → Gemini → Mistral
//
//  All three are 100% free with no credit card:
//  • OpenRouter : free models (deepseek-v3, llama-3.3-70b...)
//  • Gemini     : 1,500 req/day, 1M tokens/day (most generous)
//  • Mistral    : 1 billion tokens/month (Experiment plan)
// ============================================================

import {
  ProviderConfig,
  ProviderName,
  AIGenerateRequest,
  AIGenerateResponse,
  ProviderError,
} from "./types";
import { callOpenRouter, callGemini, callMistral, callHuggingFace } from "./provider";

const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

interface ProviderState {
  config: ProviderConfig;
  exhaustedUntil: number | null;
  totalCalls: number;
  totalErrors: number;
}

class AIFallbackRouter {
  private states = new Map<ProviderName, ProviderState>();
  private order: ProviderName[];
  private cooldownMs: number;
  private verbose: boolean;

  constructor(configs: ProviderConfig[], cooldownMs: number, verbose: boolean) {
    this.cooldownMs = cooldownMs;
    this.verbose = verbose;
    this.order = configs.map((c) => c.name);

    for (const config of configs) {
      this.states.set(config.name, {
        config,
        exhaustedUntil: null,
        totalCalls: 0,
        totalErrors: 0,
      });
    }
  }

  // ── Core: generate with automatic fallback ───────────────
  async generate(req: AIGenerateRequest): Promise<AIGenerateResponse> {
    const available = this.getAvailable();

    if (available.length === 0) {
      const waitSec = Math.ceil(this.nextRetryMs() / 1000);
      throw new Error(`All AI providers are exhausted. Retry in ${waitSec}s.`);
    }

    let lastError: Error | null = null;

    for (const name of available) {
      const state = this.states.get(name)!;
      this.log(`→ [${name}] trying... model: ${state.config.model}`);

      try {
        state.totalCalls++;
        const response = await this.dispatch(state.config, req);
        this.log(`✓ [${name}] success — ${response.tokensUsed ?? "?"} tokens`);
        return response;
      } catch (err) {
        state.totalErrors++;
        lastError = err as Error;

        if (err instanceof ProviderError && err.isQuotaError) {
          state.exhaustedUntil = Date.now() + this.cooldownMs;
          this.log(
            `✗ [${name}] quota/rate-limit hit (HTTP ${err.statusCode}). ` +
            `Cooling ${this.cooldownMs / 60_000}min → trying next...`
          );
        } else {
          // Transient error — skip this time but don't blacklist
          this.log(`✗ [${name}] non-quota error: ${(err as Error).message}`);
        }
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  // ── Status endpoint — GET /api/gen-ai-code ───────────────
  getStatus() {
    const now = Date.now();
    const result: Record<string, {
      available: boolean;
      cooldownRemainingMs: number | null;
      totalCalls: number;
      totalErrors: number;
      model: string;
    }> = {};

    for (const [name, state] of this.states) {
      const cooling = state.exhaustedUntil !== null && state.exhaustedUntil > now;
      result[name] = {
        available: !cooling,
        cooldownRemainingMs: cooling ? state.exhaustedUntil! - now : null,
        totalCalls: state.totalCalls,
        totalErrors: state.totalErrors,
        model: state.config.model,
      };
    }
    return result;
  }

  reset(name: ProviderName) {
    const s = this.states.get(name);
    if (s) s.exhaustedUntil = null;
  }

  // ── Private ──────────────────────────────────────────────
  private getAvailable(): ProviderName[] {
    const now = Date.now();
    return this.order.filter((name) => {
      const s = this.states.get(name)!;
      if (s.exhaustedUntil !== null && s.exhaustedUntil <= now) {
        s.exhaustedUntil = null;
        this.log(`↺ [${name}] cooldown expired — restored`);
      }
      return s.exhaustedUntil === null;
    });
  }

  private nextRetryMs(): number {
    const now = Date.now();
    let min = Infinity;
    for (const s of this.states.values()) {
      if (s.exhaustedUntil !== null && s.exhaustedUntil > now) {
        min = Math.min(min, s.exhaustedUntil - now);
      }
    }
    return min === Infinity ? 0 : min;
  }

  private async dispatch(
    config: ProviderConfig,
    req: AIGenerateRequest
  ): Promise<AIGenerateResponse> {
    switch (config.name) {
      case "openrouter": return callOpenRouter(config, req);
      case "gemini": return callGemini(config, req);
      case "mistral": return callMistral(config, req);
      case "huggingface": return callHuggingFace(config, req);
      default: throw new Error(`Unknown provider: ${config.name}`);
    }
  }

  private log(msg: string) {
    if (this.verbose) {
      console.log(`[AIRouter] ${new Date().toISOString()} ${msg}`);
    }
  }
}

// ============================================================
//  Singleton — survives across all API requests in same process
//  globalThis trick prevents hot-reload from resetting state
// ============================================================
function buildRouter(): AIFallbackRouter {
  const cooldownMs = Number(process.env.AI_COOLDOWN_MS ?? DEFAULT_COOLDOWN_MS);
  const verbose = process.env.NODE_ENV === "development";

  console.log(process.env.MISTRAL_API_KEY?.slice(0, 6));
  return new AIFallbackRouter(
    [
      
      // {
      //   name: "huggingface",
      //   apiKey: process.env.HUGGINGFACE_API_KEY ?? "",
      //   model: process.env.HUGGINGFACE_MODEL
      //   ?? "Qwen/Qwen2.5-Coder-32B-Instruct",
      //   baseUrl: "https://api-inference.huggingface.co/models",
      // },
      // ── 2nd choice: Gemini ────────────────────────────────
      // Most generous free tier: 1,500 req/day, 1M tokens/day
      {
        name: "gemini",
        apiKey: process.env.GEMINI_API_KEY ?? "",
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      },
      // ── 1st choice: OpenRouter ────────────────────────────
      // 29+ free models, good for code generation
      // Best free model for app-builder: deepseek-v3-0324:free
      {
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY ?? "",
        model: process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free",
        baseUrl: "https://openrouter.ai/api/v1",
      },


      // ── 3rd choice: Mistral ───────────────────────────────
      // Experiment plan: 1 billion tokens/month FREE, no credit card
      // codestral-latest is excellent for code generation tasks
      {
        name: "mistral",
        apiKey: process.env.MISTRAL_API_KEY ?? "",
        model: process.env.MISTRAL_MODEL ?? "codestral-latest",
        baseUrl: "https://api.mistral.ai/v1",
      },

    ],
    cooldownMs,
    verbose
  );
}

const g = globalThis as typeof globalThis & { __aiRouter?: AIFallbackRouter };
export const aiRouter: AIFallbackRouter =
  g.__aiRouter ?? (g.__aiRouter = buildRouter());