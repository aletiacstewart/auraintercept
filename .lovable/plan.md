# Standardize 10 Operatives / 24 Agents Across the Platform

## Canonical phrasing (single source of truth)

- **Long form:** "24 AI agents organized into 10 Operatives"
- **Short chip / inline:** "10 Operatives · 24 Agents"
- **Operative count only** (cards, taglines): "10 AI Operatives"
- Never write "19 agents", "8 agents", "12 agents", "all 24 agents" as standalone tier descriptors. Tier cards use operative counts; PDFs may add the agent breakdown in parentheses.

## Per-tier counts (canonical)

Derived from `TIER_AGENT_CONFIG` in `src/lib/subscriptionAgentConfig.ts`:

| Tier | Operatives | Agents | Card label | PDF label |
|---|---|---|---|---|
| Core (`starter`) | 5 | 12 | "5 AI Operatives" | "5 Operatives · 12 Agents" |
| Boost (`connect`) | 7 | 15 | "7 AI Operatives" | "7 Operatives · 15 Agents" |
| Pro (`performance`) | 10 | 22 | "10 AI Operatives" | "10 Operatives · 22 Agents" |
| Elite (`command`) | 10 | 24 | "10 AI Operatives" | "10 Operatives · 24 Agents (full suite + AI Hub)" |

(Final per-tier counts will be re-derived from `TIER_AGENT_CONFIG` during the edit pass; if the live config differs from the table above, the live config wins and the table is the only thing that changes.)

## Files to update

**Cards / marketing UI (operatives only):**
- `src/pages/Index.tsx` — already mostly clean; normalize "10 AI operatives" capitalization to "10 AI Operatives"; keep "See the 24 agents that power this" link.
- `src/pages/Subscription.tsx:148, 857` — replace "Core … 8 AI agents" / "Elite … all 24 agents" with operative counts (and "(full suite of 24 agents)" only for Elite).
- `src/pages/Help.tsx:691` — rephrase "Full suite of 24 agents…" to "All 10 AI Operatives (24 agents)…".
- `src/pages/AIAgentsHub.tsx`, `src/pages/DesignPreview.tsx`, `src/pages/PlatformGuides.tsx:133,192`, `src/pages/Architecture.tsx`, `src/pages/ExportDocumentation.tsx` — normalize to canonical phrasing.
- `src/components/landing/CompetitiveDifferentiation.tsx` — already canonical, leave.

**PDFs (operatives + agents, dual-count where it adds clarity):**
- `src/components/documentation/PricingSummaryPDF.tsx` — per-tier headers add "(X Operatives · Y Agents)"; "All 10 AI Operatives" stays for Elite; tagline lines normalized.
- `src/components/documentation/WebsiteCopyPDF.tsx` — already uses dual form; normalize stragglers and meta descriptions to "10 AI Operatives (24 agents)".
- `src/components/documentation/PlatformDocumentPDF.tsx` — confirm comment + slide titles use "24-agent / 10-operative".
- `src/components/documentation/ComprehensiveGuidesPDF.tsx`, `PlatformFAQPDF.tsx`, `CompanyOnboardingPDF.tsx`, `MarketingSalesMasterPDF.tsx`, `SalesPitchDataPDF.tsx`, `VideoScriptsPDF.tsx`, `SocialMediaContentPackPDF.tsx`, `BrandAssetGuidePDF.tsx` — sweep for "19 agents", "8 agents", "12 agents", "all 24 agents" and replace with canonical phrasing.

**Code/library strings:**
- `src/lib/helpSystemPrompt.ts`, `src/lib/helpContentConfig.ts`, `src/lib/documentationConfig.ts`, `src/lib/howToUseContent.ts`, `src/lib/videoPromptsData.ts`, `src/lib/subscriptionAgentConfig.ts` (description fields only) — normalize phrasing.
- `supabase/functions/ai-agent-chat/index.ts:3438` — Elite description normalized to "All 10 AI Operatives (24 agents) + enterprise features".

**Memory + canonical docs:**
- `.lovable/memory/architecture/canonical-naming-registry.md` — update per-tier lines to include operative + agent counts.
- `.lovable/memory/architecture/ai-agent/twenty-four-agent-model-standard.md` — reaffirm canonical phrasing rule.
- `.lovable/memory/index.md` Core section — already says "24 agents = 10 operatives"; add: "Canonical phrasing: '24 AI agents organized into 10 Operatives'. Cards show operatives only; PDFs may show both."

**Locales:**
- `src/locales/en/marketing.json`, `src/locales/es/marketing.json` — no count strings today; add a shared `operativesShort` / `operativesLong` key for reuse and verify ES translation.

## Out of scope

- No pricing, Stripe, edge-function billing logic, or tier-gating changes.
- No changes to the underlying agent IDs, operative IDs, or `TIER_AGENT_CONFIG` arrays.
- No homepage layout/design changes — copy normalization only.

## Verification

After edits, run:

```text
rg -n -i '\b(19|20|21|22|23|25)\s*(ai\s*)?agents\b|\(8 agents\)|\(12 agents\)|all 24 agents\b' src/ supabase/functions/ .lovable/memory/
```

Expected: zero hits (except inside the canonical phrase "24 agents organized into 10 Operatives").

Spot-check rendered PDFs (PricingSummary, WebsiteCopy, PlatformDocument) by visual review; confirm cards on `/`, `/subscription`, `/dashboard/export-docs` show operative counts.
