## Goal
Produce a single PDF the user can download that lists every question and every answer choice used in the Free AI Opportunity Audit.

## Scope of content
- **Universal questions** (12 questions across 7 sections) from `src/components/audit/types.ts` — `UNIVERSAL_QUESTIONS`.
- **Industry-specific questions** from `src/lib/auditIndustryQuestions.ts` for every industry the audit supports (grouped by industry at the end of the PDF, since these are appended per-vertical at runtime).
- For each question: section, question text, short description, and all 4 answer options (labels only — internal tier scores excluded).

## Deliverable
- A single PDF written to `/mnt/documents/aura-free-audit-questions.pdf` and surfaced with a `<presentation-artifact>` tag so the user can download it.

## How it will be built
- One-off Python script (reportlab) run in the sandbox that:
  1. Imports the question data by parsing `types.ts` and `auditIndustryQuestions.ts` (or, simpler, mirrors the data via a small TS→JSON dump using `tsx`/`node`).
  2. Renders a titled, sectioned PDF: cover heading, then Universal section, then one heading per industry with its extra questions.
  3. Runs QA (pdftoppm → inspect pages) and fixes any layout issues before delivery.
- No app code changes — this is a one-off artifact export, not a new feature or route.

## Out of scope
- No new page/button inside the app.
- No changes to audit logic, scoring, or copy.
- Tier-score numbers are omitted (internal weighting, not user-facing).

Confirm and I'll switch to build and generate the PDF.
