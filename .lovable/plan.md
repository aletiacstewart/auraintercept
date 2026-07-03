# Console UX & Nav IA Fixes — Review + Plan

Reviewed all 5 of Claude's recommendations against the current codebase. All are accurate and safe. Recommend implementing 1–4 as specified, and doing **only the plumbing** portion of 5 (interface + fallback wiring) without seeding half-finished per-industry copy.

---

## Fix 1 — Missing "How to Use" modals (3 consoles)

Add three entries to `src/lib/howToUseContent.ts` following the existing shape used by `analyticsConsole` / `fieldOpsConsole`:
- `specialistOperativesConsole`
- `contentEngineConsole`
- `videoConsole`

Then wire `<HowToUseModal {...HOW_TO_USE.xxx} />` into the `PageHeader` action slot of:
- `src/pages/ai-consoles/SpecialistOperativesConsole.tsx`
- `src/pages/ContentEngineConsole.tsx`
- `src/pages/VideoConsole.tsx`

## Fix 2 — Contextual "Manage Agents" deep-links

Update the `onClick` in each console's Manage Agents button:

| File | New target |
|---|---|
| `FieldOpsConsole.tsx` | `/dashboard/ai-agents/field_navigation` |
| `ai-consoles/SocialMediaConsole.tsx` | `/dashboard/ai-agents/creative_content` |
| `MarketingSalesConsole.tsx` | `/dashboard/ai-agents/outreach` |
| `BusinessManagementConsole.tsx` | `/dashboard/ai-agents/business_finance` |
| `AnalyticsConsole.tsx` | `/dashboard/ai-agents/analytics_intelligence` |
| `ai-consoles/CustomerPortalConsole.tsx` | `/dashboard/ai-agents/triage` |

Leave `SpecialistOperativesConsole` untouched (it *is* the specialist browser).

Note: this depends on the prior AgentDetailPage fix (already shipped) — the six target IDs all exist in the rebuilt `AGENT_DEFINITIONS`, so no additional detail-page work needed. **However `triage` should be double-checked** — it wasn't in the operatives list I rebuilt. If it isn't a live definition key, either add it or point Customer Portal at `customer_journey` instead. Will verify during build and choose the correct target then.

## Fix 3 — Title mismatch

`BusinessManagementConsole.tsx` currently titles the page **"Business Operations"** while the sidebar calls it **"Business Management"**. Align on **"Business Management"** (matches sidebar + tier/marketing copy). One-line change to the `PageHeader title` prop.

## Fix 4 — Generalize the hardcoded restaurants hide-rule

- Extend `ProfileLabelOverrides` in `src/lib/industryProfiles.ts` with `hiddenNavHrefs?: string[]`.
- On the restaurant profile spec(s), add `hiddenNavHrefs: ['/dashboard/appointments']`.
- In `DashboardLayout.tsx`, replace:
  ```
  if (industryPack?.industry_id === 'restaurants' && item.href === '/dashboard/appointments') return false;
  ```
  with:
  ```
  if (!isPlatformAdmin && profileSpec?.labelOverrides.hiddenNavHrefs?.includes(item.href)) return false;
  ```
- Leave the `saas_platform` "Operations Map" relabel as-is per Claude's own note — it's a one-off for the flagship tenant, not a generalizable rule.

## Fix 5 — Adaptive console titling (plumbing only)

**Recommendation: do the plumbing, skip the seed copy.**

Extend `IndustryServiceConsoleConfig` in `src/lib/industryAgentMap.ts` with optional fields:
```
businessMgmtTitle?: string;
businessMgmtDescription?: string;
marketingConsoleTitle?: string;
marketingConsoleDescription?: string;
```

Wire `BusinessManagementConsole.tsx` and `MarketingSalesConsole.tsx` to read from `serviceConfig` with fallback to today's generic copy (same pattern `FieldOpsConsole.tsx` already uses).

**Do NOT seed the "Transaction Management" / "Back of House" values in this pass.** Rationale: authoring per-cluster copy for 6 consoles × N clusters is a content decision that deserves its own dedicated pass with the same care that already went into `workerConsoleTitle`. Landing partial copy for two industries now sets an inconsistent precedent (why real estate and restaurants but not beauty, repair, outdoor?). The plumbing lets a future pass drop copy in as a pure data change with zero code risk.

If you'd rather seed the two examples now to validate the mechanism end-to-end, say so and I'll include them.

---

## Acceptance

Same as Claude's checklist, with one adjustment for Fix 5: the two consoles read from `serviceConfig` and fall back cleanly when no override is set — no seeded per-industry copy landed yet.

## Judgment calls flagged

1. **Customer Portal → `triage`**: verify this operative key exists before shipping; otherwise use `customer_journey`.
2. **Fix 5 seed copy**: skipping in this pass. Confirm or override.
