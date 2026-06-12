# Documentation Audit — Align All Exports with Homepage

A pricing-only sweep already ran. This audit focuses on **non-price content drift** between PDFs/downloads and what the homepage and SignUp page actually say.

## Findings (with file:line)

### 1. Wrong agent count — "19 AI agents" (canonical = 24 agents / 10 operatives)
- `src/components/documentation/PlatformDocumentPDF.tsx:507` — "core 19"
- `src/components/documentation/PlatformDocumentPDF.tsx:1304` — tagline "19 AI agents. Zero stress."
- `src/components/documentation/PlatformDocumentPDF.tsx:1363` — body copy "19 AI agents working for you"
- `src/components/documentation/PlatformDocumentPDF.tsx:1433` — "Agent icons for each of the 19 AI agents"

### 2. Inconsistent per-tier agent counts
- `src/components/documentation/PricingSummaryPDF.tsx:358` — "Everything in Core (8 agents)"
- `src/components/documentation/PricingSummaryPDF.tsx:396` — "Everything in Boost (12 agents)"
- `src/components/documentation/ComprehensiveGuidesPDF.tsx:1015` — "Aura Core ($497/mo): 8 agents…"
- `src/components/documentation/ComprehensiveGuidesPDF.tsx:1019` — "Aura Boost ($994/mo): 12 agents…"

Homepage / SignUp describe consoles + operatives, not raw agent counts. Replace with operative-based language (matches `mem://architecture/ai-agent/twenty-four-agent-model-standard`).

### 3. Annual billing math drift ("10× monthly" vs homepage "~20% off")
SignUp + Index show annual = ~9.6× monthly (~20% savings). These say 10×:
- `src/pages/PlatformGuides.tsx:138`
- `src/components/documentation/PricingSummaryPDF.tsx:181, 241, 468`
- `src/components/documentation/PlatformFAQPDF.tsx:461` — also claims "17%" + "10x" in same sentence (self-contradictory)

### 4. Onboarding fee description drift (canonical = flat $497)
- `src/components/documentation/CompanyOnboardingPDF.tsx:1347–1348` — "onboarding fee equal to the selected tier's monthly price"
- Same file `:1391` — agreement line repeats the per-tier-price wording

Should read: flat $497 one-time, due at start of 60-Day Live Trial, non-refundable once onboarding begins.

### 5. Spot-check confirmed clean
- All `$` strings across `src/components/documentation/` resolve to the current matrix (Core 697/497, Boost 1394/994, Pro 2788/1988, Elite 5576/3979, onboarding $497, annuals 4,771 / 9,542 / 19,085 / 38,198, savings 1,193 / 2,386 / 4,771 / 9,550).
- No legacy launch-pricing strings ($349/$549/$999/$1,749/$897/$1,797/$3,097/$1,097/$1,997/$3,497) remain.
- Trial wording ("60-Day Live Trial", "first 30 days = onboarding") consistent across PDFs and homepage.

## Fixes

**`PlatformDocumentPDF.tsx`** — replace all four "19 AI agents" mentions with "24 specialist agents organized as 10 AI Operatives" (or short form "10 AI Operatives" in the tagline). Update the `// not included in core 19` comment.

**`PricingSummaryPDF.tsx`** — replace "(8 agents)" / "(12 agents)" with operative-based wording matching homepage tier cards ("Front Desk + Field Ops operatives", etc.). Reword the three "10× / 10x monthly rate" lines to "annual billing saves ~20% (billed upfront)".

**`ComprehensiveGuidesPDF.tsx`** — rewrite the two tier-summary bullets to drop raw agent counts in favor of operative/console language; verify the "Annual billing saves ~20%" line stays as-is.

**`PlatformFAQPDF.tsx`** — fix the annual-billing FAQ answer to: "Save ~20% with annual billing (billed upfront). Example: Aura Elite annual is $38,198/year (saves $9,550 vs paying monthly)."

**`PlatformGuides.tsx`** — change tip from "Annual billing = 10x monthly rate" to "Annual billing saves ~20% vs monthly".

**`CompanyOnboardingPDF.tsx`** — rewrite section 3 body and the agreement bullet to: "A one-time **flat $497 onboarding fee** (same for every tier: Core, Boost, Pro, Elite) is due at the start of the 60-Day Live Trial and is non-refundable once onboarding begins. It covers Concierge Onboarding services and platform configuration."

## Out of scope
- No pricing matrix changes (already correct).
- No Stripe / edge-function changes.
- No homepage edits — homepage is the source of truth.

## Verification
After edits, re-run `rg -n '19 (AI )?agents|10x monthly|10× monthly|\(8 agents\)|\(12 agents\)|monthly price' src/components/documentation/ src/pages/` and confirm zero hits.
