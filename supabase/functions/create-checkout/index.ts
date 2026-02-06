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

// Subscription tier configuration with Stripe Price IDs
// NEW 7-TIER STRUCTURE: Starter, Scheduling, Growth, Business, Field Ops, Performance, Command
const SUBSCRIPTION_TIERS: Record<string, { price_id: string; name: string; price: number }> = {
  // New tier names
  starter: {
    price_id: "price_1SuzwwJ9fo9y8fGH0rJZBw5q",
    name: "Aura Starter",
    price: 19700, // $197 in cents
  },
  scheduling: {
    price_id: "price_1SxfFNJ9fo9y8fGH2rcByvoY",
    name: "Aura Scheduling",
    price: 29700, // $297 in cents
  },
  growth: {
    price_id: "price_1StwXbJ9fo9y8fGHMaCGdnDV",
    name: "Aura Growth",
    price: 39700, // $397 in cents
  },
  business: {
    price_id: "price_1StwXqJ9fo9y8fGHwzQk17IN",
    name: "Aura Business",
    price: 50000, // $500 in cents
  },
  field_ops: {
    price_id: "price_1StwY2J9fo9y8fGHwOIrLZ8q",
    name: "Aura Field Ops",
    price: 150000, // $1,500 in cents
  },
  performance: {
    price_id: "price_1StwYEJ9fo9y8fGHdwAoYr5E",
    name: "Aura Performance",
    price: 399700, // $3,997 in cents
  },
  command: {
    price_id: "price_1StwYSJ9fo9y8fGHpPa6JL5I",
    name: "Aura Command",
    price: 599700, // $5,997 in cents
  },
  // Legacy tier name aliases for backward compatibility
  express: {
    price_id: "price_1SuzwwJ9fo9y8fGH0rJZBw5q",
    name: "Aura Starter",
    price: 19700,
  },
  aura_flow: {
    price_id: "price_1SxfFNJ9fo9y8fGH2rcByvoY",
    name: "Aura Scheduling",
    price: 29700,
  },
  halo: {
    price_id: "price_1StwXbJ9fo9y8fGHMaCGdnDV",
    name: "Aura Growth",
    price: 39700,
  },
  core: {
    price_id: "price_1StwXqJ9fo9y8fGHwzQk17IN",
    name: "Aura Business",
    price: 50000,
  },
  single_point: {
    price_id: "price_1StwY2J9fo9y8fGHwOIrLZ8q",
    name: "Aura Field Ops",
    price: 150000,
  },
  multi_track: {
    price_id: "price_1StwYEJ9fo9y8fGHdwAoYr5E",
    name: "Aura Performance",
    price: 399700,
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

    // Check user role - only company_admin can subscribe
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

    // Get user's company
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

    // Get company data
    const { data: companyData, error: companyError } = await supabaseClient
      .from('companies')
      .select('id, name, email, stripe_customer_id')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      throw new Error("Failed to fetch company data");
    }
    logStep("Company data fetched", { companyName: companyData.name });

    // Parse request body for tier selection
    let requestedTier = "command"; // Default to command tier
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
    
    // Use company's existing Stripe customer or create a new one
    let customerId = companyData.stripe_customer_id;
    
    if (customerId) {
      logStep("Found existing Stripe customer for company", { customerId });
    } else {
      // Create new Stripe customer for the company
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

      // Save stripe_customer_id to company record
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
