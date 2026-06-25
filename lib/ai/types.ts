// ============================================================
//  lib/ai/types.ts
// ============================================================

// "mistral" replaces "groq" as the third free provider
export type ProviderName = "openrouter" | "gemini" | "mistral" | "huggingface";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIGenerateRequest {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResponse {
  content: string;
  provider: ProviderName;
  model: string;
  tokensUsed?: number;
}

export interface ProviderConfig {
  name: ProviderName;
  apiKey: string;
  model: string;
  baseUrl: string;
}

// HTTP codes that signal quota/billing exhaustion → switch provider
export const QUOTA_STATUS_CODES = new Set([429, 402, 403]);

// Keywords in error body that also mean quota exhausted
export const QUOTA_KEYWORDS = [
  "quota",
  "rate limit",
  "rate_limit_exceeded",
  "exceeded",
  "insufficient_quota",
  "resource_exhausted",
  "tokens_exceeded",
  "billing",
  "payment required",
  "limit reached",
  "too many requests",
];

export class ProviderError extends Error {
  constructor(
    public provider: ProviderName,
    public statusCode: number,
    public isQuotaError: boolean,
    message: string
  ) {
    super(message);
    this.name = "ProviderError";
  }
}