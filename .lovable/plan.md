I’ll update the demo launch form so Email and Text updates are independent checkboxes, allowing visitors to select both, either one, or neither.

Plan:
1. Replace the `RadioGroup` opt-in section in `StartDemoDialog.tsx` with two separate `Checkbox` controls:
   - Email updates checkbox
   - Text updates checkbox
2. Restore independent state values:
   - `emailOptIn`
   - `smsOptIn`
3. Submit both values separately to the demo creation function:
   - `email_opt_in: emailOptIn`
   - `sms_opt_in: smsOptIn`
4. Remove the “No updates — just give me the demo” radio option, since leaving both checkboxes unchecked already means no updates.
5. Keep the existing copy:
   - `~2 emails/mo.`
   - `~2 msgs/mo.`
6. Keep SMS disabled until a phone number is entered, and reset the SMS checkbox if the phone number is cleared.

Technical details:
- File to update: `src/components/marketing/StartDemoDialog.tsx`
- Import `Checkbox` from `@/components/ui/checkbox`
- Remove the `RadioGroup` / `RadioGroupItem` import and the `optInChoice` state.
- No database migration is needed; the backend already accepts separate `sms_opt_in` and `email_opt_in` booleans.