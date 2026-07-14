# Documentation Consistency Audit & Fix Pass

Sweep every guide, export PDF, video prompt/script, and public marketing surface for content that contradicts current platform standards. Fix everything found in a single pass (no per-issue confirmation, per your instruction).

## Canonical facts (source of truth)

**Pricing — Beta active:**
- Core $497/mo (was $697) · 10 employees · 8 agents · 3 consoles
- Boost $994/mo (was $1,394) · 25 employees · 12 agents · 5 consoles
- Pro $1,988/mo (was $2,788) · 50 employees · 16 agents · 5 consoles
- Elite $3,979/mo (was $5,576) · unlimited · all 24 agents · all 7 consoles + AI Operatives Hub
- Annual: $4,771 / $9,542 / $19,085 / $38,198

**Onboarding fee — CRITICAL:**
- **$0 during Beta**, waived automatically for every signup — no code required.
- Post-Beta regular = one month of plan ($497 / $994 / $1,988 / $3,979).
- **Non-refundable** with no qualifiers ("once onboarding begins/is completed" is banned).
- Invoiced day 31 of trial IF not waived (currently always waived).
- Remove all "25% OFF onboarding," legacy "$370 / $750 / $1,490 / $2,980," and "$249 / $449 / $899 / $1,549" struck-through numbers.

**Trial:** 60-Day Live Trial = 30d concierge + 30d full live. First plan fee day 61. (Header CTA uses "Live Demo"; body copy stays "Live Trial".)

**Architecture:** 24 Smart AI Agents → 10 Operatives · 7 Control Centers + AI Operatives Hub · "technician" universal field role · no CRM/Warranty (use "Lead Capture & Scoring") · no multi-location.

**3rd-party providers:** customer's own account + card, invoiced directly. Never "bundled / overage / absorbed."

## Surfaces in scope

**In-app:**
- `src/pages/PlatformGuides.tsx` (1,704 lines) + any guide data files
- `src/pages/AIAgentGuide.tsx`
- `src/pages/ExportDocumentation.tsx`
- All 16 PDFs in `src/components/documentation/*.tsx`
- `src/pages/VideoPromptsPage.tsx`, `VideoConsole.tsx`
- `VideoScriptsPDF.tsx`, `VideoPromptsPDF.tsx`

**Public marketing (per your answer):**
- `src/pages/ForBusiness.tsx`, `Index.tsx`, blog pages
- `src/locales/en/*.json`, `src/locales/es/*.json`
- Sales prompt strings: `src/lib/auraInterceptSalesPrompt.ts`, `supabase/functions/_shared/aura-intercept-sales-prompt.ts`

## Execution steps

1. **Wait for audit sub-task** (`sub_qryeqv52`) to return per-file findings with severities and line numbers.
2. **Expand scope** on return: rerun the same checks against `ForBusiness`, `Index`, blog, and locale JSON files.
3. **Batch fixes by category** — one commit-worthy pass per category, parallel file edits within each:
   - Pricing numbers (tier $/mo, annual, employee/agent/console counts)
   - Onboarding fee → "$0 during Beta" everywhere; strip legacy struck-through amounts and "25% OFF" chips
   - Non-refundable phrasing → plain "non-refundable"
   - Agent/console counts → 24 agents / 10 operatives / 7 consoles + Hub
   - 3rd-party language → strip "bundled / overage / absorbed"
   - CRM/Warranty → "Lead Capture & Scoring"; multi-location refs removed
4. **Rebuild each PDF's data arrays** where they contain stale pricing/feature tables (worst offenders: `PricingSummaryPDF`, `CompanyOnboardingPDF`, `PlatformFAQPDF`, `SalesPitchDataPDF`, `MarketingSalesMasterPDF`, `ComprehensiveGuidesPDF`).
5. **Re-grep** the canonical banned strings post-fix to confirm zero remaining hits:
   - `25% OFF`, `\$370`, `\$750`, `\$1,490`, `\$2,980`, `\$249`, `\$449`, `\$899`, `\$1,549`
   - `once onboarding (begins|is completed|has been completed)`
   - `bundled`, `overage`, `absorbed`
   - old agent counts (`26 agents`, `12 operatives`, `8 control centers`, etc.)
6. **Report back** with: (a) count of files edited per category, (b) grep-clean confirmation, (c) any items that need product decisions (e.g. new pricing table screenshots inside a PDF I can't edit).

## Technical notes

- PDF components are React (`@react-pdf/renderer` or similar) — text is in JSX, safe to string-edit.
- No schema/edge-function changes; content-only pass.
- No tests to run; verify by grep + spot-read of largest PDFs.
- Skip `PricingSummaryPDF` `ONBOARDING_FEE_TABLE` if it's already the "$0 during Beta" version from the prior round; only touch if stale.
