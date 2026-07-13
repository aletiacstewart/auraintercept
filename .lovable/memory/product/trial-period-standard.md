---
name: 60-Day Live Trial Standard
description: 60-day trial (30d onboarding + 30d live), onboarding fee due day 31, first monthly fee day 61, progress math, reminders
type: feature
---
- All plans include a 60-Day Live Trial. First 30 days = Concierge Onboarding, then 30 days of full live use.
- One-time onboarding fee is invoiced on day 31 of the trial (after concierge onboarding is complete), non-refundable once onboarding completes.
- First monthly plan fee is charged on day 61 (after the full 60-Day Live Trial).
- DB default: public.companies.trial_ends_at = now() + interval '60 days'.
- Onboarding fee tracking: public.companies.onboarding_fee_cents, onboarding_fee_due_at (= trial start + 30 days), onboarding_fee_status ('pending' | 'waived' | 'charged' | 'failed').
- Progress bar math: (60 - daysRemaining) / 60. TrialBanner totalDays = 60.
- Reminder emails at 7d, 3d, 1d remaining (see trial-reminders edge function).
- Customer-facing copy must say "60-Day Live Trial" consistently across UI, TOS, intake, marketing.
