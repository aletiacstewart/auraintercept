import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteId } = await req.json();

    if (!websiteId) {
      return new Response(
        JSON.stringify({ error: 'websiteId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch website data
    const { data: website, error: fetchError } = await supabase
      .from('smart_websites')
      .select('custom_domain, dns_verification_code')
      .eq('id', websiteId)
      .single();

    if (fetchError || !website) {
      return new Response(
        JSON.stringify({ error: 'Website not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!website.custom_domain) {
      return new Response(
        JSON.stringify({ error: 'No custom domain configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domain = website.custom_domain;
    const verificationCode = website.dns_verification_code;

    // Verify CNAME record
    let cnameValid = false;
    try {
      const cnameRecords = await Deno.resolveDns(domain, "CNAME");
      cnameValid = cnameRecords.some((record: string) => 
        record.toLowerCase().includes('site.auraintercept.app')
      );
    } catch (e) {
      console.log('CNAME lookup failed:', e);
    }

    // Verify TXT record
    let txtValid = false;
    try {
      const txtRecords = await Deno.resolveDns(`_aura-verify.${domain}`, "TXT");
      txtValid = txtRecords.flat().some((record: string) => 
        record.includes(verificationCode)
      );
    } catch (e) {
      console.log('TXT lookup failed:', e);
    }

    // Update database if both valid
    if (cnameValid && txtValid) {
      const { error: updateError } = await supabase
        .from('smart_websites')
        .update({ domain_verified: true })
        .eq('id', websiteId);

      if (updateError) {
        console.error('Failed to update domain_verified:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          verified: true,
          cnameValid: true,
          txtValid: true,
          message: 'Domain verified successfully!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return detailed feedback
    let message = '';
    if (!cnameValid && !txtValid) {
      message = 'No DNS records found yet. Please wait for propagation (15 min - 48 hours).';
    } else if (!cnameValid) {
      message = 'CNAME record not found or incorrect. It should point to site.auraintercept.app';
    } else {
      message = 'TXT verification record not found. Check _aura-verify.' + domain;
    }

    return new Response(
      JSON.stringify({
        verified: false,
        cnameValid,
        txtValid,
        message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying domain:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
