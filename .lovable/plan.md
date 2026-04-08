

# Fix Architecture Diagrams: Render, Label, and Color-Code

## Problem
The architecture diagrams on `/dashboard/architecture` are rendering blank. Two root causes:
1. **Mermaid `securityLevel: 'strict'`** blocks HTML labels (`<br/>`) — nodes render empty
2. **No color coding** — diagrams lack visual distinction by platform category/tier

## Solution

### 1. Fix MermaidDiagram.tsx rendering
- Change `securityLevel` from `'strict'` to `'loose'` so HTML labels (`<br/>`) render correctly
- Add dark-theme-compatible `themeVariables` for better contrast and readability

### 2. Color-code all 9 diagrams in Architecture.tsx by category
Apply `classDef` styles to every diagram using the platform's tier/category colors:
- **Core** — green (`#059669` fill, `#34d399` border)
- **Boost** — blue/sky (`#0284c7` fill, `#38bdf8` border)
- **Pro** — purple (`#7c3aed` fill, `#a78bfa` border)
- **Elite** — amber (`#b45309` fill, `#f59e0b` border)
- **System/Shared** — slate (`#334155` fill, `#64748b` border)
- **External** — rose (`#be123c` fill, `#fb7185` border)
- **Entry/Public** — teal (`#0d9488` fill, `#2dd4bf` border)

Each node gets a `classDef` class assignment so the tier it belongs to is instantly visible.

### 3. Ensure all nodes have clear text labels
- Replace any unlabeled or ambiguous nodes with descriptive text
- Verify every subgraph has a readable title
- Add `class` assignments to every node in every diagram

### Files to edit
1. **`src/components/architecture/MermaidDiagram.tsx`** — fix `securityLevel`, add theme variables
2. **`src/pages/Architecture.tsx`** — add `classDef` color definitions and `class` assignments to all 9 diagram charts

