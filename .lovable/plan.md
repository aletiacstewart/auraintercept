# Cleanup: Remove Duplicate Demo Companies

## Goal
Customer Console Portals currently list 37 demo companies. Reduce to one demo per industry category, plus the explicitly-kept `demo-trial-restaurants-0fa7k0`.

## Companies to DELETE (10)
All are `[DEMO] Paz` / `[DEMO] Alicia Stewart Demo Co.` trial duplicates:

| Slug | Industry |
|---|---|
| demo-trial-plumbing-ggiqyn | plumbing |
| demo-trial-plumbing-qpdger | plumbing |
| demo-trial-restaurants-06lve3 | restaurants |
| demo-trial-restaurants-42ogqa | restaurants |
| demo-trial-restaurants-6ysmco | restaurants |
| demo-trial-restaurants-8d69rz | restaurants |
| demo-trial-restaurants-jtybs7 | restaurants |
| demo-trial-restaurants-rksngw | restaurants |
| demo-trial-restaurants-rt93mx | restaurants |
| demo-trial-restaurants-smt8bk | restaurants |

## Companies to KEEP (27)
- One canonical `demo-<industry>` row per category (25 industries).
- `demo-restaurants` (canonical restaurant demo).
- `demo-trial-restaurants-0fa7k0` (per your instruction).

## Execution
1. Run a migration that deletes the 10 companies above by ID. Related rows (customers, leads, jobs, appointments, etc.) cascade via existing FKs; any non-cascading child rows will be deleted in the same migration before the company row to keep the operation atomic.
2. Verify by re-running the demo company list and confirming the Customer Portal directory now shows 27 entries.

## Notes
- This only removes records from the database. The demo-account registry / reseeder code is not changed, so future reseeds won't recreate these duplicates unless explicitly invoked.
- If you'd rather *hide* them from the Customer Portal instead of deleting (e.g. preserve historical chat/call logs), say so and I'll switch to flipping a visibility flag instead.
