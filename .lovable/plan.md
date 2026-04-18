

## Aura Intercept — Marketing-Site Parity & "Set It and Forget It" Onboarding

This is a large, high-value initiative. Most building blocks already exist (24 agents → 10 operatives, 7 consoles, 4-tier model, `FastStartWizard`, `FeatureGate`, Knowledge Base, Customer Portal, PWA, ROI calculator). The work is to **harden, gate, and surface them** to match the new marketing site — not rebuild.

To keep each step reviewable I'm proposing 5 phases. I recommend shipping Phases 1 + 2 in this loop (the highest-leverage items) and tackling 3–5 in follow-up loops.

### Phase 1 — Plan visibility & upgrade CTAs (foundation)
- `CurrentPlanChip` in `GlassHeader` showing "Current Plan: Core" + "Upgrade" link to `/dashboard/subscription`.
- Standardize `FeatureGate` lock UI: tier name + one-click upgrade button on every blocked surface.
- Audit `useSubscription` tier matrix vs. the marketing pricing table; fix mismatches in `subscriptionTiers.ts`.
- Verify new sign-ups default to `core` + 30-day trial in `Auth.tsx` and DB defaults.

### Phase 2 — 5-Step onboarding wizard (your highest priority)
Extend `FastStartWizard` from 4 → 5 steps:
1. Welcome + plan confirmation (Core + 30-day trial badge)
2. **NEW**: Import from Website URL or PDF → new edge function `kb-auto-import` (Lovable AI gemini-2.5-flash) auto-fills Services, Hours, FAQ, Smart Links, AI Content Profile
3. Connect Google Calendar / Stripe (already wired) + optional QuickBooks/Xero stub
4. One-click "Enable All Agents in My Plan"
5. Install widget + Customer Portal QR + public URL
- Success screen: *"Your 24 AI agents are now live 24/7"*

### Phase 3 — KB auto-import + universal "How to Use" pattern
- "Import from Website / PDF" buttons in Knowledge Base console (reuses Phase 2 edge fn).
- Reusable `<HowToUseModal>` (blue `?` trigger): What runs 24/7 · When you step in · Steps · Home-service example. Drop into all 7 consoles + KB sub-tabs + AI Operatives Hub.
- Inventory low-stock → triggers Dispatch operative.
- AI Content Profile "Test Content" button.
- Smart Links auto-generate QR codes.

### Phase 4 — Owner dashboard + ROI
- Reorder `AuraCommandCenter` tiles: Today's Bookings · Open Jobs · Revenue This Week + ROI · AI Activity · Quick Actions.
- Promote ROI calculator (currently admin-only at `/dashboard/calculators`) into `CompanyAdminDashboard` Pro mode as an embedded widget.
- Add What-If sliders + jsPDF export to ROI calculator.
- Status color pass: green/yellow/red chips across all console KPI strips.

### Phase 5 — Customer Portal & widget simplicity + mobile Field Ops
- Settings → Customer Portal → Install: prominent "Copy Embed Code" + "Copy Portal URL" + QR card.
- `/technician` tap-target audit (≥48 px) and verify offline PWA cache for job list.
- Verify portal AI greeting pulls from KB.

### Tier matrix (gating source of truth — confirm before Phase 1)

| Console / Agent | Core | Boost | Pro | Elite |
|---|:-:|:-:|:-:|:-:|
| Front Desk (Receptionist, Booking, Follow-Up, Review) | ✓ | ✓ | ✓ | ✓ |
| Web Presence + Smart Website | ✓ | ✓ | ✓ | ✓ |
| Creative Content (basic) | ✓ | ✓ | ✓ | ✓ |
| Dispatch + Field Ops + Check-In | — | ✓ | ✓ | ✓ |
| Social Media Ops | — | — | ✓ | ✓ |
| Outreach & Sales Ops | — | — | ✓ | ✓ |
| Analytics (full 8-tab suite) | basic | basic | ✓ | ✓ |
| Business Mgmt + Inventory automation | — | — | ✓ | ✓ |
| Priority support + concierge | — | — | — | ✓ |

This matches `mem://marketing/pricing/canonical-four-tier-model`. **Please confirm it matches your latest marketing screenshots before I start gating.**

### Out of scope
- Renaming or removing any of the 24 agents / 7 consoles
- Stripe price ID changes or `LEGACY_TIER_MAP` edits
- Multi-location features (excluded per memory)
- `auth.users` or Supabase reserved schemas

### Two clarifications before I start building

1. **Which phases this loop?** I recommend **Phase 1 + Phase 2** (plan visibility + 5-step onboarding with KB auto-import). Alternatives: Phase 1 only (safest), or all 5 (largest, more regression risk).
2. **Tier matrix correct?** Confirm the table above matches your new marketing pricing page, or send corrections.

Reply with answers (e.g. *"Phase 1+2, matrix is correct"*) and I'll start implementation.

