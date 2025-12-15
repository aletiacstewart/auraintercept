import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, company_id, voice_id, api_key } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    let elevenLabsApiKey: string;
    let voiceId: string;

    // Preview mode: use provided api_key and voice_id directly
    if (api_key && voice_id) {
      console.log(`TTS preview request with voice ${voice_id}`);
      elevenLabsApiKey = api_key;
      voiceId = voice_id;
    } else {
      // Production mode: look up from tenant_integrations
      if (!company_id) {
        throw new Error('Company ID is required');
      }

      console.log(`TTS request for company ${company_id}: "${text.substring(0, 50)}..."`);

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch company's ElevenLabs credentials
      const { data: integration, error: integrationError } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id')
        .eq('company_id', company_id)
        .maybeSingle();

      if (integrationError) {
        console.error('Error fetching integration:', integrationError);
        throw new Error('Failed to fetch integration settings');
      }

      if (!integration?.elevenlabs_api_key) {
        throw new Error('ElevenLabs API key not configured');
      }

      elevenLabsApiKey = integration.elevenlabs_api_key;
      // Use company's voice ID or default to a standard voice
      voiceId = integration.elevenlabs_voice_id || 'JBFqnCBsd6RMkjVDRZzb'; // George - default voice
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
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
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
