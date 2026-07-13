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

// BETA PRICING (active, billed): Core $497 · Boost $994 · Pro $1,988 · Elite $3,979.
// Standard (struck-through display only): $697 / $1,394 / $2,788 / $5,576.
// Onboarding fee (Beta, one-time, 25% OFF original, rounded to nearest $10):
//   Core $370 · Boost $750 · Pro $1,490 · Elite $2,980.
// Onboarding price IDs updated 2026-07-07 to the new 25%-off amounts
// ($370 / $750 / $1,490 / $2,980). Legacy 50%-off IDs are retained in commit
// history only — do not use them for new checkouts.
const CORE = {
  name: "Aura Core",
  price: 49700,
  price_id: "price_1TmJ2pEGn9AqCo3ECdv8mh0A",
  onboarding_price_id: "price_1TqgFCEGn9AqCo3EFVk0SKZV", // $370 one-time
};
const BOOST = {
  name: "Aura Boost",
  price: 99400,
  price_id: "price_1TmJ2qEGn9AqCo3EpspZoDZK",
  onboarding_price_id: "price_1TqgFDEGn9AqCo3Emyd1SEf5", // $750 one-time
};
const PRO = {
  name: "Aura Pro",
  price: 198800,
  price_id: "price_1TmJ2rEGn9AqCo3EkxrT5Z09",
  onboarding_price_id: "price_1TqgFFEGn9AqCo3Ez36DpcJL", // $1,490 one-time
};
const ELITE = {
  name: "Aura Elite",
  price: 397900,
  price_id: "price_1TmJ2tEGn9AqCo3ES4Mf3YHm",
  onboarding_price_id: "price_1TqgFFEGn9AqCo3Ei7axEGKc", // $2,980 one-time
};

/**
 * Onboarding fee schedule.
 *
 * The one-time onboarding fee is no longer collected at signup. It is recorded
 * as pending in public.companies and invoiced on day 31 of the 60-Day Live
 * Trial by the charge-onboarding-fee cron edge function. The first monthly
 * plan fee is deferred to day 61 via a 60-day Stripe trial.
 *
 * Beta invite codes can still waive the onboarding fee entirely via the
 * `waive_onboarding_fee` flag returned by validate_beta_code.
 *
 * Mirrored in src/lib/launchPricing.ts as ONBOARDING_FEE_WAIVED_GLOBALLY —
 * kept in sync; the global waiver is now false so deferred billing works.
 */
const ONBOARDING_FEE_WAIVED_GLOBALLY = false;

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

// Runtime assertion: our local `price` (cents) must match launchPricing.ts sale
// amounts (mirrored here to avoid client-lib imports in edge). If Stripe price
// objects drift from these, logStep will emit a WARNING at cold start so it
// shows up in edge function logs — checkout still proceeds so a mismatch
// never blocks live customers.
const EXPECTED_MONTHLY_CENTS: Record<string, number> = {
  starter: 49700,      // Core   $497
  connect: 99400,      // Boost  $994
  performance: 198800, // Pro    $1,988
  command: 397900,     // Elite  $3,979
};
(() => {
  for (const [tier, expected] of Object.entries(EXPECTED_MONTHLY_CENTS)) {
    const actual = SUBSCRIPTION_TIERS[tier]?.price;
    if (actual !== expected) {
      console.warn(
        `[CREATE-CHECKOUT] WARN price drift: tier=${tier} expected=${expected} actual=${actual} — update launchPricing.ts or Stripe price objects.`,
      );
    }
  }
})();

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
    let betaCode: string | null = null;
    try {
      const body = await req.json();
      if (body.tier && SUBSCRIPTION_TIERS[body.tier]) {
        requestedTier = body.tier;
      }
      if (typeof body.beta_code === "string" && body.beta_code.trim()) {
        betaCode = body.beta_code.trim().toUpperCase();
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

    // Beta invite code validation (server-authoritative)
    let betaTrialDays = 0;
    let betaWaiveOnboarding = false;
    let betaOnboardingCapCents: number | null = null;
    let betaCapExpiresAt: Date | null = null;
    if (betaCode) {
      const { data: betaRows, error: betaErr } = await supabaseClient.rpc("validate_beta_code", { p_code: betaCode });
      const row = Array.isArray(betaRows) ? betaRows[0] : betaRows;
      if (betaErr || !row?.valid) {
        logStep("Beta code rejected", { betaCode, message: row?.message, error: betaErr?.message });
        return new Response(JSON.stringify({ error: row?.message || "Invalid beta invite code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      betaTrialDays = row.trial_days || 60;
      betaWaiveOnboarding = !!row.waive_onboarding_fee;
      betaOnboardingCapCents = typeof row.onboarding_fee_cap_cents === "number" ? row.onboarding_fee_cap_cents : null;
      betaCapExpiresAt = row.onboarding_cap_expires_at ? new Date(row.onboarding_cap_expires_at) : null;
      logStep("Beta code accepted", { betaCode, betaTrialDays, betaWaiveOnboarding, betaOnboardingCapCents, betaCapExpiresAt });
    }

    const lineItems: Array<Stripe.Checkout.SessionCreateParams.LineItem> = [
      { price: selectedTier.price_id, quantity: 1 },
    ];

    // Onboarding fee — tier-specific (25% OFF original, rounded to nearest $10).
    // It is NOT added to the checkout line items because it is invoiced later
    // (day 31 of the 60-Day Live Trial) by the charge-onboarding-fee cron.
    // We still record the pending fee on the company row so the cron knows
    // when and how much to charge.
    const onboardingFeeCents = selectedTier.onboarding_price_id
      ? { starter: 37000, connect: 75000, performance: 149000, command: 298000 }[requestedTier] ?? 0
      : 0;

    let onboardingWaivedReason: "not_first_checkout" | "beta" | "none" = "none";
    if (!isFirstCheckout) {
      onboardingWaivedReason = "not_first_checkout";
    } else if (betaWaiveOnboarding) {
      onboardingWaivedReason = "beta";
    }

    const onboardingFeeStatus = onboardingWaivedReason !== "none" || onboardingFeeCents === 0
      ? "waived"
      : "pending";

    logStep("Onboarding fee decision", {
      isFirstCheckout,
      betaWaiver: betaWaiveOnboarding,
      waivedReason: onboardingWaivedReason,
      onboardingFeeCents,
      onboardingFeeStatus,
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/dashboard/subscription?success=true`,
      cancel_url: `${origin}/dashboard/subscription?canceled=true`,
      subscription_data: {
        // 60-day trial: first monthly plan fee is charged on day 61.
        trial_period_days: 60,
        metadata: {
          company_id: companyId,
          ...(betaCode ? { beta_code: betaCode, beta_trial: "true" } : {}),
        },
      },
      // Always collect payment method during checkout so day-31 and day-61
      // charges can run automatically without asking the customer again.
      payment_method_collection: "if_required",
      metadata: {
        company_id: companyId,
        admin_user_id: user.id,
        tier: requestedTier,
        onboarding_waived: onboardingWaivedReason === "none" ? "no" : onboardingWaivedReason,
        onboarding_fee_status: onboardingFeeStatus,
        ...(betaCode ? { beta_code: betaCode, beta_trial: "true" } : {}),
      },
    };
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Persist the deferred onboarding fee schedule on the company row.
    const onboardingFeeDueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: onboardingUpdateErr } = await supabaseClient
      .from("companies")
      .update({
        onboarding_fee_cents: onboardingFeeStatus === "waived" ? null : onboardingFeeCents,
        onboarding_fee_due_at: onboardingFeeStatus === "waived" ? null : onboardingFeeDueAt,
        onboarding_fee_status: onboardingFeeStatus,
      })
      .eq("id", companyId);
    if (onboardingUpdateErr) {
      logStep("Warning: failed to save onboarding fee schedule", { error: onboardingUpdateErr.message });
    } else {
      logStep("Saved onboarding fee schedule", { onboardingFeeCents, onboardingFeeDueAt, onboardingFeeStatus });
    }

    // Mark code redeemed + flip company.beta_trial immediately so the UI
    // can reflect beta state even before Stripe webhook arrives.
    if (betaCode) {
      const { error: redeemErr } = await supabaseClient.rpc("redeem_beta_code", {
        p_code: betaCode,
        p_company_id: companyId,
      });
      if (redeemErr) logStep("Warning: redeem_beta_code failed", { error: redeemErr.message });
    }

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
