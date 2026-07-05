import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const BRAND_TERMS = [
  'Aura', 'Aura Intercept', 'Operative', 'Operatives',
  'Core', 'Boost', 'Pro', 'Elite', 'Launch Pricing',
  'Cyber-Sentry', 'SignalWire', 'ElevenLabs', 'Tavily', 'Stripe', 'Resend',
];

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { texts, target = 'es' } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ results: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clean = [...new Set(texts.filter((t: unknown) => typeof t === 'string' && t.trim().length > 0))].slice(0, 100) as string[];
    const hashes = await Promise.all(clean.map(sha256));
    const hashToText = new Map<string, string>();
    clean.forEach((t, i) => hashToText.set(hashes[i], t));

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check cache
    const { data: cached } = await supabase
      .from('ui_translations')
      .select('text_hash, translated_text')
      .in('text_hash', hashes)
      .eq('target_lang', target);

    const results: Record<string, string> = {};
    const cachedHashes = new Set<string>();
    for (const row of cached ?? []) {
      results[row.text_hash] = row.translated_text;
      cachedHashes.add(row.text_hash);
    }

    const missing = [...hashToText.entries()].filter(([h]) => !cachedHashes.has(h));

    if (missing.length > 0) {
      const langName = target === 'es' ? 'Spanish (Latin American, neutral)' : target;
      const numbered = missing.map(([, t], i) => `${i + 1}. ${t}`).join('\n');
      const systemPrompt = `You are a professional UI translator. Translate the following numbered UI strings into ${langName}.

Rules:
- Return ONLY a JSON array of strings, same length and order as input.
- Preserve placeholders like {name}, {{count}}, %s, and HTML tags exactly.
- Keep these brand terms unchanged: ${BRAND_TERMS.join(', ')}.
- Keep tone concise and product-appropriate.
- No explanations, no markdown, no numbering — just the JSON array.`;

      const { response: aiResp, modelUsed: aiRespModel, fellBackFromPrimary: aiRespFellBack } = await callAIGatewayWithFallback({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: numbered },
          ],
        });
      if (aiRespFellBack) console.warn(`[translate-ui] primary model unavailable, served by ${aiRespModel}`);

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error('AI gateway error', aiResp.status, errText);
        if (aiResp.status === 429 || aiResp.status === 402) {
          return new Response(JSON.stringify({ results, error: 'rate_limited' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ results, error: 'ai_error' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResp.json();
      let content: string = aiData.choices?.[0]?.message?.content ?? '[]';
      // Strip markdown code fences if present
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed: string[] = [];
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error('Failed to parse AI response', content.slice(0, 500));
      }

      if (Array.isArray(parsed) && parsed.length === missing.length) {
        const rows: Array<Record<string, string>> = [];
        missing.forEach(([hash, source], i) => {
          const translated = String(parsed[i] ?? source);
          results[hash] = translated;
          rows.push({
            text_hash: hash,
            target_lang: target,
            source_lang: 'en',
            source_text: source,
            translated_text: translated,
          });
        });
        // Best-effort cache write
        await supabase.from('ui_translations').upsert(rows, { onConflict: 'text_hash,target_lang' });
      } else {
        // Fallback: return originals
        missing.forEach(([hash, source]) => { results[hash] = source; });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('translate-ui error', e);
    return new Response(JSON.stringify({ results: {}, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});