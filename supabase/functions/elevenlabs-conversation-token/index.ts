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
    const { company_id, agent_id } = await req.json();
    
    if (!company_id) {
      throw new Error("company_id is required");
    }

    console.log("Fetching ElevenLabs credentials for company:", company_id);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch company's ElevenLabs API key from tenant_integrations
    const { data: integration, error: integrationError } = await supabase
      .from("tenant_integrations")
      .select("elevenlabs_api_key, elevenlabs_voice_id")
      .eq("company_id", company_id)
      .single();

    if (integrationError || !integration?.elevenlabs_api_key) {
      console.error("ElevenLabs integration not found:", integrationError);
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs integration not configured for this company",
          details: "Please configure your ElevenLabs API key in the Integrations settings"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const ELEVENLABS_API_KEY = integration.elevenlabs_api_key;
    
    // If an agent_id is provided, use it; otherwise we'll need to create a temporary agent
    // For now, we'll use a signed URL approach which doesn't require a pre-configured agent
    if (agent_id) {
      // Get conversation token for existing agent
      console.log("Getting token for agent:", agent_id);
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent_id}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const { signed_url } = await response.json();
      console.log("Got signed URL for agent");

      return new Response(
        JSON.stringify({ signed_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Return the API key for direct connection (less secure but works without pre-configured agent)
      // The frontend will use the public agent approach
      console.log("No agent_id provided, returning API key for public connection");
      
      return new Response(
        JSON.stringify({ 
          api_key: ELEVENLABS_API_KEY,
          voice_id: integration.elevenlabs_voice_id || "JBFqnCBsd6RMkjVDRZzb" // Default to George voice
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in elevenlabs-conversation-token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
