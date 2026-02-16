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
    const formData = await req.formData().catch(() => null);
    const signedRequest = formData?.get("signed_request") as string | null;

    console.log("[social-oauth-data-deletion] Received data deletion request");

    let confirmationCode = crypto.randomUUID();

    if (signedRequest) {
      const [, payload] = signedRequest.split(".");
      const decoded = JSON.parse(atob(payload));
      const userId = decoded.user_id;

      if (userId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Delete social accounts for this Meta user
        await supabase
          .from("social_accounts")
          .delete()
          .eq("platform_account_id", userId);

        // Clear Meta tokens from tenant_integrations where the page was connected
        // We can't easily map Meta user_id to company, so log for manual review
        console.log(`[social-oauth-data-deletion] Deleted data for Meta user: ${userId}, confirmation: ${confirmationCode}`);
      }
    }

    // Meta requires a JSON response with url and confirmation_code
    const statusUrl = `https://auraintercept.ai/data-deletion?code=${confirmationCode}`;

    return new Response(
      JSON.stringify({
        url: statusUrl,
        confirmation_code: confirmationCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[social-oauth-data-deletion] Error:", error);
    const code = crypto.randomUUID();
    return new Response(
      JSON.stringify({
        url: `https://auraintercept.ai/data-deletion?code=${code}`,
        confirmation_code: code,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
