## Goal
Drive the Audit Report to zero "open" badges by resolving the 9 remaining findings, in order of effort.

## Quick wins (S)

1. **naming-control-centers** — `src/pages/Auth.tsx` L840: replace "Control Centers" → "consoles" to match Help.tsx canonical wording.
2. **naming-pack-schema-missing** — `src/lib/industryPackSchema.ts`: either remove the dead file + its single test reference, or update the memory pointer to reflect that the registry lives inline in `useIndustryPack`. Decision: remove file + update `consoleNamingConsistency.test.ts` import.
3. **css-console-logs** — Strip or gate the 38 stray `console.log/debug` calls in `src/` behind `if (import.meta.env.DEV)`. Keep `console.warn`/`console.error`.
4. **marketing-privacy-lovable-link** — `src/pages/PrivacyPolicy.tsx` L250: swap the lovable.dev/privacy link to a section pointing at the in-app `/privacy` and remove the external white-label leak. (Confirm with user only if removing wholesale.)
5. **edge-url-comments-leak** — `src/lib/url.ts` L16–17: rewrite the docstring to reference `auraintercept.ai` instead of `lovable.app`.
6. **dashboard-view-mode-verify** — Read `src/hooks/useDashboardViewMode.ts`; confirm it reads/writes `localStorage` on mount + on toggle. Add a minimal vitest covering persistence across remounts. Mark fixed.

## Medium (M)

7. **help-industry-coverage** — Run a script that loops the 18 vertical IDs through `industryHelpContent.ts` + `industryHelpPrompts.ts` to confirm each returns vertical-specific copy (not the HVAC fallback). Output a coverage table; fill any gaps. Mark fixed once 18/18 pass.

## Large (L)

8. **css-raw-color-classes** — Re-classify the remaining hits as intentional:
   - `TalkToAura` (20), `CyberSentryPortalMockup` (14), `Index` (4), `PublicChat` (6), `AIAgentFlowDemo` (3) → these are explicit dark/marketing surfaces.
   - Add a brief inline comment header at the top of each file: `/* Cyber-Sentry exception: explicit dark surface — raw slate/white literals intentional */`.
   - Flip the finding to `false_positive` with the comment audit as evidence.

9. **css-internal-scrollbars** — Two real native scrollers to refactor:
   - `KnowledgeBase` doc list → wrap in `<ScrollArea className="max-h-[60vh]">` from `components/ui/scroll-area` (Radix, allowed).
   - `EmployeeAvailability` week grid → same.
   - Re-run `rg "overflow-y-(auto|scroll)" src/` and confirm only Radix primitives + the chat exception remain.

## Final step

Update `src/lib/auditFindings.ts`:
- Flip statuses to `fixed` / `false_positive` with one-line "FIXED — …" observed notes.
- Update the rollup line in `css-raw-color-classes` observed to reflect the comment-header pass.

## Technical notes

- All edits stay frontend/presentation except the help-coverage script (read-only) and the `useDashboardViewMode` test.
- No DB migrations, no edge function changes, no auth changes.
- Verify after each batch: dev server hot-reloads, `/audit` page shows the badges flipping green.

## Out of scope

- Touching marketing brand surfaces (Index hero, Aura cyan literal, Companies tenant brand defaults) — those are confirmed `false_positive`.
- The `naming-tier-internal-ids` + `workflow-multi-location-ghost` items — also confirmed `false_positive`.
