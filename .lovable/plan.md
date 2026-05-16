## 1. What the bottom toast means

That toast — **"Suggested message copied — Paste it into the chat below to send."** — appears on the Customer Portal when the user clicks one of the four quick-action tiles (Request Service, Track My Tech, My Invoices, Reschedule Visit).

Each tile has a pre-written prompt (e.g. *"I'd like to request a service visit"*). Clicking it copies that prompt to the clipboard and shows the toast so the user can paste it into the AI chat below and send. It is informational only — no error, nothing broken. (Source: `src/pages/CustomerPortalHome.tsx`, `PortalQuickActions` `onAction` handler.)

A small UX improvement would be to auto-insert the suggested text into the chat input instead of relying on copy/paste — let me know if you want that.

---

## 2. Surface Home Health on homepage + signup

The three new verticals (Physical Therapy, Occupational Therapy, Hospice Care) already exist as industry packs and demo accounts, but the marketing surfaces don't mention them yet. Updates:

### A. Homepage industries grid (`src/pages/Index.tsx`, `industryCategories`, lines ~305-407)

Add a new 7th category card to the grid:

```text
Category: "Home Health & Therapy"
Emoji:    🩺
Subtitle: Care Services
Industries:
  • Physical Therapy        — Stethoscope icon — "Outpatient & In-Home Visits"
  • Occupational Therapy    — HandHeart icon  — "Rehab & Daily Living Support"
  • Hospice Care            — HeartPulse icon — "Medicare-Certified End-of-Life Care"
```

The grid auto-renders via `industryCategories.flatMap(...).map(industry => ...)` (line 823), so adding the entry is the only change needed. New lucide icons (`Stethoscope`, `HandHeart`, `HeartPulse`) will be added to the existing icon import block.

### B. Aura Core plan card on homepage (`src/pages/Index.tsx`, lines ~908-938)

Core is the right tier for these intake-heavy, single-location care businesses. Two small edits to the Core card only:

- Update the italic "Best for" line to:
  > *Best for solo operators, restaurants, single-location service businesses, and home-health / therapy practices.*
- Add one new feature bullet under the existing checklist:
  > ✓ HIPAA-aware intake for Physical Therapy, Occupational Therapy & Hospice

No price, onboarding fee, or trial-length copy changes (still $197 / $497 onboarding / 60-day trial).

### C. Signup page plan area (`src/pages/Auth.tsx`, plan picker line ~899)

Update the Core row's `sub` so the new verticals appear under the name:

```diff
- { id: 'starter', name: 'Aura Core', sub: 'Solo operators • Restaurants • Single-location', ... }
+ { id: 'starter', name: 'Aura Core', sub: 'Solo operators • Restaurants • Home Health • Therapy • Single-location', ... }
```

Pricing, tier id (`starter`), and Stripe mapping stay unchanged — `physical_therapy`, `occupational_therapy`, and `hospice` already resolve via `industry_template_packs` and the existing `LEGACY_TIER_MAP`.

### Out of scope (already done, no change)

- Industry template packs and demo accounts for the 3 verticals (created earlier)
- `/super-switcher` cards (auto-render from active packs)
- Tier gating logic (Core remains the canonical tier for these clusters)

### Files touched

- `src/pages/Index.tsx` — add icons, add category entry, edit Core card copy + one bullet
- `src/pages/Auth.tsx` — edit Core plan `sub` string
