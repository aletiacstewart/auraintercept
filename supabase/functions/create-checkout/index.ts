import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// LAUNCH PRICING (active): Core $497 · Boost $897 · Pro $1,797 · Elite $3,097.
// Onboarding fees are 50% of new monthly, rounded: $249 / $449 / $899 / $1,549.
// Original (struck-through) pricing: $697 / $1,097 / $1,997 / $3,497.
const CORE = {
  name: "Aura Core",
  price: 49700,
  price_id: "price_1TeereJ9fo9y8fGHzz419yW6",
  onboarding_price_id: "price_1TeerhJ9fo9y8fGHqxIcNkSa",
};
const BOOST = {
  name: "Aura Boost",
  price: 89700,
  price_id: "price_1TeerfJ9fo9y8fGHX2tAGIVR",
  onboarding_price_id: "price_1TeeriJ9fo9y8fGHfhWNll0O",
};
const PRO = {
  name: "Aura Pro",
  price: 179700,
  price_id: "price_1TeerfJ9fo9y8fGHxdXiHqSg",
  onboarding_price_id: "price_1TeerjJ9fo9y8fGH3WaiwV2o",
};
const ELITE = {
  name: "Aura Elite",
  price: 309700,
  price_id: "price_1TeergJ9fo9y8fGHMwqU7pMV",
  onboarding_price_id: "price_1TeerkJ9fo9y8fGHCV3tC51t",
};
const SUBSCRIPTION_TIERS: Record<string, typeof CORE> = {
  // Canonical 4 tiers
  starter: CORE,
  connect: BOOST,
  performance: PRO,
  command: ELITE,
  // Legacy tier aliases → map to canonical 4 tiers
  core: CORE,
  express: CORE,
  aura_flow: CORE,
  halo: CORE,
  scheduling: CORE,
  growth: BOOST,
  field_ops: BOOST,
  single_point: BOOST,
  business: PRO,
  multi_track: PRO,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = roleData?.role;
    logStep("User role checked", { role: userRole });

    if (userRole === 'employee') {
      throw new Error("Only company administrators can manage subscriptions. Please contact your admin.");
    }
    
    if (userRole === 'customer') {
      throw new Error("Customers cannot subscribe directly. Your access is provided through the company you work with.");
    }

    if (userRole !== 'company_admin' && userRole !== 'platform_admin') {
      throw new Error("Only company administrators can manage subscriptions");
    }

    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profileData?.company_id) {
      throw new Error("Your account is not associated with a company");
    }

    const companyId = profileData.company_id;
    logStep("Company ID found", { companyId });

    const { data: companyData, error: companyError } = await supabaseClient
      .from('companies')
      .select('id, name, email, stripe_customer_id')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      throw new Error("Failed to fetch company data");
    }
    logStep("Company data fetched", { companyName: companyData.name });

    let requestedTier = "command";
    try {
      const body = await req.json();
      if (body.tier && SUBSCRIPTION_TIERS[body.tier]) {
        requestedTier = body.tier;
      }
    } catch {
      // No body or invalid JSON, use default tier
    }

    const selectedTier = SUBSCRIPTION_TIERS[requestedTier];
    logStep("Selected tier", { tier: requestedTier, name: selectedTier.name, price: selectedTier.price });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let customerId = companyData.stripe_customer_id;
    
    if (customerId) {
      logStep("Found existing Stripe customer for company", { customerId });
    } else {
      const customer = await stripe.customers.create({
        name: companyData.name,
        email: companyData.email || user.email,
        metadata: { 
          company_id: companyId,
          admin_user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep("Created new Stripe customer for company", { customerId });

      const { error: updateError } = await supabaseClient
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', companyId);

      if (updateError) {
        logStep("Warning: Failed to save stripe_customer_id to company", { error: updateError.message });
      } else {
        logStep("Saved stripe_customer_id to company");
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Detect existing subscriptions for this customer so we only charge the
    // one-time onboarding fee on the FIRST checkout (new signups), not on
    // plan changes or renewals.
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    const isFirstCheckout = existingSubs.data.length === 0;
    logStep("Onboarding fee eligibility", { isFirstCheckout });

    const lineItems: Array<{ price: string; quantity: number }> = [
      { price: selectedTier.price_id, quantity: 1 },
    ];
    if (isFirstCheckout && selectedTier.onboarding_price_id) {
      lineItems.push({ price: selectedTier.onboarding_price_id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/dashboard/subscription?success=true`,
      cancel_url: `${origin}/dashboard/subscription?canceled=true`,
      metadata: {
        company_id: companyId,
        admin_user_id: user.id,
        tier: requestedTier,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url, tier: requestedTier });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
