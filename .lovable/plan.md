## What I found

- The campaign did try to send SMS to `+13618139836`.
- The customer record is not opted out.
- SignalWire credentials are present for the company.
- The failure is still coming from SignalWire:
  - `422`
  - `code: 10000`
  - `To must send to a verified caller id`
- The configured outbound/from number is `+14847372424`.

This means Aura is reaching SignalWire, but SignalWire is rejecting the message before delivery.

## Most likely cause

Even after upgrading, the SignalWire project/space currently connected to Aura still appears to be enforcing trial-style verified-recipient restrictions, or the account/space tied to these credentials is not the upgraded one.

## Plan

1. Improve SMS provider error handling
   - Update `send-appointment-sms` so it returns SignalWire’s real error message and code to the campaign sender instead of only `Failed to send SMS: 422`.
   - Preserve `code`, `status`, and `message` in the response.

2. Improve campaign SMS logs
   - Update `send-campaign` so campaign send rows store the actual provider message, e.g. `SignalWire 10000: To must send to a verified caller id`.
   - This will make the Campaigns page/debug data show the real cause immediately.

3. Add a specific SignalWire trial/verification hint
   - When SignalWire returns code `10000`, surface a clear action message:
     - confirm the upgraded account is the same SignalWire Space connected in Aura
     - confirm the `From` number belongs to that upgraded Space
     - if still trial-restricted, verify the recipient in that exact Space or contact SignalWire to remove trial restrictions

4. Retest without sending extra live SMS unless needed
   - Run a dry diagnostic using recent logs/records.
   - If you want, after the patch I can trigger a single real test SMS to your number to confirm provider behavior.

## What I will not change

- I will not bypass opt-out rules.
- I will not switch to platform-owned SMS credentials.
- I will not store or expose private SignalWire tokens in frontend code.