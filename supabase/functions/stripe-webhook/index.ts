import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno';
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

// Stripe webhooks cannot present a Supabase JWT — signature verification
// below is the security boundary. `verify_jwt = false` is set in config.toml.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    console.error('[stripe-webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return new Response(JSON.stringify({ error: 'webhook not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' as any });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('missing stripe-signature header');
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return new Response('Invalid signature', { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const emitToOrchestrator = async (
    companyId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) => {
    try {
      await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          action: 'emit_event',
          companyId,
          agentType: 'stripe_webhook',
          eventType,
          payload,
        }),
      });
    } catch (err) {
      console.error(`[stripe-webhook] failed to emit ${eventType}:`, err);
    }
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.company_id;
        if (companyId) {
          await emitToOrchestrator(companyId, 'payment_received', {
            session_id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
          });
        } else {
          console.warn('[stripe-webhook] checkout.session.completed missing metadata.company_id', session.id);
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subMeta = (invoice as any).subscription_details?.metadata as Record<string, string> | undefined;
        const companyId = invoice.metadata?.company_id ?? subMeta?.company_id;
        if (companyId) {
          await emitToOrchestrator(companyId, 'invoice_paid', {
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
          });
        } else {
          console.warn('[stripe-webhook] invoice.paid missing metadata.company_id', invoice.id);
        }
        break;
      }
      default:
        console.log(`[stripe-webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});