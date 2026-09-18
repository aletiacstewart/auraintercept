// Generic AI chat proxy used by the in-app Help Center (AIHelpCenter.tsx).
// Accepts an OpenAI-style { messages, model } body and returns the gateway's
// chat/completions JSON unchanged so the client can read choices[0].message.
import { callAIGatewayWithFallback } from '../_shared/ai-gateway.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const model = typeof body?.model === 'string' ? body.model : DEFAULT_MODEL;

    const { response, modelUsed, fellBackFromPrimary } =
      await callAIGatewayWithFallback({ model, messages });

    if (fellBackFromPrimary) {
      console.warn(`[lovable-ai] primary model unavailable, served by ${modelUsed}`);
    }

    if (!response.ok) {
      const details = await response.text();
      console.error(`[lovable-ai] gateway error ${response.status}: ${details}`);
      const message =
        response.status === 429
          ? 'Too many requests right now. Please try again in a moment.'
          : response.status === 402
            ? 'AI credits are exhausted for this workspace.'
            : 'The AI service returned an error.';
      return new Response(JSON.stringify({ error: message, status: response.status, details }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[lovable-ai] error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
