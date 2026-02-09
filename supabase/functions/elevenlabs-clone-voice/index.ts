import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const formData = await req.formData();
    const companyId = formData.get("company_id") as string;
    const voiceName = formData.get("voice_name") as string;
    const voiceDescription = (formData.get("voice_description") as string) || "";

    if (!companyId || !voiceName) {
      return new Response(JSON.stringify({ error: "company_id and voice_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ElevenLabs API key
    const { data: integration } = await supabase
      .from("tenant_integrations")
      .select("elevenlabs_api_key")
      .eq("company_id", companyId)
      .maybeSingle();

    const apiKey = integration?.elevenlabs_api_key;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build FormData for ElevenLabs
    const elForm = new FormData();
    elForm.append("name", voiceName);
    if (voiceDescription) {
      elForm.append("description", voiceDescription);
    }

    // Collect audio files
    let audioIndex = 0;
    while (formData.has(`audio_${audioIndex}`)) {
      const audioFile = formData.get(`audio_${audioIndex}`) as File;
      if (audioFile) {
        elForm.append("files", audioFile, audioFile.name || `sample_${audioIndex}.mp3`);
      }
      audioIndex++;
    }

    if (audioIndex === 0) {
      return new Response(JSON.stringify({ error: "At least one audio sample is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call ElevenLabs Voice Cloning API
    const elResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: elForm,
    });

    const responseText = await elResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("ElevenLabs response not JSON:", responseText.substring(0, 200));
      throw new Error("Invalid response from ElevenLabs");
    }

    if (!elResponse.ok) {
      console.error("ElevenLabs clone error:", elResponse.status, responseText);
      return new Response(JSON.stringify({
        error: responseData.detail?.message || "Voice cloning failed",
      }), {
        status: elResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceId = responseData.voice_id;

    // Update tenant_integrations with the new voice ID
    await supabase
      .from("tenant_integrations")
      .update({ elevenlabs_voice_id: voiceId })
      .eq("company_id", companyId);

    return new Response(JSON.stringify({
      voice_id: voiceId,
      voice_name: voiceName,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("elevenlabs-clone-voice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
