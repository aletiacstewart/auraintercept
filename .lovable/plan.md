## Problem

The Customer Journey tab fails with a Mermaid parse error:

```
Parse error on line 8: ...tomer, Triage      Journey books appt: ...
Expecting 'section'/'taskName', got 'journey'
```

Mermaid's journey lexer reserves the keyword `journey`. The task line `Journey books appt: 5: Customer, CJ` starts with `Journey`, which the parser tokenizes as the diagram-type keyword and bails. The `%%{init}%%` themeVariables block is fine; the keyword collision is the sole cause.

## Fix

### 1. `src/pages/Architecture.tsx` — rename the offending task

In the `journey` chart (around line 429), rename:
- `Journey books appt: 5: Customer, CJ` → `Book appointment: 5: Customer, CJ`

While there, sanity-check other task names for reserved-word starts (`journey`, `section`, `title`) — none of the remaining lines collide, so no other edits needed.

### 2. Verify PNG/PDF export works for every tab

The previous fix moved exports to `html2canvas` on the SVG's parent. Journey, sequence, and ER diagrams render into different SVG containers than flowcharts, so confirm:
- Overview (flowchart) — PNG/PDF
- Operatives (flowchart) — PNG/PDF
- Network Flow (flowchart) — PNG/PDF
- Handoffs (sequence) — PNG/PDF
- Consoles (flowchart) — PNG/PDF
- Roles & Access (flowchart) — PNG/PDF
- Database (ER) — PNG/PDF
- Customer Journey (journey) — PNG/PDF (after fix above)
- Edge Functions (flowchart) — PNG/PDF

If `html2canvas` returns a blank/clipped canvas for journey or ER diagrams (different DOM structure), `src/components/architecture/MermaidDiagram.tsx` `captureContainerCanvas()` falls back to capturing the `.mermaid` wrapper instead of `svg.parentElement`, with `windowWidth`/`windowHeight` derived from the SVG's `getBoundingClientRect()` to guarantee the full diagram is in frame.

### Out of scope

No content rewrites, no new tabs, no styling changes to the Cyber-Sentry frame.
