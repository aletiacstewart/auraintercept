// Shared Lovable AI Gateway helper with automatic model fallback.
//
// When the primary model returns 429 (rate-limited) or 5xx, we retry once
// against the next model in the same family before surfacing the error.
// 402 (credits exhausted) is NOT retried — it's a hard workspace-level
// signal that the operator must act on.
//
// Consumers get back the raw Response plus metadata about which model
// actually served the request so they can log/surface it.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Ordered fallback chain per model family. Same-family fallbacks preserve
 *  tool-calling shape, structured-output support, and multimodal caps. */
export const MODEL_FALLBACK_CHAIN: Record<string, string[]> = {
  // Google Gemini family
  "google/gemini-2.5-pro": ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
  "google/gemini-2.5-flash": ["google/gemini-2.5-flash-lite"],
  "google/gemini-2.5-flash-lite": [],
  "google/gemini-3.1-pro-preview": ["google/gemini-2.5-pro", "google/gemini-2.5-flash"],
  "google/gemini-3.1-flash-lite": ["google/gemini-2.5-flash-lite"],
  "google/gemini-3.5-flash": ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
  "google/gemini-3-flash-preview": ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],

  // OpenAI GPT-5 family
  "openai/gpt-5": ["openai/gpt-5-mini", "openai/gpt-5-nano"],
  "openai/gpt-5-mini": ["openai/gpt-5-nano"],
  "openai/gpt-5-nano": [],
  "openai/gpt-5.2": ["openai/gpt-5-mini"],
  "openai/gpt-5.4": ["openai/gpt-5.4-mini", "openai/gpt-5.4-nano"],
  "openai/gpt-5.4-mini": ["openai/gpt-5.4-nano"],
  "openai/gpt-5.4-nano": [],
  "openai/gpt-5.4-pro": ["openai/gpt-5.4", "openai/gpt-5.4-mini"],
  "openai/gpt-5.5": ["openai/gpt-5.4", "openai/gpt-5-mini"],
  "openai/gpt-5.5-pro": ["openai/gpt-5.5", "openai/gpt-5.4"],
};

export interface GatewayCallResult {
  response: Response;
  modelUsed: string;
  fellBackFromPrimary: boolean;
  attempts: Array<{ model: string; status: number }>;
}

/** Build the fallback list for a model (primary excluded). Returns [] if none. */
export function getFallbacks(model: string): string[] {
  return MODEL_FALLBACK_CHAIN[model] ?? [];
}

/** Call the Lovable AI Gateway with automatic model fallback.
 *
 *  `body` is the chat/completions request body. `body.model` is overwritten
 *  on each attempt. Auth is read from `LOVABLE_API_KEY` in the function env.
 *
 *  Retries only on transient failures (429 or 5xx). Returns the FIRST
 *  successful response OR the final failed response if the entire chain
 *  exhausted. Callers should inspect `result.response.ok` themselves. */
export async function callAIGatewayWithFallback(
  body: Record<string, unknown> & { model: string },
): Promise<GatewayCallResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const primary = body.model;
  const chain = [primary, ...getFallbacks(primary)];
  const attempts: Array<{ model: string; status: number }> = [];
  let lastResponse: Response | null = null;

  for (const model of chain) {
    const attemptBody = { ...body, model };
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attemptBody),
    });
    attempts.push({ model, status: response.status });

    // Success — return immediately.
    if (response.ok) {
      return {
        response,
        modelUsed: model,
        fellBackFromPrimary: model !== primary,
        attempts,
      };
    }

    // 402 = credits exhausted; no fallback will save us.
    if (response.status === 402) {
      return { response, modelUsed: model, fellBackFromPrimary: model !== primary, attempts };
    }

    // 429 (rate limited) or 5xx — try next model in chain.
    if (response.status === 429 || response.status >= 500) {
      // Drain the body so the connection can close.
      try { await response.text(); } catch { /* ignore */ }
      console.warn(
        `[ai-gateway] model=${model} status=${response.status}; ${
          model === chain[chain.length - 1] ? "no fallback available" : "trying next model"
        }`,
      );
      lastResponse = response;
      continue;
    }

    // Other non-retryable error (400, 401, 403…). Return as-is.
    return { response, modelUsed: model, fellBackFromPrimary: model !== primary, attempts };
  }

  // All attempts exhausted — return the last failed response.
  return {
    response: lastResponse!,
    modelUsed: chain[chain.length - 1],
    fellBackFromPrimary: true,
    attempts,
  };
}