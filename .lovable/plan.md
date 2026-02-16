

# Make All AI Agents and Features Fully Functional

## Overview

After a thorough audit of the codebase, here is every simulated, stubbed, or placeholder feature that needs to be replaced with real functionality. The work is grouped into priority tiers.

---

## Tier 1: Orchestrator Test Console (Largest Simulation)

**File**: `supabase/functions/ai-orchestrator/index.ts` (lines 484-915)

The `handleTestAgent()` function is a massive block of hardcoded canned responses for all 24 agent types (triage, booking, dispatch, route, ETA, check-in, quoting, invoice, inventory, warranty, follow-up, review, promo, referral, win-back, seasonal, admin, lead, campaign, marketing, social_content, social_scheduler, social_analytics, performance, revenue, creative, web_presence). None of these responses come from AI -- they are pattern-matched regex strings returning fake data.

**Fix**: Replace `handleTestAgent()` with a call to the `ai-agent-chat` edge function, passing the test message through the real AI agent pipeline. This way the "Test Console" in the AI Operatives Hub actually exercises the real agent logic.

---

## Tier 2: Simulated Tools in `ai-agent-chat`

**File**: `supabase/functions/ai-agent-chat/index.ts`

### 2a. `calculate_eta` (line 4011-4017)
Returns random ETA and hardcoded "5.2 miles" / "moderate" traffic. No real distance or routing calculation.

**Fix**: Integrate with a free routing API (OSRM -- Open Source Routing Machine, which is free and self-hostable, or use the Leaflet routing already in the project). Pass technician location and customer address to get real distance and travel time.

### 2b. `check_tech_availability` fallback (lines 3873-3882)
When no real employees exist in the database, returns hardcoded fake technicians ("John Smith", "Sarah Johnson") with random distances/ETAs.

**Fix**: Return an honest empty result with a clear message instead of fake data. If no employees are configured, tell the agent so it can inform the customer appropriately.

### 2c. `check_tech_availability` random distances (lines 3864-3871)
Even when real employees ARE found, the distance and ETA values are `Math.random()` -- not real calculations.

**Fix**: Same as 2a -- use real geocoding/routing to calculate actual distance and ETA from employee location to the job address.

### 2d. `send_payment_link` placeholder URL (lines 4848-4850)
Generates a fake URL (`/pay/{invoice_id}`) instead of creating a real Stripe Payment Link.

**Fix**: Call the Stripe API to create a real Payment Link using the invoice amount, then return the actual Stripe URL. Requires a Stripe secret key (already required by the platform for Logistics+ tiers).

### 2e. `send_quote` -- status update only (lines 4662-4694)
Marks the quote as "sent" in the database but does NOT actually send anything (no email, no SMS).

**Fix**: After updating the status, call the existing `send-appointment-email` or a new `send-quote-email` edge function to actually deliver the quote to the customer via email/SMS.

### 2f. `send_payment_reminder` -- status update only (lines 4863-4893)
Updates invoice status to "overdue" but does NOT send any actual reminder.

**Fix**: After updating status, call the existing email/SMS infrastructure to actually deliver the payment reminder to the customer.

### 2g. Misleading comment (line 3429)
The comment says "Simulated tool execution" but most tools below it (check_availability, create_appointment, track_appointment, inventory, warranty, campaigns) are actually real and database-connected.

**Fix**: Remove the misleading comment. Add accurate comments distinguishing which tools are real vs which still need work.

---

## Tier 3: Event Processing Stub

**File**: `supabase/functions/ai-orchestrator/index.ts` (lines 420-482)

`handleProcessPendingEvents()` marks events as "processed" without actually routing them to agent handlers. The TODO comment on line 447 says "Route to specific agent handler based on target_agent."

**Fix**: Implement real event routing by calling the `ai-agent-chat` edge function for each pending event, passing the event payload as context to the target agent. This enables the multi-agent handoff chain (e.g., triage -> booking -> dispatch -> ETA) to actually work end-to-end.

---

## Implementation Sequence

The work should be done in this order to avoid breaking dependencies:

1. **Clean up comments** -- Remove the misleading "Simulated" comment (quick win, no risk)
2. **Remove fake technician fallback** -- Return empty results instead of fake data
3. **Replace orchestrator test handler** -- Route test messages through the real AI agent pipeline
4. **Connect send_quote / send_payment_reminder to email/SMS** -- Wire up to existing notification infrastructure
5. **Integrate Stripe for send_payment_link** -- Create real Stripe Payment Links
6. **Integrate routing API for calculate_eta** -- Use OSRM or similar for real distance/ETA
7. **Implement event processing** -- Route pending events to real agent handlers

## Technical Details

### Orchestrator Test Handler Replacement
```
// Instead of the 400+ line switch statement with canned responses:
// Forward the test message to the real ai-agent-chat function
const response = await fetch(
  `${supabaseUrl}/functions/v1/ai-agent-chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      companyId,
      agentType,
      message: payload.message,
      conversationHistory: [],
    }),
  }
);
```

### ETA Calculation with OSRM (free, no API key needed)
```
// OSRM public demo server (or self-host for production)
const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${techLon},${techLat};${custLon},${custLat}?overview=false`;
const routeData = await fetch(osrmUrl).then(r => r.json());
const distanceKm = routeData.routes[0].distance / 1000;
const durationMin = Math.ceil(routeData.routes[0].duration / 60);
```

### Stripe Payment Link Creation
```
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price_data: { currency: 'usd', product_data: { name: `Invoice ${invoice.invoice_number}` }, unit_amount: Math.round(invoice.total * 100) }, quantity: 1 }],
});
return { payment_link: paymentLink.url };
```

### Files to Modify
- `supabase/functions/ai-orchestrator/index.ts` -- Replace handleTestAgent, implement event routing
- `supabase/functions/ai-agent-chat/index.ts` -- Fix calculate_eta, check_tech_availability fallback, send_payment_link, send_quote, send_payment_reminder, remove misleading comment

### Prerequisites
- Stripe secret key must be configured (for payment links)
- Employee profiles should have location data stored (for real ETA calculations)
- No new database tables needed -- all existing tables support these changes

