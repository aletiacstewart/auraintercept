import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    let googleApiKey = api_key;
    let selectedVoice = voice || "en-US-Neural2-D";
    let selectedModel = model || "neural2";

    // If company_id provided, fetch settings from database
    if (company_id && !api_key) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: integration, error } = await supabase
        .from("tenant_integrations")
        .select("google_tts_api_key, google_tts_voice, google_tts_model")
        .eq("company_id", company_id)
        .single();

      if (error || !integration?.google_tts_api_key) {
        console.error("Failed to fetch Google TTS integration:", error);
        return new Response(
          JSON.stringify({ error: "Google TTS not configured for this company" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      googleApiKey = integration.google_tts_api_key;
      selectedVoice = integration.google_tts_voice || "en-US-Neural2-D";
      selectedModel = integration.google_tts_model || "neural2";
    }

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Cloud API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse voice name to extract language code
    const languageCode = selectedVoice.split("-").slice(0, 2).join("-") || "en-US";
    
    console.log(`Generating Google TTS: voice=${selectedVoice}, model=${selectedModel}, language=${languageCode}, text length=${text.length}`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            name: selectedVoice,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google TTS API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Google TTS failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Google returns base64 encoded audio in audioContent field
    if (!data.audioContent) {
      return new Response(
        JSON.stringify({ error: "No audio content in response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 to binary
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Google TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
