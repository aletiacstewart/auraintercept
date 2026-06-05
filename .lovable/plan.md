## What I found

- The chat did **not create an appointment** for the latest test.
- It saved the request as a **lead** instead:
  - Name: Aletia S.
  - Service: Platform Demo
  - Intent: booking
  - Notes: “Customer provided contact info but did not complete booking.”
- That means there was no new appointment record for the calendar sync to pick up.
- The connected calendar also has an expired/revoked token: `Token refresh failed: invalid_grant`, so calendar sync will still fail until the calendar is reconnected.

## Plan

1. **Fix the chat booking flow**
   - Update the booking agent rules so when a customer has provided name, phone, email, and a valid service like Platform Demo, it must offer the inline slot picker or proceed to appointment creation instead of capturing only a lead.
   - Adjust the `create_appointment` tool requirements so virtual / business-location services do not require `customer_address`.

2. **Make inline slot selection book reliably**
   - When the user taps a time in the inline picker, send the selected datetime and service in a structured enough message that the booking agent calls `create_appointment`, not `capture_lead`.
   - Preserve the already-collected customer name, phone, and email in the conversation history so the agent can complete the booking.

3. **Improve calendar sync visibility**
   - Keep appointment creation non-blocking, but make the response/logs clearer when calendar sync is skipped or fails.
   - Surface that the company’s calendar connection needs reconnection when the stored calendar token is invalid/revoked.

4. **Validate after implementation**
   - Test the chat path with Platform Demo + contact info.
   - Confirm a new row appears in `appointments`.
   - Confirm the calendar sync function is called; if it still fails due to `invalid_grant`, the remaining action is reconnecting the calendar integration.