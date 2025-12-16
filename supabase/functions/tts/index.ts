import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Unified TTS router that routes to the appropriate provider based on company settings
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, company_id } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company's TTS provider preference
    const { data: integration, error } = await supabase
      .from("tenant_integrations")
      .select(`
        tts_provider,
        elevenlabs_api_key,
        elevenlabs_voice_id,
        elevenlabs_voice_stability,
        elevenlabs_voice_similarity,
        elevenlabs_voice_style,
        elevenlabs_voice_speed,
        openai_api_key,
        openai_tts_voice,
        openai_tts_model,
        google_tts_api_key,
        google_tts_voice,
        google_tts_model
      `)
      .eq("company_id", company_id)
      .single();

    if (error) {
      console.error("Failed to fetch integration settings:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch TTS settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = integration?.tts_provider || "elevenlabs";
    console.log(`TTS Router: Using provider ${provider} for company ${company_id}`);

    let audioResponse: Response;

    switch (provider) {
      case "openai":
        if (!integration?.openai_api_key) {
          return new Response(
            JSON.stringify({ error: "OpenAI TTS not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${integration.openai_api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: integration.openai_tts_model || "tts-1",
            input: text,
            voice: integration.openai_tts_voice || "alloy",
            response_format: "mp3",
          }),
        });
        break;

      case "google":
        if (!integration?.google_tts_api_key) {
          return new Response(
            JSON.stringify({ error: "Google TTS not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const googleVoice = integration.google_tts_voice || "en-US-Neural2-D";
        const languageCode = googleVoice.split("-").slice(0, 2).join("-") || "en-US";
        
        const googleResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${integration.google_tts_api_key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode, name: googleVoice },
              audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
            }),
          }
        );
        
        if (!googleResponse.ok) {
          const errorText = await googleResponse.text();
          console.error("Google TTS error:", errorText);
          return new Response(
            JSON.stringify({ error: "Google TTS failed" }),
            { status: googleResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const googleData = await googleResponse.json();
        const binaryString = atob(googleData.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Response(bytes, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
        });

      case "elevenlabs":
      default:
        if (!integration?.elevenlabs_api_key) {
          return new Response(
            JSON.stringify({ error: "ElevenLabs TTS not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const voiceId = integration.elevenlabs_voice_id || "JBFqnCBsd6RMkjVDRZzb";
        audioResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": integration.elevenlabs_api_key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: integration.elevenlabs_voice_stability || 0.5,
                similarity_boost: integration.elevenlabs_voice_similarity || 0.75,
                style: integration.elevenlabs_voice_style || 0.5,
                use_speaker_boost: true,
              },
            }),
          }
        );
        break;
    }

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error(`${provider} TTS error:`, audioResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `${provider} TTS failed: ${audioResponse.status}` }),
        { status: audioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS Router error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
