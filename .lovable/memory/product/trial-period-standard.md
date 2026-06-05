---
name: 60-Day Live Trial Standard
description: 60-day trial (30d onboarding + 30d live), onboarding fee due at start, progress math, reminders
type: feature
---
- All plans include a 60-Day Live Trial. First 30 days = Concierge Onboarding, then 30 days of full live use.
- One-time onboarding fee is invoiced at the START of the trial (non-refundable once onboarding completes).
- DB default: public.companies.trial_ends_at = now() + interval '60 days'.
- Progress bar math: (60 - daysRemaining) / 60. TrialBanner totalDays = 60.
- Reminder emails at 7d, 3d, 1d remaining (see trial-reminders edge function).
- Customer-facing copy must say "60-Day Live Trial" consistently across UI, TOS, intake, marketing.
