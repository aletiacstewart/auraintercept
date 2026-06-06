## Goal

On `/dashboard/architecture`:
1. The **Customer Journey** tab fails to render.
2. **PNG and PDF** downloads must work reliably for every diagram (today only SVG and Code feel usable; PNG/PDF silently fail on some diagrams because the SVG-to-canvas path gets tainted or the journey diagram never produces an SVG).

## Changes

### 1. Fix Customer Journey render (`src/pages/Architecture.tsx`)

Mermaid's `journey` diagram type is brittle with our global `theme: 'dark'` + custom `themeVariables` (it expects its own palette). Two fixes layered:

- Prepend a per-diagram init directive to the `journey` chart so it renders with its native palette:
  ```
  %%{init: {'theme':'base','themeVariables':{'background':'#0f172a','primaryColor':'#1e293b','primaryTextColor':'#f8fafc','primaryBorderColor':'#475569','lineColor':'#64748b','textColor':'#f8fafc','sectionBkgColor':'#1e3a5f','altSectionBkgColor':'#1e293b','sectionBkgColor2':'#0f172a','taskBkgColor':'#334155','taskTextColor':'#f8fafc','taskTextOutsideColor':'#f8fafc','taskTextLightColor':'#f8fafc','activeTaskBkgColor':'#38bdf8','activeTaskBorderColor':'#38bdf8','gridColor':'#334155'}}}%%
  ```
- Sanitize task labels (remove the duplicate `title Customer Journey` line, which collides with the section header in some Mermaid versions and is the most common cause of journey render failures).

### 2. Reliable PNG / PDF for every diagram (`src/components/architecture/MermaidDiagram.tsx`)

Replace the current `serializeSvgForExport` → `Image` → `canvas.drawImage` pipeline (which taints the canvas on diagrams that include `<foreignObject>` or external font references, causing the "PNG download failed" toast) with a DOM-capture pipeline using **`html2canvas`** on the rendered diagram container.

Concretely:
- Add dependency `html2canvas` (peer of `jspdf`, already installed).
- New helper `captureDiagramCanvas()` that calls `html2canvas(containerRef.current, { backgroundColor: '#0f172a', scale: 2, useCORS: true, logging: false })`.
- `handleDownloadPNG`: canvas → `toDataURL('image/png')` → trigger download. (SVG download stays on the existing serializer.)
- `handleDownloadPDF`: same canvas → `jsPDF` with auto orientation + multi-page support (split tall captures across A4 pages, keep the dark `#0f172a` page background and the title/description header from the existing implementation).
- Disable PNG/PDF buttons until the SVG has rendered (guard against "Diagram not ready" by checking `containerRef.current?.querySelector('svg')` and showing a toast if absent — covers the case where a diagram errored).
- Keep SVG and Code download paths unchanged.

### 3. Visual QA pass (no code change)

Open each of the 9 tabs (`overview`, `agents`, `handoffs`, `consoles`, `roles`, `operativeFlow`, `database`, `journey`, `edgeFunctions`) in preview and confirm:
- The diagram renders.
- SVG, PNG, PDF, Code buttons all produce a file or copy.

If any other diagram still fails to render after the html2canvas swap (separate from the journey fix), capture the console error and address it in the same pass.

## Out of scope

- No changes to diagram content / tier coloring / legend.
- No changes to the page layout, header, or tab structure.
- No new diagrams.

## Technical notes

- `html2canvas@^1.4.1` works with our React 18 + Vite stack and is the same library the in-codebase pattern uses for "download visualization as PNG/PDF". Bundle impact ~45 KB gzip; loaded only on the Architecture page (already code-split by route).
- We keep `jspdf` (already a dependency).
- We keep the existing `EXPORT_BACKGROUND = '#0f172a'` so PNG/PDF match the diagram theme.
