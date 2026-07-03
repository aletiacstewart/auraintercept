Update the 3rd-party integrations section on the Aura homepage (`src/pages/Index.tsx`) to tighten the copy and consolidate the credit-card disclosure.

### Changes

1. **Move the "Why your own account" block**
   - Extract it from inside the SMS/10DLC warning section and place it directly above the vendor cards grid.

2. **Rewrite the block text**
   - New copy: "If another business's texts or emails ever get flagged for spam or a violation, your number, email, and sending reputation stay completely unaffected — because it was never shared in the first place."

3. **Remove per-card credit-card lines**
   - Remove the "Valid credit card required..." lines from the Resend, ElevenLabs, and Tavily vendor cards.

4. **Add a consolidated credit-card notice**
   - Place directly under the "Why your own account" block: "A valid credit card is required on every provider account — including during your trial. Vendor fees are set by the provider and may change at any time."

### Verification
- Use a Playwright screenshot of the homepage to confirm the relocated block renders above the vendor grid and the per-card credit-card lines are gone.