## Smoke-Suite Fix Batch

Targeted fixes for real bugs surfaced by the smoke run. Environmental noise (edge-function fetch flakes) excluded.

### Changes

1. **`src/hooks/useOnboardingState.ts`** — swap both `.single()` → `.maybeSingle()` (lines 40, 72). Kills the `PGRST116` error on new users and quiets the 406.

2. **`src/pages/Dashboard.tsx`** — swap both `.single()` → `.maybeSingle()` (lines 33, 47) for profile + company lookups. Same class of fix.

3. **`src/pages/Subscription.tsx`** — dedupe React keys in the comparison table. Change `<Tooltip key={feature.name}>` (line 769) to `<Tooltip key={\`${section.title}-${feature.name}\`}>`. Kills the duplicate-key warning for "Campaign Agent" / "Outreach Agent" which appear in multiple sections.

4. **`src/App.tsx`** — add `<Route path="/pricing" element={<Navigate to="/#pricing" replace />} />` next to existing public routes. Zero internal links point here today, but external / SEO traffic to `/pricing` was 404-ing.

### Not fixing
- **`check-subscription` FunctionsFetchError**: sandbox network flake; edge function already returns 200 OK on real failures per memory. Client swallow-and-warn is correct behavior. No code change.
- **`/dashboard/ai-agents` 406** and **`/dashboard/quick-setup` 406**: no `.single()` in those pages directly — they inherit the 406 from `useOnboardingState`, so fix #1 resolves them.

### Verification
Re-run `python3 /tmp/browser/smoke/run.py` after edits. Expect Failing count to drop from 10 → 0 (or only the environmental sub-check flakes remaining).
