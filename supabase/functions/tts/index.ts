import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to get current month in YYYY-MM format
function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Track TTS character usage
async function trackUsage(supabase: any, companyId: string, charactersUsed: number): Promise<void> {
  const monthYear = getCurrentMonthYear();
  
  // Try to get existing record first
  const { data: existing } = await supabase
    .from('tts_usage')
    .select('characters_used')
    .eq('company_id', companyId)
    .eq('month_year', monthYear)
    .maybeSingle();
  
  if (existing) {
    // Update existing record
    await supabase
      .from('tts_usage')
      .update({ 
        characters_used: existing.characters_used + charactersUsed,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('month_year', monthYear);
  } else {
    // Insert new record
    await supabase
      .from('tts_usage')
      .insert({
        company_id: companyId,
        month_year: monthYear,
        characters_used: charactersUsed
      });
  }
}

// Check if company is under usage limit
async function checkUsageLimit(supabase: any, companyId: string, limit: number): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const monthYear = getCurrentMonthYear();
  
  const { data, error } = await supabase
    .from('tts_usage')
    .select('characters_used')
    .eq('company_id', companyId)
    .eq('month_year', monthYear)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking usage:', error);
    return { allowed: true, used: 0, remaining: limit };
  }
  
  const used = data?.characters_used || 0;
  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used)
  };
}

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
        use_platform_tts,
        tts_monthly_limit
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

    console.log(`TTS Router: Using ElevenLabs for company ${company_id}`);

    let usingPlatformKey = false;
    let apiKey = integration?.elevenlabs_api_key;
    
    // Check if company has their own key
    if (!apiKey) {
      // Check if platform TTS is enabled
      if (integration?.use_platform_tts) {
        const platformKey = Deno.env.get('PLATFORM_ELEVENLABS_API_KEY');
        if (!platformKey) {
          return new Response(
            JSON.stringify({ error: "Platform TTS not available" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check usage limit
        const monthlyLimit = integration.tts_monthly_limit || 10000;
        const usageCheck = await checkUsageLimit(supabase, company_id, monthlyLimit);
        
        if (!usageCheck.allowed) {
          console.log(`Company ${company_id} exceeded TTS limit: ${usageCheck.used}/${monthlyLimit}`);
          return new Response(
            JSON.stringify({ 
              error: `Monthly TTS limit exceeded. Used ${usageCheck.used} of ${monthlyLimit} characters. Limit resets next month.` 
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Using platform ElevenLabs API key. Usage: ${usageCheck.used}/${monthlyLimit}`);
        apiKey = platformKey;
        usingPlatformKey = true;
      } else {
        return new Response(
          JSON.stringify({ error: "ElevenLabs TTS not configured. Please add your own API key or contact admin to enable platform TTS." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const voiceId = integration?.elevenlabs_voice_id || "JBFqnCBsd6RMkjVDRZzb";
    const audioResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: integration?.elevenlabs_voice_stability || 0.5,
            similarity_boost: integration?.elevenlabs_voice_similarity || 0.75,
            style: integration?.elevenlabs_voice_style || 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error("ElevenLabs TTS error:", audioResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs TTS failed: ${audioResponse.status}` }),
        { status: audioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    // Track usage if using platform key
    if (usingPlatformKey) {
      await trackUsage(supabase, company_id, text.length);
      console.log(`Tracked ${text.length} characters for company ${company_id}`);
    }
    
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
