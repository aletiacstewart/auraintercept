import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { error } = await supabase
      .from('tts_usage')
      .update({ 
        characters_used: existing.characters_used + charactersUsed,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('month_year', monthYear);
    
    if (error) {
      console.error('Failed to update TTS usage:', error);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('tts_usage')
      .insert({
        company_id: companyId,
        month_year: monthYear,
        characters_used: charactersUsed
      });
    
    if (error) {
      console.error('Failed to insert TTS usage:', error);
    }
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
    // Allow on error to not block legitimate requests
    return { allowed: true, used: 0, remaining: limit };
  }
  
  const used = data?.characters_used || 0;
  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, company_id, voice_id, api_key, voice_settings: customSettings } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    let elevenLabsApiKey: string;
    let voiceId: string;
    let voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      speed: 1.0,
    };
    let usingPlatformKey = false;
    let companyIdForTracking: string | null = null;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preview mode: use provided api_key and voice_id directly
    if (api_key && voice_id) {
      console.log(`TTS preview request with voice ${voice_id}`);
      elevenLabsApiKey = api_key;
      voiceId = voice_id;
      // Use custom settings if provided
      if (customSettings) {
        voiceSettings = { ...voiceSettings, ...customSettings };
      }
    } else {
      // Production mode: look up from tenant_integrations
      if (!company_id) {
        throw new Error('Company ID is required');
      }

      console.log(`TTS request for company ${company_id}: "${text.substring(0, 50)}..."`);

      // Fetch company's ElevenLabs credentials and voice settings
      const { data: integration, error: integrationError } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id, elevenlabs_voice_stability, elevenlabs_voice_similarity, elevenlabs_voice_style, elevenlabs_voice_speed, use_platform_tts, tts_monthly_limit')
        .eq('company_id', company_id)
        .maybeSingle();

      if (integrationError) {
        console.error('Error fetching integration:', integrationError);
        throw new Error('Failed to fetch integration settings');
      }

      // Check if company has their own API key
      if (integration?.elevenlabs_api_key) {
        console.log('Using company-specific ElevenLabs API key');
        elevenLabsApiKey = integration.elevenlabs_api_key;
        voiceId = integration.elevenlabs_voice_id || 'JBFqnCBsd6RMkjVDRZzb';
        voiceSettings = {
          stability: integration.elevenlabs_voice_stability ?? 0.5,
          similarity_boost: integration.elevenlabs_voice_similarity ?? 0.75,
          style: integration.elevenlabs_voice_style ?? 0.5,
          speed: integration.elevenlabs_voice_speed ?? 1.0,
        };
      } 
      // Check if platform TTS is enabled for this company
      else if (integration?.use_platform_tts) {
        const platformKey = Deno.env.get('PLATFORM_ELEVENLABS_API_KEY');
        if (!platformKey) {
          console.error('Platform TTS enabled but PLATFORM_ELEVENLABS_API_KEY not configured');
          throw new Error('Platform TTS not available');
        }

        // Check usage limit
        const monthlyLimit = integration.tts_monthly_limit || 10000;
        const usageCheck = await checkUsageLimit(supabase, company_id, monthlyLimit);
        
        if (!usageCheck.allowed) {
          console.log(`Company ${company_id} exceeded TTS limit: ${usageCheck.used}/${monthlyLimit}`);
          throw new Error(`Monthly TTS limit exceeded. Used ${usageCheck.used} of ${monthlyLimit} characters. Limit resets next month.`);
        }

        console.log(`Using platform ElevenLabs API key for company ${company_id}. Usage: ${usageCheck.used}/${monthlyLimit}`);
        elevenLabsApiKey = platformKey;
        voiceId = integration.elevenlabs_voice_id || 'JBFqnCBsd6RMkjVDRZzb';
        usingPlatformKey = true;
        companyIdForTracking = company_id;
        
        // Use voice settings if configured
        voiceSettings = {
          stability: integration.elevenlabs_voice_stability ?? 0.5,
          similarity_boost: integration.elevenlabs_voice_similarity ?? 0.75,
          style: integration.elevenlabs_voice_style ?? 0.5,
          speed: integration.elevenlabs_voice_speed ?? 1.0,
        };
      } else {
        throw new Error('ElevenLabs API key not configured. Please add your own API key or contact admin to enable platform TTS.');
      }
    }
    
    console.log(`Using voice ID: ${voiceId}`);

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            use_speaker_boost: true,
            speed: voiceSettings.speed,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Return the audio as binary
    const audioBuffer = await response.arrayBuffer();
    
    console.log(`TTS generated successfully, audio size: ${audioBuffer.byteLength} bytes`);

    // Track usage if using platform key
    if (usingPlatformKey && companyIdForTracking) {
      await trackUsage(supabase, companyIdForTracking, text.length);
      console.log(`Tracked ${text.length} characters for company ${companyIdForTracking}`);
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
