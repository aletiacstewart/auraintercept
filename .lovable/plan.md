

## Restyle Audit Pages to Match Cyber-Sentry Site Theme

### What's wrong
The audit pages (`/audit` and the results screen) feel like a generic form against the dark site shell — no cyan accents, no dot-grid texture, no cinematic gradient heading, plain `bg-background` body. The rest of the public site (Index, hero, sections) uses the Cyber-Sentry palette: obsidian backgrounds, cyan glows (`rgba(0,229,255,...)`), gradient text, dot-grid overlay, and `font-brand` Bebas Neue headings.

### Restyle scope (3 files, no logic changes)

**1. `src/pages/OpportunityAudit.tsx`** — wrap `<main>` in a Cyber-Sentry shell:
- Add a subtle hero band at the top (obsidian gradient + cyan dot-grid overlay + horizontal scanline) so it visually connects to the landing hero.
- Section background `rgba(0,229,255,0.02)` to match Index sections.

**2. `src/components/audit/AgentOpportunityAudit.tsx`** (the question flow):
- Replace the plain centered `<h1>` with the cinematic gradient title used on Index (`linear-gradient(135deg, #00F2FF → #FFFFFF → #00E5FF → #214ebb)`, `WebkitBackgroundClip: text`) — kept in the existing `font-brand` Bebas Neue.
- Add a small cyan-accent badge/eyebrow above the title: "FREE • 2 MIN • NO SIGN-UP".
- Restyle the section badge with a cyan glow border (`border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.06)] text-cyan-300`).
- Style the `<Progress>` track with cyan fill via wrapping div (cyan-tinted track and indicator) and add a thin glow.
- Keep the question card itself untouched (already on theme after the prior fix).

**3. `src/components/audit/AuditResults.tsx`**:
- Add a top "results hero" header above the existing cards: gradient `font-brand` title ("YOUR AURA INTERCEPT MATCH"), small cyan eyebrow ("AUDIT COMPLETE"), and the recommended-tier name in cyan.
- Wrap the page in a `cyber-dot-grid` background (already a global utility in `index.css`) so it matches Index sections.
- Update the gradient icon-badge ring on the hero result card to use cyan glow (`shadow-[0_0_30px_rgba(0,229,255,0.35)]`) instead of generic shadow.
- Re-style the "Fit Score" pill, the 3 stat tiles, and the "What's Included" panel borders to use `border-[rgba(0,229,255,0.18)]` + `shadow-[0_0_24px_rgba(0,229,255,0.06)]` so they read as Cyber-Sentry SOC tiles, not generic cards.
- Keep all content, all numbers, the PDF download CTA, and the tier-comparison logic exactly as-is.

### What stays the same
- All copy, scoring, tier recommendations, PDF generation, download flow, retake button, and CTAs.
- The traffic-light answer colors (green/yellow/orange/red) — already on-brand.
- The 4 brand colors per tier in `TIER_COLORS` (CORE cyan, BOOST violet, PRO emerald, ELITE primary/orange).

### Out of scope
- No changes to questions, scoring math, or `types.ts`.
- No changes to `AuditChecklistPDF.tsx` (PDF stays Helvetica + neutral as required).
- No changes to `PublicHeader` / `PublicFooter`.

### Files touched
- `src/pages/OpportunityAudit.tsx`
- `src/components/audit/AgentOpportunityAudit.tsx`
- `src/components/audit/AuditResults.tsx`

