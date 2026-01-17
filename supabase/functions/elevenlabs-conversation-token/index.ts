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

    // === SUBSCRIPTION TIER GATING FOR VOICE ===
    // Voice features require the Command tier (or active trial)
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("subscription_tier, trial_ends_at")
      .eq("id", company_id)
      .single();

    if (companyError) {
      console.error("Error fetching company tier:", companyError);
      return new Response(
        JSON.stringify({ 
          error: "company_not_found",
          message: "Unable to verify company subscription."
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const subscriptionTier = companyData?.subscription_tier || "free";
    const trialEndsAt = companyData?.trial_ends_at;
    const inTrial = trialEndsAt && new Date(trialEndsAt) > new Date();

    // Voice is only available for Command tier or during trial
    const voiceTiers = ["command"];
    const hasVoiceAccess = inTrial || voiceTiers.includes(subscriptionTier);

    if (!hasVoiceAccess) {
      console.log(`[ElevenLabs Token] Voice locked for company ${company_id}: tier=${subscriptionTier}, trial=${inTrial}`);
      return new Response(
        JSON.stringify({ 
          error: "voice_locked",
          message: "Voice features require the Command tier subscription.",
          current_tier: subscriptionTier,
          required_tier: "command"
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

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
    // ElevenLabs sometimes displays IDs with an "agent_" prefix, but some accounts store/use the raw id.
    // We'll try both forms (raw + prefixed) to avoid hard failures.
    const storedAgentId = (agent_id || integration.elevenlabs_agent_id || "").trim();

    const candidates = (() => {
      if (!storedAgentId) return [] as string[];
      if (storedAgentId.startsWith("agent_")) {
        return [storedAgentId, storedAgentId.replace(/^agent_/, "")];
      }
      return [storedAgentId, `agent_${storedAgentId}`];
    })();

    const getConversationToken = async (candidateAgentId: string) => {
      console.log("Getting WebRTC token for agent:", candidateAgentId);
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${candidateAgentId}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );
      return response;
    };

    const getSignedUrl = async (candidateAgentId: string) => {
      console.log("Getting signed URL for agent:", candidateAgentId);
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${candidateAgentId}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );
      return response;
    };

    if (candidates.length > 0) {
      let lastStatus = 500;
      let lastErrorText = "";

      for (const candidate of candidates) {
        // Prefer WebRTC token (more stable than websocket signed_url)
        const tokenRes = await getConversationToken(candidate);
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          console.log("Got WebRTC token for agent");
          return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fallback to websocket signed_url
        const signedRes = await getSignedUrl(candidate);
        if (signedRes.ok) {
          const { signed_url } = await signedRes.json();
          console.log("Got signed URL for agent");
          return new Response(JSON.stringify({ signed_url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Capture error details and decide whether to try other formats
        lastStatus = signedRes.status || tokenRes.status || 500;
        lastErrorText = await signedRes.text().catch(async () => await tokenRes.text());
        console.error("ElevenLabs API error:", lastStatus, lastErrorText);

        // If it's not a 404, don't retry other formats.
        if (lastStatus !== 404) break;
      }

      // Build a helpful error.
      let details = lastErrorText;
      if (lastStatus === 404) {
        details = `Agent ID "${storedAgentId}" was not found (tried: ${candidates.join(", ")}). Please verify the agent exists and update it in Integrations settings.`;
      } else if (lastStatus === 401) {
        details = "Invalid ElevenLabs API key. Please check your API key in Integrations settings.";
      }

      return new Response(JSON.stringify({ error: `ElevenLabs API error: ${lastStatus}`, details }), {
        status: lastStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Return the API key for direct connection (less secure but works without pre-configured agent)
      // The frontend will use the public agent approach
      console.log("No agent_id provided, returning API key for public connection");

      return new Response(
        JSON.stringify({
          api_key: ELEVENLABS_API_KEY,
          voice_id: integration.elevenlabs_voice_id || "JBFqnCBsd6RMkjVDRZzb", // Default to George voice
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
