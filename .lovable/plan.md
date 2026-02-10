
# Never Miss a Call: AI Agent Answers When the Business Doesn't

## How It Works Today (The Problem)

Right now, calls to the **SignalWire number** go directly to the AI agent. But calls to the **business's real phone number** are completely separate -- SignalWire never sees them. If the business misses a call on their real number, nothing happens unless they manually set up carrier call forwarding.

## The Solution: "Ring First, Then AI" Mode

Instead of forcing businesses to forward their number, we flip the architecture. The SignalWire number becomes the **primary advertised number**, but when a call comes in, we **ring the business owner's real phone first**. If they don't pick up within a configurable number of seconds, the AI agent seamlessly takes over -- the caller never knows.

```text
Customer calls SignalWire number
    |
    v
Ring business owner's phone (10-25 seconds)
    |
    +--> Owner answers? --> Connect the call (normal phone call)
    |
    +--> No answer / busy / declined?
              |
              v
         AI Agent picks up instantly
         "Hi, thanks for calling [Business]. How can I help?"
```

This means:
- The business owner gets the FIRST chance to answer every call
- If they're busy, on another call, or away, the AI takes over automatically
- The caller NEVER gets voicemail or a dead line
- The business never misses a lead

## Technical Implementation (3 Changes)

### Change 1: Add "ring first" fields to the database

Add two new columns to the `companies` table:

- `call_routing_mode`: Either `'ai_direct'` (current behavior -- AI answers immediately) or `'ring_first'` (ring the business phone, then AI)
- `business_phone`: The owner's personal/business phone to ring first
- `ring_timeout_seconds`: How long to ring before AI takes over (default: 15 seconds)

### Change 2: Update `voice-handler` incoming call logic

Modify `handleIncoming` to check the company's `call_routing_mode`:

**If `ai_direct`** (default, current behavior): AI answers immediately, no change.

**If `ring_first`**: Return TwiML that uses SignalWire's `<Dial>` verb to ring the business phone, with an `action` callback URL. The `<Dial>` verb has a `timeout` attribute set to the company's `ring_timeout_seconds`.

```xml
<!-- Ring the business phone first -->
<Response>
  <Dial timeout="15" callerId="+1CALLER_NUMBER"
        action="voice-handler?action=dial-status&amp;callLogId=XYZ"
        method="POST">
    <Number>+1BUSINESS_PHONE</Number>
  </Dial>
</Response>
```

When the `<Dial>` finishes (answered, no-answer, busy, or failed), SignalWire hits the `action` URL.

### Change 3: Add new `dial-status` action to `voice-handler`

A new handler that checks the `DialCallStatus` parameter from SignalWire:

- **`completed`** (owner answered and hung up): Log the call as handled, done.
- **`no-answer`**, **`busy`**, **`failed`**: The owner didn't pick up. Now run the existing AI greeting flow (same code as current `handleIncoming`). The caller seamlessly hears "Thanks for calling [Business], how can I help?" from the AI.

This reuses ALL existing AI logic -- no changes to the AI agent, TTS, or tool handling.

### Change 4: Add UI controls for call routing

Add a "Call Routing" section to the Voice and SMS settings page where business owners can:

1. Choose routing mode: "AI answers directly" vs "Ring my phone first, then AI"
2. Enter their business/personal phone number
3. Set the ring timeout (slider: 10-30 seconds, default 15)

The UI will include a clear explanation: "When someone calls your number, we'll ring your phone first. If you don't answer within the timeout, your AI agent will pick up automatically so you never miss a call."

## What About Calls to Their Original Number?

If a business already has an established phone number they give to customers, they have two options:

1. **Recommended**: Update their marketing materials, Google listing, and business cards to use the SignalWire number. The AI handles everything.
2. **Alternative**: Set up conditional call forwarding at the carrier level (forward on no-answer to the SignalWire number). We'll include brief instructions in the UI, but the "ring first" feature makes this less necessary since the SignalWire number already rings them.

The "ring first" approach solves 90% of the problem because the business can start giving out their SignalWire number as their main number, knowing they'll still get calls to their personal phone -- with AI backup.

## Expected Call Flow Timing

| Step | Duration |
|------|----------|
| Customer calls | 0s |
| Ring business phone | 0-15s (configurable) |
| Owner answers? Call connected | Done |
| No answer? AI greeting + TTS | 2-3s |
| Caller talks to AI | Ongoing |
| **Total to AI pickup** | **15-18s** |

The caller hears normal ringing during the "ring first" phase, which is expected behavior.

## Database Changes

New columns on the `companies` table:
- `call_routing_mode` (text, default `'ai_direct'`)
- `business_phone` (text, nullable)
- `ring_timeout_seconds` (integer, default 15)

## Files to Change

1. **Database migration**: Add 3 columns to `companies`
2. **`supabase/functions/voice-handler/index.ts`**: Add `ring_first` logic in `handleIncoming` + new `dial-status` handler
3. **`src/components/company/MissedCallSettings.tsx`** (or new component): Add call routing UI controls
