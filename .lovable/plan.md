
## Fix: Move Concierge Onboarding Alongside Billing Requirement & Invoice Payments

### Current Problem

The three notice cards are in two different places:

- **Concierge Onboarding** — sits inside the left info column (line 1086), rendered only when `isCompanyMode` is true, as part of the integrations panel
- **Billing Requirement** + **Invoice Payments** — sit in a separate bottom section (lines 1325–1347), only shown when `mode === 'company'`

This matches what the screenshot shows: Concierge Onboarding appears above and alone, while the other two are below in a 2-column row.

### Fix

**Two changes in `src/pages/Auth.tsx`:**

1. **Remove** the Concierge Onboarding block from the left column (lines 1086–1095)

2. **Update** the bottom notices grid from `grid md:grid-cols-2` to `grid md:grid-cols-3` and add the Concierge Onboarding card as the third item, placing it alongside Billing Requirement and Invoice Payments

### Result Layout

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│   Concierge          │  Billing             │  Invoice             │
│   Onboarding         │  Requirement         │  Payments            │
│  (blue)              │  (amber)             │  (cyan)              │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Files Changed

| File | Change |
|---|---|
| `src/pages/Auth.tsx` | Remove Concierge Onboarding from left column; add it as 3rd card in the bottom `grid md:grid-cols-3` notices row |
