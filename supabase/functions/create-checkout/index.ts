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

// 3-TIER STRUCTURE: Boost ($297), Pro ($497), Elite ($697)
const SUBSCRIPTION_TIERS: Record<string, { price_id: string; name: string; price: number }> = {
  connect: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700, // $297 in cents
  },
  performance: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700, // $497 in cents
  },
  command: {
    price_id: "price_1T02YAJ9fo9y8fGHJ7Q7g4Cq",
    name: "Aura Elite",
    price: 69700, // $697 in cents
  },
  // Legacy tier aliases → map to canonical 3 tiers
  starter: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  scheduling: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  growth: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  business: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700,
  },
  field_ops: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700,
  },
  express: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  aura_flow: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  halo: {
    price_id: "price_1T0285J9fo9y8fGHURkfEnLp",
    name: "Aura Boost",
    price: 29700,
  },
  core: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700,
  },
  single_point: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700,
  },
  multi_track: {
    price_id: "price_1T02XqJ9fo9y8fGHMDDvQxR3",
    name: "Aura Pro",
    price: 49700,
  },
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: selectedTier.price_id,
          quantity: 1,
        },
      ],
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
