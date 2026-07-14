import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHARGE-ONBOARDING-FEE] ${step}${detailsStr}`);
};

/**
 * Daily cron job that charges pending onboarding fees on day 31 of the
 * 60-Day Live Trial. The create-checkout edge function records the fee amount
 * and due date on public.companies when a new subscription is started.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireCronSecret(req, corsHeaders);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const now = new Date().toISOString();
    logStep("Scanning for pending onboarding fees due", { now });

    const { data: companies, error: fetchErr } = await supabase
      .from("companies")
      .select(
        "id, name, stripe_customer_id, onboarding_fee_cents, onboarding_fee_due_at, onboarding_fee_status, subscription_tier"
      )
      .eq("onboarding_fee_status", "pending")
      .lte("onboarding_fee_due_at", now);

    if (fetchErr) throw fetchErr;

    const results: Array<{
      company_id: string;
      status: string;
      invoice_id?: string;
      error?: string;
    }> = [];

    for (const company of companies ?? []) {
      try {
        if (!company.stripe_customer_id) {
          logStep("Skipping company without Stripe customer", { companyId: company.id });
          results.push({ company_id: company.id, status: "skipped", error: "no_stripe_customer" });
          continue;
        }
        if (!company.onboarding_fee_cents || company.onboarding_fee_cents <= 0) {
          logStep("Skipping company with zero onboarding fee", { companyId: company.id });
          results.push({ company_id: company.id, status: "skipped", error: "zero_fee" });
          continue;
        }

        const invoice = await stripe.invoices.create({
          customer: company.stripe_customer_id,
          auto_advance: true,
          collection_method: "charge_automatically",
          description: `Aura Intercept onboarding fee — ${company.name}`,
          metadata: {
            company_id: company.id,
            tier: company.subscription_tier || "",
            fee_type: "onboarding",
          },
        });

        await stripe.invoiceItems.create({
          customer: company.stripe_customer_id,
          invoice: invoice.id,
          amount: company.onboarding_fee_cents,
          currency: "usd",
          description: `Aura Intercept onboarding fee — ${company.name}`,
        });

        const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
        const paid = await stripe.invoices.pay(finalized.id);

        const nextStatus = paid.status === "paid" ? "charged" : "failed";
        const { error: updateErr } = await supabase
          .from("companies")
          .update({
            onboarding_fee_status: nextStatus,
            onboarding_fee_stripe_invoice_id: paid.id,
          })
          .eq("id", company.id);

        if (updateErr) throw updateErr;

        logStep("Processed onboarding fee", {
          companyId: company.id,
          amount: company.onboarding_fee_cents,
          invoiceId: paid.id,
          status: paid.status,
        });

        results.push({
          company_id: company.id,
          status: nextStatus,
          invoice_id: paid.id,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logStep("Failed to process onboarding fee", { companyId: company.id, error: message });
        await supabase
          .from("companies")
          .update({ onboarding_fee_status: "failed" })
          .eq("id", company.id);
        results.push({ company_id: company.id, status: "failed", error: message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
