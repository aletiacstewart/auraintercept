## Goal

Use ~10–25 credits to close the known polish items, keep ~75+ credits as a safety buffer for bugs you discover later. Do **not** spend credits on tutorial copy, launch path wording, or new phases — those were intentionally deprioritized.

## Operating principles

- **Batch related fixes into one build message.** Each build message bills by complexity, not per-file. Three larger messages cost less than ten small ones.
- **Skip plan mode for trivial fixes.** Plan mode is 1 credit/message; for a single obvious change, just say "do X" in build mode.
- **Don't ask me to re-verify in the browser** unless something looks broken. Browser QA already passed for Demo Elite.
- **Stop after batch 2 if everything looks good.** Batch 3 is optional polish.

## Batch 1 — Functional fix (priority, ~5–10 credits)

Fix the `/book/:slug` "Booking Page Not Found" bug surfaced during Phase 10 QA. The `get_company_public_info` RPC isn't matching the `demo-elite` slug. One message:

- Inspect the RPC definition
- Either fix the RPC lookup or fall back to UUID/slug dual-match in `PublicBooking.tsx`
- Verify with a single `read_query` against the demo company

This unblocks all customer-facing booking flows across every vertical.

## Batch 2 — Industry-aware page headers (~5–10 credits)

Wire `industryNavLabels` into the page-header components (not just the sidebar). One message covers:

- `LeadsManager`, `QuotesManager`, `InvoicesManager`, `Customers`, `Inventory` headers
- Replace hardcoded "Leads / Quotes / Customers" titles with `pack.terminology.*`
- Real-estate sees "Buyer Leads / Seller Listings", restaurants see "Reservations / Guests", etc.

Same resolution hierarchy as the sidebar — no new infra needed.

## Batch 3 — Optional cleanup (~5 credits, skip if budget-conscious)

Single message to:

- Remove or hide the orphaned tutorial steps that reference deleted routes (if any)
- Confirm the 4 demo accounts still match the seeder script
- Run the security scan once and fix only severity ≥ warning

## What NOT to spend credits on

- Tutorial copy industry overhaul (low ROI — it's a structural sidebar tour)
- `LaunchPathSelector` rewording (plan/path oriented, not vertical-specific)
- Net-new features unless the user requests one
- Re-running the same browser QA (already done in Phase 10)

## Expected total

| Batch | Credits |
|-------|---------|
| 1 — Booking fix | 5–10 |
| 2 — Header polish | 5–10 |
| 3 — Optional cleanup | 0–5 |
| **Total** | **10–25** |

Leaves ~75 credits as buffer for unexpected bugs, design tweaks the user requests, or follow-up Cloud-side issues.

## Recommended message sequence (in build mode)

1. "Fix the public booking page slug lookup for `/book/demo-elite`."
2. "Wire industry terminology into the Leads/Quotes/Invoices/Customers/Inventory page headers."
3. (Optional) "Run a security scan and fix any warnings."

That's it — no further plan-mode messages needed.