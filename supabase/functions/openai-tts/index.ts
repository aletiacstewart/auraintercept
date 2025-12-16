import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, company_id, voice, model, api_key } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let openaiApiKey = api_key;
    let selectedVoice = voice || "alloy";
    let selectedModel = model || "tts-1";

    // If company_id provided, fetch settings from database
    if (company_id && !api_key) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: integration, error } = await supabase
        .from("tenant_integrations")
        .select("openai_api_key, openai_tts_voice, openai_tts_model")
        .eq("company_id", company_id)
        .single();

      if (error || !integration?.openai_api_key) {
        console.error("Failed to fetch OpenAI integration:", error);
        return new Response(
          JSON.stringify({ error: "OpenAI TTS not configured for this company" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      openaiApiKey = integration.openai_api_key;
      selectedVoice = integration.openai_tts_voice || "alloy";
      selectedModel = integration.openai_tts_model || "tts-1";
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating OpenAI TTS: voice=${selectedVoice}, model=${selectedModel}, text length=${text.length}`);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        input: text,
        voice: selectedVoice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI TTS API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI TTS failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("OpenAI TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
