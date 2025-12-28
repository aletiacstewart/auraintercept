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

    // Fetch company's ElevenLabs API key and agent ID from tenant_integrations
    const { data: integration, error: integrationError } = await supabase
      .from("tenant_integrations")
      .select("elevenlabs_api_key, elevenlabs_voice_id, elevenlabs_agent_id")
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

    // Use agent_id from request, or fall back to company's configured agent_id.
    // Normalize to ElevenLabs' expected format ("agent_...") in case the UI stored the raw id.
    const rawAgentId = (agent_id || integration.elevenlabs_agent_id || "").trim();
    const effectiveAgentId = rawAgentId
      ? rawAgentId.startsWith("agent_")
        ? rawAgentId
        : `agent_${rawAgentId}`
      : null;
    
    if (effectiveAgentId) {
      // Get conversation token for existing agent
      console.log("Getting token for agent:", effectiveAgentId);
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${effectiveAgentId}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", response.status, errorText);
        
        // Parse the error for a more helpful message
        let details = errorText;
        if (response.status === 404) {
          details = `Agent ID "${effectiveAgentId}" was not found. Please verify it exists in your ElevenLabs dashboard and update the Agent ID in Integrations settings.`;
        } else if (response.status === 401) {
          details = "Invalid ElevenLabs API key. Please check your API key in Integrations settings.";
        }
        
        return new Response(
          JSON.stringify({ error: `ElevenLabs API error: ${response.status}`, details }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
