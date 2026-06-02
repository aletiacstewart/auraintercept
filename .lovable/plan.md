## Goal
Make Campaign creation channel-aware: independent email and SMS message bodies, independent "AI Generate" buttons, and a built-in template picker for each channel (seeded with the 5 SMS samples provided).

## UI — `src/components/marketing/forms/CampaignForm.tsx`
Replace the single "Message Template" + "AI Generate" block with two channel-scoped blocks that render only when the matching channel checkbox is on:

- **Email block** (Email checked): Email Subject (existing) + "AI Generate (Email)" + new **Email Body** textarea + new **"Use template"** dropdown of email starter templates.
- **SMS block** (SMS checked): new **SMS Message** textarea with 160-char counter and "Reply STOP" reminder, "AI Generate (SMS)" button, and **"Use template"** dropdown with these 5 samples:
  1. Welcome (Post-Signup)
  2. Onboarding Reminder
  3. Product / Logic Update
  4. Service Tier Upgrade
  5. Scheduled System Alert (placeholders for date/time/link)

Form state gains `smsTemplate` alongside existing `messageTemplate` (email body).

## Template library — new `src/lib/campaignTemplates.ts`
Exports `SMS_TEMPLATES` (5 entries verbatim from the request) and `EMAIL_TEMPLATES` (matching starter set: Welcome, Onboarding Reminder, Product Update, Tier Upgrade, System Alert) as `{ id, label, subject?, body }`. Imported by the form for the dropdowns.

## Database — new migration
Add a separate SMS column so the two channels don't overwrite each other:
```sql
ALTER TABLE public.marketing_campaigns ADD COLUMN sms_template text;
```
Existing rows untouched; SMS sends fall back to `message_template` when `sms_template` is null.

## Edge functions
- `supabase/functions/generate-campaign-content/index.ts`: accept `channel: 'email' | 'sms'`. SMS prompt enforces ≤160 chars, brand prefix, "Reply STOP to opt out", no markdown. Email keeps current behavior.
- `supabase/functions/send-campaign/index.ts`: SMS sends use `campaign.sms_template ?? campaign.message_template`; email still uses `message_template`.

## Out of scope
SignalWire delivery, referral flow, segments/discounts, auth/RLS/billing.

## Files
- edit `src/components/marketing/forms/CampaignForm.tsx`
- add  `src/lib/campaignTemplates.ts`
- edit `supabase/functions/generate-campaign-content/index.ts`
- edit `supabase/functions/send-campaign/index.ts`
- add  `supabase/migrations/<ts>_add_sms_template_to_marketing_campaigns.sql`
