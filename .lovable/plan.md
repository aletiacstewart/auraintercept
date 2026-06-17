## Plan: Force preview to load latest version

The preview iframe is showing stale code despite recent edits to `src/pages/Index.tsx`. The dev server has an HMR gate that buffers `src/` edits until end-of-turn or until explicitly flushed, and the browser/service worker may also be caching old assets.

### Steps

1. **Inspect dev-server state**
   - Check `/tmp/sandbox-state.db` vite daemon logs for any compile errors blocking HMR.
   - Check `curl http://localhost:8080/__hmr_gate` to see what edits are buffered.

2. **Flush the HMR gate**
   - `curl -X POST http://localhost:8080/__hmr_flush` to release buffered `src/` edits and re-transform modules.

3. **Verify in the preview**
   - Open `browser--view_preview` at `/` to confirm the latest Index.tsx pricing/content edits are rendering.
   - If still stale, check for an active service worker controlling `/` (the PWA SW is scoped to `/technician` but worth confirming) and check `index.html` script hashes.

4. **If still stale after flush**
   - Likely browser cache / service worker. Recommend hard refresh (Cmd/Ctrl+Shift+R) in the preview, or use the in-app "Force Refresh & Clear Cache" button in Settings → System.
   - As a last resort, restart the dev server via `code--restart_dev_server`.

5. **Report back** what was buffered, whether flush succeeded, and what the preview now shows.

No source files will be edited — this is a preview-pipeline issue, not a code issue.