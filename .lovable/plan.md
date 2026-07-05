## Recommended Next Steps (post-audit)

The three-phase audit closed the biggest content/data drift. Here are the highest-leverage follow-ups, ordered by user-visible impact vs. effort.

### 1. Console Guide Coverage Expansion (Phase 4B)
Phase 4A rewrote 4 top consoles. The following still use short/legacy guides or none at all:
- Communications console (Voice, SMS, Missed Calls)
- Scheduling / Booking console
- Content Engine console
- Social Media console (3-tab consolidated)
- Cyber-Sentry monitoring
- Customer Portal (admin view)
- Analytics console (NLP interface)
- Settings (7-category)

Apply the same 6-section template + `HowToUseModal` wiring. ~2 guides per turn.

### 2. Live Runtime Smoke Suite
We verified via `tsgo` + grep. We have NOT verified that every console actually loads without runtime errors after all recent edits. Proposal:
- Playwright script that logs in as each demo persona (admin, employee, customer) across 3 representative industries
- Visits every top-level route, captures console errors + screenshot
- Output: `/tmp/smoke/<route>.png` + error log
- Fix anything red in a follow-up turn

### 3. Edge Function Health Sweep
106 edge functions. Recent fallback migration touched 21. Recommend:
- Query `edge_function_logs` for last 7 days, group by function, surface any with >5% error rate
- Spot-check the top offenders
- Confirm all internal-call functions still have `verify_jwt=false` where required

### 4. Empty-State Consistency Pass
`IndustryEmptyState` is used on primary list surfaces. Secondary surfaces likely still show blank cards:
- Widget/console sub-tabs (integrations, template pickers, agent detail panels)
- Modal-embedded lists (assign technician, pick customer, pick product)
- Enumerate, wire `IndustryEmptyState` or a compact variant

### 5. Accessibility + SEO Quick Pass
- Single H1 per route audit
- Missing `alt` on images (grep `<img` without `alt`)
- Meta description length check across all public routes (`/`, `/audit`, `/for-business`, `/pricing`, blog)
- JSON-LD on pricing + blog if missing

### 6. Security Memory Refresh
Run `security--run_security_scan`, triage results, update `@security-memory`. Last full sweep predates the fallback migration + guide rewrites.

### 7. Deferred (only if you want)
- Color-token purge Pass 2 (previously deferred by you)
- PDF visual QA via headless render (Phase 5 was code-only; no pixel check performed)

---

### Suggested order
1 → 2 → 4 → 3 → 5 → 6. Each is 1–3 turns. Confirm which to start with, or say "do all in order" and I'll sequence them the same way as the last run.
