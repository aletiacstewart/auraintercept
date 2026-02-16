import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Meta sends POST with signed_request
    const formData = await req.formData().catch(() => null);
    const signedRequest = formData?.get("signed_request") as string | null;

    console.log("[social-oauth-deauthorize] Received deauthorization callback");

    if (signedRequest) {
      // Parse the signed_request to get user_id
      const [, payload] = signedRequest.split(".");
      const decoded = JSON.parse(atob(payload));
      const userId = decoded.user_id;

      if (userId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Deactivate any social accounts linked to this Meta user
        await supabase
          .from("social_accounts")
          .update({ is_active: false, last_error: "User deauthorized via Meta" })
          .eq("platform_account_id", userId);

        console.log(`[social-oauth-deauthorize] Deactivated accounts for Meta user: ${userId}`);
      }
    }

    // Meta requires a 200 response
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[social-oauth-deauthorize] Error:", error);
    return new Response(
      JSON.stringify({ success: true }), // Still return 200 to Meta
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
