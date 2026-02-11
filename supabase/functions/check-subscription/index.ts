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

// Map price IDs to tier names
// NEW 7-TIER STRUCTURE: Starter, Scheduling, Growth, Business, Field Ops, Performance, Command
const PRICE_TO_TIER: Record<string, string> = {
  // New tier price IDs mapped to NEW tier names
  "price_1SuzwwJ9fo9y8fGH0rJZBw5q": "starter",      // Aura Starter - $197/month
  "price_1SxfFNJ9fo9y8fGH2rcByvoY": "scheduling",   // Aura Scheduling - $297/month
  "price_1StwXbJ9fo9y8fGHMaCGdnDV": "growth",       // Aura Growth - $397/month
  "price_1StwXqJ9fo9y8fGHwzQk17IN": "business",     // Aura Business - $500/month
  "price_1StwY2J9fo9y8fGHwOIrLZ8q": "field_ops",    // Aura Field Ops - $1,500/month
  "price_1StwYEJ9fo9y8fGHdwAoYr5E": "performance",  // Aura Performance - $3,997/month
  "price_1StwYSJ9fo9y8fGHpPa6JL5I": "command",      // Aura Command - $5,997/month
  // Legacy Enterprise -> Command (backward compatibility)
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

    // Auth client with user's token for JWT validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Service-role client for DB operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Validate JWT using getClaims (works even when session is expired/missing)
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("getClaims failed, falling back to getUser", { error: claimsError?.message });
      // Fallback to getUser
      const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !authUser) {
        logStep("getUser also failed", { error: authError?.message });
        throw new Error(`Authentication error: ${authError?.message || 'Invalid token'}`);
      }
      var user = { id: authUser.id, email: authUser.email! };
    } else {
      var user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = roleData?.role;
    logStep("User role fetched", { role: userRole });

    // Platform admins get full access (command tier)
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

    // Get user's profile to find company_id
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    let companyId = profileData?.company_id;
    let companyData = null;

    // For customers, look up their associated company
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

    // Get company data if we have a company_id
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
        stripeCustomerId: company?.stripe_customer_id 
      });
    }

    // Check trial status
    let inTrial = false;
    let trialEndsAt = null;
    if (companyData?.trial_ends_at) {
      const trialEnd = new Date(companyData.trial_ends_at);
      const now = new Date();
      inTrial = trialEnd > now;
      trialEndsAt = companyData.trial_ends_at;
      logStep("Trial status checked", { inTrial, trialEndsAt });
    }

    // If in trial, return full access (command tier)
    if (inTrial) {
      logStep("Company in active trial, granting command access");
      return new Response(JSON.stringify({
        subscribed: true,
        tier: "command",
        in_trial: true,
        trial_ends_at: trialEndsAt,
        subscription_end: trialEndsAt,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For employees and customers: inherit company's tier without Stripe lookup
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

    // For company_admin: Check Stripe subscription using company's stripe_customer_id
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let customerId = companyData?.stripe_customer_id;
    
    // If no stripe_customer_id on company, try to find by user email (legacy)
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found Stripe customer by email (legacy)", { customerId });
        
        // Update company with stripe_customer_id for future lookups
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
      
      // Safely handle the subscription end date
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      // Get price ID and map to tier
      priceId = subscription.items?.data?.[0]?.price?.id;
      tier = priceId ? (PRICE_TO_TIER[priceId] || companyData?.subscription_tier || "command") : (companyData?.subscription_tier || "command");
      
      // Update company's subscription_tier in database
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
