

## Enable Voice, SMS/Text, and Email on ALL Plans

Currently, the "Aura Business" ($797/mo) tier is positioned as a "digital-only" plan that excludes Talk to Aura (Voice) and SMS. This plan updates ALL 7 tiers to include voice, SMS/text, and email communication channels.

---

### What Changes

Every tier (Starter through Command) will include:
- **Message Aura (Text)** -- already universal
- **Talk to Aura (Voice)** -- currently excluded from Business tier
- **SMS Reminders** -- currently excluded from Business and Starter tiers
- **Email Reminders** -- currently excluded from Starter tier

The "Aura Business" tier will no longer be labeled "digital-only." It keeps its unique differentiator (Creative and Web Presence focus) but gains full communication channels like every other tier.

---

### Files to Update

**1. Source of Truth -- `src/lib/documentationConfig.ts`**
- Line 128: Change `hasVoice: false` to `hasVoice: true` for the `core` (Business) tier
- Update `highlights` array to add `'Talk to Aura (Voice)'` and `'SMS & Email Reminders'`
- Remove `'Message Aura (Text)'` as a standalone highlight (since all tiers now have all 3 channels)

**2. Subscription Page -- `src/pages/Subscription.tsx`**
- Line 133: Remove "Digital-only" from Business tier description
- Line 279: Change `business: 'x'` to `business: 'check'` for "Talk to Aura (Voice)"
- Line 281: Change `business: 'x'` to `business: 'check'` for "SMS Reminders"
- Line 280: Change `starter: 'x'` to `starter: 'check'` for "Email Reminders" (all plans get email)
- Line 281: Change `starter: 'x'` to `starter: 'check'` for "SMS Reminders" (all plans get SMS)
- Update Business tier highlights to include Voice
- Update SignalWire and ElevenLabs from `'Optional'` to `'Required'` for Business tier (lines 308-309)
- Update Resend (Email) from `'Optional'` to `'Required'` for Starter tier (line 306)

**3. Landing Page Pricing Table -- `src/components/landing/PricingComparisonTable.tsx`**
- Line 62: Update tooltip for "Talk to Aura (Voice)" to remove "Not available on Business tier"
- Line 158: Change `business: 'x'` to `business: 'check'` for "Talk to Aura (Voice)"
- Line 160: Change `business: 'x'` to `business: 'check'` for "SMS Reminders"
- Line 157: Change `starter: 'x'` to all `'check'` for "Email Reminders" (starter gets email too)
- Line 160: Change `starter: 'x'` to `starter: 'check'` for "SMS Reminders"
- Update SignalWire/ElevenLabs rows: Business changes from `'Optional'` to `'Required'`
- Update Resend (Email) row: Starter changes from `'Optional'` to `'Required'`

**4. Pricing Summary PDF -- `src/components/documentation/PricingSummaryPDF.tsx`**
- Lines 728: Remove "AI-ASSISTED DIGITAL FOUNDATION" label from Business tier
- Lines 742-746: Add Voice and SMS features to included operatives list
- Lines 755-761: Rewrite the "AI-Assisted Tier" info box -- remove voice exclusion language
- Lines 764-770: Remove "What's NOT Included" section that says "No Talk to Aura (Voice) - text only"
- Line 1027: Change "Voice Features (Growth+)" to "Voice Features (All Tiers)"
- Line 1033: Remove "Not needed for Business tier (text-only)" bullet point

**5. Help Content -- `src/lib/helpContentConfig.ts`**
- Line 476: Remove `'Note: Voice features disabled (digital-only tier)'` from Business tier highlights

**6. Platform FAQ PDF -- `src/components/documentation/PlatformFAQPDF.tsx`**
- Line 350: Update the subscription plan FAQ answer (also still uses old tier names/prices -- fix those too)
- Update any FAQ answers that reference Business as digital-only or text-only

**7. Database Function -- `get_company_feature_flags` (SQL migration)**
- Remove `AND c.subscription_tier NOT IN ('business')` from the `has_voice_chat` logic
- This allows the Business tier to auto-enable voice chat like all other tiers

---

### Summary of Impact

| Location | Change |
|---|---|
| `documentationConfig.ts` | `hasVoice: true` for Business tier |
| `Subscription.tsx` | Voice/SMS/Email checks for all tiers, remove "digital-only" label |
| `PricingComparisonTable.tsx` | Voice/SMS/Email checks for all tiers, update tooltips |
| `PricingSummaryPDF.tsx` | Remove digital-only language, add voice/SMS to Business |
| `helpContentConfig.ts` | Remove "voice disabled" note from Business |
| `PlatformFAQPDF.tsx` | Fix FAQ answer about plans (also fix old names/prices) |
| Database RPC function | Remove Business exclusion from `has_voice_chat` |

All 7 tiers will have full voice, SMS/text, and email capabilities after these changes.
