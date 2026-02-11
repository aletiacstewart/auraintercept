

## Fix: Voice Chat Booking Without Collecting Required Information

### Problem
The web voice agent books appointments without asking for:
1. **Preferred date and time** -- it defaults to "tomorrow 9am" instead of asking
2. **Phone number** -- it accepts an empty string and books anyway

The ElevenLabs agent prompt (configured in the dashboard) should guide the conversation, but the server-side code currently has no guardrails -- it happily books with missing data.

### Solution: Server-Side Validation in voice-booking-agent

**File: `supabase/functions/voice-booking-agent/index.ts`**

In the `create_appointment` handler (line 227-267), add validation that **rejects** the booking and returns an instructive message to the agent if required fields are missing:

1. **Reject empty phone number** -- If `customer_phone` is empty, return a message telling the agent: "Please ask the customer for their phone number before booking."

2. **Reject missing datetime** -- This check already exists (line 235), but strengthen the response message to instruct the agent to ask for a preferred date and time.

3. **Reject if check_availability was never called** -- Add a note in the response encouraging the agent to check availability first so it offers real time slots rather than guessing.

The updated validation block (inserted before the database insert at line 244):

```typescript
// Require phone number
if (!customerPhone) {
  return new Response(JSON.stringify({
    success: false,
    message: "I need the customer's phone number before I can book. Please ask them for their phone number.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Require explicit datetime (not a guess)
if (!datetime) {
  return new Response(JSON.stringify({
    success: false,
    message: "I need a specific date and time to book. Please ask the customer when they'd like to come in, then check availability first.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Dashboard Action (Manual -- You Must Do This)

In the ElevenLabs dashboard for agent `agent_0501kh...`, update the agent's **system prompt** to include a data collection requirement:

> "Before booking an appointment, you MUST collect the following from the customer:
> 1. What service they need (call get_services first)
> 2. Their preferred date and time (call check_availability to verify)
> 3. Their full name
> 4. Their phone number
> 
> Do NOT call create_appointment until you have all four pieces of information."

This ensures the agent asks before booking, and the server-side validation acts as a safety net if it tries to skip steps.

### Files to Modify
- **`supabase/functions/voice-booking-agent/index.ts`** -- Add validation rejecting bookings with missing phone or datetime, with instructive error messages that guide the agent to collect the data

