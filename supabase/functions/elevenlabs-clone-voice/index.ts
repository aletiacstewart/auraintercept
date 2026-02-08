import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const companyId = formData.get('company_id') as string;
    const voiceName = formData.get('voice_name') as string;
    const voiceDescription = formData.get('voice_description') as string;

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    if (!voiceName) {
      throw new Error('Voice name is required');
    }

    // Get audio files from form data
    const audioFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('audio_') && value instanceof File) {
        audioFiles.push(value);
      }
    }

    if (audioFiles.length === 0) {
      throw new Error('At least one audio sample is required');
    }

    console.log(`Voice cloning request for company ${companyId}: "${voiceName}" with ${audioFiles.length} samples`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch company's ElevenLabs credentials
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('elevenlabs_api_key')
      .eq('company_id', companyId)
      .maybeSingle();

    if (integrationError) {
      console.error('Error fetching integration:', integrationError);
      throw new Error('Failed to fetch integration settings');
    }

    if (!integration?.elevenlabs_api_key) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Prepare form data for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', voiceName);
    
    if (voiceDescription) {
      elevenLabsFormData.append('description', voiceDescription);
    }

    // Add all audio files
    for (const file of audioFiles) {
      elevenLabsFormData.append('files', file, file.name);
    }

    console.log('Sending request to ElevenLabs voice cloning API...');

    // Call ElevenLabs Add Voice API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': integration.elevenlabs_api_key,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // Parse error for better messaging
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail?.message || errorJson.detail || `ElevenLabs API error: ${response.status}`);
      } catch {
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Voice cloned successfully:', result);

    // Optionally update the company's voice ID to the new cloned voice
    const { error: updateError } = await supabase
      .from('tenant_integrations')
      .update({ elevenlabs_voice_id: result.voice_id })
      .eq('company_id', companyId);

    if (updateError) {
      console.error('Error updating voice ID:', updateError);
      // Don't throw - voice was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        voice_id: result.voice_id,
        name: voiceName,
        message: 'Voice cloned successfully!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Voice cloning error:', error);
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
