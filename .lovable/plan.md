Plan to resolve the preview not updating:

1. Check whether the app is rendering but the preview is serving cached modules.
2. Inspect the dev-server/HMR state for buffered changes or compile errors.
3. If the server is healthy, flush the preview update gate so the latest `src/` edits are re-transformed.
4. Re-open/verify the preview after the flush and report whether it is showing the latest pricing/content changes.
5. Only if errors appear, inspect the relevant component and prepare a targeted fix.