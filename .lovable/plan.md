

# Fix Architecture Diagrams: Labels, Downloads, and PDF Export

## Problem
From your screenshots, three issues are clear:
1. **No text labels visible** inside diagram nodes — colored boxes render but all text is stripped out. Root cause: DOMPurify sanitization is removing `foreignObject` HTML elements that Mermaid uses for labels when `htmlLabels: true`.
2. **PNG download broken** — the canvas-based approach fails due to foreignObject/CORS issues with HTML labels in SVG.
3. **No PDF download option** — requested but not implemented.

## Solution

### 1. Fix label rendering in MermaidDiagram.tsx
- Update DOMPurify config to allow `foreignObject`, `div`, `span`, `br`, and related HTML elements inside SVG, OR switch to `htmlLabels: false` in Mermaid config so labels render as native SVG text (no foreignObject needed, simpler sanitization).
- Best approach: set `htmlLabels: false` globally — this makes Mermaid render labels as pure SVG `<text>` elements, which DOMPurify's SVG profile already allows. This fixes labels across all diagram types without weakening sanitization.
- Replace `<br/>` in chart definitions with `\n` line breaks (SVG text compatible).

### 2. Fix PNG download
- With `htmlLabels: false`, the SVG no longer contains foreignObject, so canvas `drawImage` will work correctly for PNG export.
- Add proper dimensions handling: parse SVG viewBox/width/height to set canvas size accurately.

### 3. Add PDF download button
- Use `jsPDF` library to generate a single-page PDF from the rendered SVG.
- Convert SVG to canvas (same as PNG), then embed the canvas image into a PDF page.
- Add a "PDF" download button alongside SVG and PNG.

### 4. Ensure all diagrams have visible labels
- Replace `<br/>` with `\n` in all flowchart node labels across all 9 diagrams in Architecture.tsx.
- The `erDiagram` and `sequenceDiagram` and `journey` types already use plain text labels (no HTML), so they should render correctly once DOMPurify stops stripping content.

## Files to edit

1. **`src/components/architecture/MermaidDiagram.tsx`**
   - Set `htmlLabels: false` in mermaid config
   - Update DOMPurify to add `WHOLE_DOCUMENT: true` and allow necessary SVG + HTML tags
   - Fix PNG export to handle pure-SVG rendering
   - Add PDF download button using jsPDF
   - Add `FileText` icon import for PDF button

2. **`src/pages/Architecture.tsx`**
   - Replace all `<br/>` in node labels with `\n` for SVG text rendering compatibility

3. **Install `jspdf`** package for PDF generation

## Technical details
- `htmlLabels: false` forces Mermaid to use `<text>` SVG elements instead of `<foreignObject>` + HTML divs
- This eliminates the DOMPurify stripping issue and the canvas taint/CORS issue for PNG export simultaneously
- PDF export: render SVG to canvas at 2x resolution, then use `jsPDF.addImage()` to embed as PNG in an A4 landscape PDF

