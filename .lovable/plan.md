## Audit & Update Marketing Docs, Guides, Tooltips, Video Scripts

Apply the canonical site copy across every export PDF, video prompt/script, in-app guide, tooltip, and click-through popup. Source of truth = current Homepage + SignUp + dashboard pricing, trial, industries, and third-party policy.

### Canonical facts being enforced
- **Pricing (Beta):** Core $497 (was $697) / Boost $994 (was $1,394) / Pro $1,988 (was $2,788) / Elite $3,979 (was $5,576); onboarding 50% of beta monthly per tier.
- **Trial:** 60-Day Live Demo — 30 days concierge onboarding + 30 days full live use; onboarding fee due at trial start.
- **Industries:** 25 main categories (from `src/lib/mainIndustryCategories.ts`).
- **Operatives:** "24 AI Operatives (organized into 10 operative roles)" — matches Homepage heading + architecture memory.
- **Third-party policy:** customer brings own SignalWire / ElevenLabs / Resend / Tavily / Stripe / A2P 10DLC / social accounts; each provider invoices customer directly; Aura never bundles, marks up, absorbs, or charges overage.

### Files & changes

**Export PDFs (`src/components/documentation/`)**

1. `PlatformFAQPDF.tsx` — rewrite the "What happens when my trial ends?" answer (line ~471) to describe the 30+30 structure and reminder cadence aligned to the 30-day live-use window (30 / 7 / 1 days before subscription auto-starts).
2. `WebsiteCopyPDF.tsx` (line ~571) — replace "24–48 hours operational" with "30-day concierge onboarding then 30 days of full live use." Standardize operative phrasing.
3. `SalesPitchDataPDF.tsx` (lines ~683, ~844) — same fix: remove "24–48 hours" implementation claim, replace with the 30+30 onboarding/live-use language.
4. `MarketingSalesMasterPDF.tsx` —
   - Update "Industry Packs (18)" header (line ~471) and "22 industry packs across 4 clusters" (line ~713) to "25 main industry categories."
   - Standardize "10 AI Operatives" → "24 AI Operatives (organized into 10 operative roles)" in the executive summary.
5. `PlatformDocumentPDF.tsx` — update the "22 industry packs" line (~1225) to "25 main industry categories." Standardize operative phrasing in sections at lines ~585, ~627, ~687, ~828, ~1182, ~1202, ~1222, ~1304, ~1363, ~1369, ~1433, ~1444.
6. `PricingSummaryPDF.tsx` — operative phrasing on lines ~206, ~440. Verify no stale numbers (already on canonical pricing — keep).
7. `VideoScriptsPDF.tsx` — operative phrasing on lines ~454, ~561. Keep $497 / $994 / 60-Day Live Trial copy.
8. `VideoPromptsPDF.tsx` — spot pass for "10 AI Operatives" / industry counts; align if found.
9. `IndustryMarketingKitPDF.tsx` — cover subtitle (~314) "18 Key Industry Verticals" → "25 Key Industry Verticals."
10. `SocialMediaContentPackPDF.tsx` — operative phrasing & confirm CTA language uses "60-Day Live Trial." Already mostly current.

**Config + in-app guides**

11. `src/lib/helpSystemPrompt.ts` (line ~40) — operative phrasing update.
12. `src/lib/helpContentConfig.ts` (lines ~311, ~315, ~412, ~423) — operative phrasing updates.
13. `src/lib/documentationConfig.ts` (lines ~4, ~130, ~397) — operative phrasing updates + bump "Last updated" comment.
14. `src/lib/subscriptionAgentConfig.ts` (lines ~92, ~113) — operative phrasing in tier descriptions.
15. `src/lib/videoPromptsData.ts` — confirm 24-agent language already correct (it is); no change required other than spot-fix if older "10" copy exists.
16. `src/lib/howToUseContent.ts` and `src/lib/featureTooltips.ts` — audit pass for trial/pricing/operative drift. Current scan shows no outdated copy, but I'll re-grep before finishing and fix any straggler.

### Out of scope
- No new PDFs, no logo/graphic regeneration, no edge-function changes.
- Pricing math, Stripe IDs, and the canonical industry list are not changing — only the documents that reference them.
- Comparative tables that describe competitor pricing (e.g. "Bundled into $199+/mo Grow tier") stay — those describe other vendors, not Aura.

### Verification
After edits I'll re-grep for `14[- ]day trial`, `24[- ]hour|48[- ]hour`, `free trial`, `\$697|\$1,394|\$2,788|\$5,576`, `\b10 AI Operatives\b` without the "(organized into…)" qualifier, and `18 industry|22 industry` to confirm nothing is left behind.
