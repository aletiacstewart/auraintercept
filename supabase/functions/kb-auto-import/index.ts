// kb-auto-import: Pulls content from a website URL or pasted text and uses Lovable AI
// to extract structured Knowledge Base data (services, hours, FAQs, smart links, content profile).
// Returns a structured object the wizard can persist directly via the regular client RLS-safe upserts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_FETCH_BYTES = 600_000; // ~600KB of HTML is plenty
const MAX_TEXT_CHARS = 18_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebsiteText(url: string): Promise<string> {
  const u = new URL(url);
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }
  const resp = await fetch(u.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AuraInterceptKBImporter/1.0; +https://auraintercept.ai)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  const reader = resp.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < MAX_FETCH_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const html = new TextDecoder().decode(
    new Uint8Array(chunks.reduce<number[]>((acc, c) => acc.concat(Array.from(c)), [])),
  );
  return stripHtml(html).slice(0, MAX_TEXT_CHARS);
}

const EXTRACTION_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_knowledge_base",
    description:
      "Extract structured Knowledge Base data for a home-service business from raw text.",
    parameters: {
      type: "object",
      properties: {
        services: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              price: { type: ["number", "null"] },
            },
            required: ["name", "description"],
            additionalProperties: false,
          },
        },
        business_hours: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: {
                type: "string",
                enum: [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ],
              },
              open: { type: "string", description: "HH:MM 24h" },
              close: { type: "string", description: "HH:MM 24h" },
              is_closed: { type: "boolean" },
            },
            required: ["day", "is_closed"],
            additionalProperties: false,
          },
        },
        faqs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        smart_links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              url: { type: "string" },
            },
            required: ["label", "url"],
            additionalProperties: false,
          },
        },
        content_profile: {
          type: "object",
          properties: {
            primary_industry: { type: "string" },
            business_description: { type: "string" },
            target_audience: { type: "string" },
            tone: { type: "string" },
            brand_voice: { type: "string" },
            unique_selling_points: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            content_topics: { type: "array", items: { type: "string" } },
          },
          additionalProperties: false,
        },
        company_info: {
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      required: ["services", "faqs", "content_profile"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body.url;
    const rawText: string | undefined = body.text;

    if (!url && !rawText) {
      return new Response(
        JSON.stringify({ error: "Provide either `url` or `text`" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sourceText = "";
    let sourceLabel = "";
    if (url) {
      try {
        sourceText = await fetchWebsiteText(url);
        sourceLabel = `Website: ${url}`;
      } catch (e) {
        return new Response(
          JSON.stringify({
            error: `Could not fetch website: ${e instanceof Error ? e.message : "unknown"}`,
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else if (rawText) {
      sourceText = rawText.slice(0, MAX_TEXT_CHARS);
      sourceLabel = "Pasted text / document content";
    }

    if (sourceText.length < 80) {
      return new Response(
        JSON.stringify({ error: "Source content too short to extract a Knowledge Base." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { response: aiResp, modelUsed: aiRespModel, fellBackFromPrimary: aiRespFellBack } = await callAIGatewayWithFallback({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract structured Knowledge Base data for home-service businesses. " +
              "Only include facts present or clearly implied in the source. Use null/empty when unknown. " +
              "For services: be specific (e.g., 'AC tune-up' not 'service'). " +
              "For business_hours: include all 7 days; mark closed days with is_closed=true. " +
              "For FAQs: write practical Q&As a customer would ask (pricing, scheduling, warranty, areas served). " +
              "Keep descriptions short and natural — no marketing fluff.",
          },
          {
            role: "user",
            content: `Source: ${sourceLabel}\n\n---\n${sourceText}`,
          },
        ],
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: "function", function: { name: "extract_knowledge_base" } },
      });
    if (aiRespFellBack) console.warn(`[kb-auto-import] primary model unavailable, served by ${aiRespModel}`);

    if (!aiResp.ok) {
      const text = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("AI gateway error:", aiResp.status, text);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, source: sourceLabel, extracted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("kb-auto-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
