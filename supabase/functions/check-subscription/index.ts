import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map price IDs to canonical 4 tiers: starter, connect, performance, command.
// Active launch pricing: Core $497 · Boost $897 · Pro $1,797 · Elite $2,997.
// Earlier launch pricing (Elite $3,097) and pre-launch full-price IDs are
// retained so grandfathered customers continue to map to the correct tier.
const PRICE_TO_TIER: Record<string, string> = {
  // === AURA INTERCEPT ACCOUNT (active) ===
  "price_1TmJ2pEGn9AqCo3ECdv8mh0A": "starter",     // Core $497
  "price_1TmJ2qEGn9AqCo3EpspZoDZK": "connect",     // Boost $994
  "price_1TmJ2rEGn9AqCo3EkxrT5Z09": "performance", // Pro $1,988
  "price_1TmJ2tEGn9AqCo3ES4Mf3YHm": "command",     // Elite $3,979

  // === BETA PRICING PRICE IDS (active, June 2026) ===
  // Aura Core - $497/mo (Beta, was $697)
  "price_1ThWTeJ9fo9y8fGHfDU4ZNq8": "starter",
  // Aura Boost - $994/mo (Beta, was $1,394)
  "price_1ThWTfJ9fo9y8fGHsbLQp0Za": "connect",
  // Aura Pro - $1,988/mo (Beta, was $2,788)
  "price_1ThWTgJ9fo9y8fGHgoZLc8qu": "performance",
  // Aura Elite - $3,979/mo (Beta, was $5,576)
  "price_1ThWThJ9fo9y8fGHGSowuwkR": "command",

  // === STANDARD (post-beta, display-only) PRICE IDS ===
  // Aura Core $697 / Boost $1,394 / Pro $2,788 / Elite $5,576
  "price_1ThWTjJ9fo9y8fGHWUZDqJa9": "starter",
  "price_1ThWTkJ9fo9y8fGH0rcvK8xa": "connect",
  "price_1ThWTkJ9fo9y8fGHRXECyHlO": "performance",
  "price_1ThWTmJ9fo9y8fGHinbLnhRH": "command",

  // === LEGACY LAUNCH PRICING (grandfathered) ===
  // Aura Core - $497/mo (Launch v1, was $697)
  "price_1TeereJ9fo9y8fGHzz419yW6": "starter",
  // Aura Boost - $897/mo (Launch Pricing, was $1,097)
  "price_1TeerfJ9fo9y8fGHX2tAGIVR": "connect",
  // Aura Pro - $1,797/mo (Launch Pricing, was $1,997)
  "price_1TeerfJ9fo9y8fGHxdXiHqSg": "performance",
  // Aura Elite - $2,997/mo (Launch Pricing v2, was $3,997)
  "price_1Tf4XnJ9fo9y8fGHQSlh9suF": "command",
  // Aura Elite - $3,097/mo (Launch Pricing v1, grandfathered)
  "price_1TeergJ9fo9y8fGHMwqU7pMV": "command",

  // === PRE-LAUNCH FULL-PRICE IDS (grandfathered) ===
  // Aura Core - $697/mo
  "price_1Tdvk8J9fo9y8fGHEzdE8sc0": "starter",
  // Aura Boost - $1,097/mo
  "price_1Tdvk9J9fo9y8fGHWVQP8Zxi": "connect",
  // Aura Pro - $1,997/mo
  "price_1Tdvk9J9fo9y8fGHjXNIXsIn": "performance",
  // Aura Elite - $3,497/mo
  "price_1TdvkAJ9fo9y8fGHfu0WlSpR": "command",

  // === LEGACY PRE-LAUNCH PLACEHOLDER IDS (kept for any in-flight sessions) ===
  "price_1T0285J9fo9y8fGHURkfEnLp": "starter",
  "price_1T02XqJ9fo9y8fGHMDDvQxR3": "connect",
  "price_1T02YAJ9fo9y8fGHJ7Q7g4Cq": "command",

  // === LEGACY PRICE IDS (backward compat for existing subscribers) ===
  // Starter $497 → connect (legacy)
  "price_1SuzwwJ9fo9y8fGH0rJZBw5q": "connect",
  // Old Connect/Scheduling $397 → connect
  "price_1SxfFNJ9fo9y8fGH2rcByvoY": "connect",
  // Growth $597 → connect
  "price_1StwXbJ9fo9y8fGHMaCGdnDV": "connect",
  "price_1T02LLJ9fo9y8fGHMVJDpK7p": "connect",
  // Business/Presence $797 → performance
  "price_1StwXqJ9fo9y8fGHwzQk17IN": "performance",
  "price_1T028dJ9fo9y8fGH92xnAk1x": "performance",
  // Logistics $1497 → performance
  "price_1StwY2J9fo9y8fGHwOIrLZ8q": "performance",
  "price_1T028oJ9fo9y8fGHIiNuzVSC": "performance",
  // Old Performance → performance
  "price_1StwYEJ9fo9y8fGHdwAoYr5E": "performance",
  // Old Command → command
  "price_1StwYSJ9fo9y8fGHpPa6JL5I": "command",
  // Legacy Enterprise → command
  "price_1SelZTJ9fo9y8fGHf9Q9RtGr": "command",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token", { tokenLength: token.length });

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    let user: { id: string; email: string } | null = null;

    if (claimsData?.claims) {
      user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
    } else {
      logStep("getClaims failed, falling back to getUser", { error: claimsError?.message });
      const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authUser) {
        user = { id: authUser.id, email: authUser.email! };
      } else {
        logStep("getUser also failed — session likely expired", { error: authError?.message });
        return new Response(JSON.stringify({ 
          subscribed: false, tier: "free", in_trial: false,
          trial_ends_at: null, subscription_end: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication error: Auth session missing!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = (rolesData ?? []).map((r: { role: string }) => r.role);
    const userRole = roles.includes('platform_admin')
      ? 'platform_admin'
      : roles.includes('company_admin')
        ? 'company_admin'
        : roles.includes('employee')
          ? 'employee'
          : roles.includes('customer')
            ? 'customer'
            : undefined;
    logStep("User role fetched", { role: userRole, allRoles: roles });

    if (userRole === 'platform_admin') {
      logStep("Platform admin detected, granting command access");
      return new Response(JSON.stringify({
        subscribed: true,
        tier: "command",
        in_trial: false,
        trial_ends_at: null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    let companyId = profileData?.company_id;
    let companyData = null;

    if (userRole === 'customer') {
      logStep("Customer role detected, looking up associated company");
      
      const { data: associationData } = await supabaseClient
        .from('customer_company_associations')
        .select('company_id')
        .eq('customer_user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (associationData?.company_id) {
        companyId = associationData.company_id;
        logStep("Found customer association", { companyId });
      }
    }

    if (companyId) {
      const { data: company } = await supabaseClient
        .from('companies')
        .select('id, name, subscription_tier, trial_ends_at, stripe_customer_id')
        .eq('id', companyId)
        .single();
      
      companyData = company;
      logStep("Company data fetched", { 
        companyId: company?.id, 
        tier: company?.subscription_tier,
        stripeCustomerId: company?.stripe_customer_id,
      });
    }

    let inTrial = false;
    let trialEndsAt = null;
    if (companyData?.trial_ends_at) {
      const trialEnd = new Date(companyData.trial_ends_at);
      const now = new Date();
      inTrial = trialEnd > now;
      trialEndsAt = companyData.trial_ends_at;
      logStep("Trial status checked", { inTrial, trialEndsAt });
    }

    if (inTrial) {
      // Default trial tier to 'command' (Elite) so a NULL/legacy company row
      // never silently drops a Live Demo user to Starter mid-trial.
      const trialTier = companyData?.subscription_tier || 'command';
      logStep("Company in active trial, returning selected tier", { trialTier });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: trialTier,
        in_trial: true,
        trial_ends_at: trialEndsAt,
        subscription_end: trialEndsAt,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (userRole === 'employee' || userRole === 'customer') {
      const tier = companyData?.subscription_tier || 'free';
      const isSubscribed = tier !== 'free';
      
      logStep(`${userRole} inheriting company tier`, { tier, companyId });
      
      return new Response(JSON.stringify({
        subscribed: isSubscribed,
        tier,
        in_trial: false,
        trial_ends_at: trialEndsAt,
        subscription_end: null,
        company_name: companyData?.name,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let customerId = companyData?.stripe_customer_id;
    
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found Stripe customer by email (legacy)", { customerId });
        
        if (companyId) {
          await supabaseClient
            .from('companies')
            .update({ stripe_customer_id: customerId })
            .eq('id', companyId);
          logStep("Updated company with stripe_customer_id");
        }
      }
    } else {
      logStep("Using company's stripe_customer_id", { customerId });
    }

    if (!customerId) {
      logStep("No Stripe customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: companyData?.subscription_tier || "free",
        in_trial: false,
        trial_ends_at: trialEndsAt,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = companyData?.subscription_tier || "free";
    let subscriptionEnd = null;
    let priceId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Subscription data", { 
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
      });
      
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      priceId = subscription.items?.data?.[0]?.price?.id;
      tier = priceId ? (PRICE_TO_TIER[priceId] || companyData?.subscription_tier || "command") : (companyData?.subscription_tier || "command");
      
      if (companyId && tier) {
        const { error: updateError } = await supabaseClient
          .from('companies')
          .update({ subscription_tier: tier })
          .eq('id', companyId);
        
        if (updateError) {
          logStep("Failed to update company subscription tier", { error: updateError.message });
        } else {
          logStep("Updated company subscription tier", { tier });
        }
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        priceId,
        tier,
      });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      price_id: priceId,
      in_trial: false,
      trial_ends_at: trialEndsAt,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });

    // Per platform standard (Sub Check Edge Handling memory): always return
    // 200 OK with subscribed: false on failure rather than 401/500. This
    // prevents the dashboard from hard-erroring when Stripe or auth hiccups,
    // and lets the UI degrade gracefully to the free/locked state.
    return new Response(JSON.stringify({
      subscribed: false,
      tier: "free",
      in_trial: false,
      trial_ends_at: null,
      subscription_end: null,
      lookup_failed: true,
      error: errorMessage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
