## Likely cause

The preview iframe is serving a cached bundle from the service worker (`public/sw.js` + `PWAUpdatePrompt`). New console/dashboard code from the last few turns is built, but the SW is handing back the old JS until it's told to skip waiting.

## Plan

1. **Verify the deployed bundle is current** — fetch `/` from the preview and diff the script hash against the local build to confirm new code is actually shipped (rules out a build failure vs. a cache issue).
2. **Force the preview to pick up the new bundle** — one of:
   - Click "Update Now" on the PWA update prompt if it's visible, OR
   - Hard refresh the preview (Cmd/Ctrl+Shift+R), OR
   - Use the in-app `useForceRefresh` hook (unregisters SW + clears caches + reloads).
3. **If still stale after step 2**, restart the dev server to flush the HMR gate and re-confirm the new business-type context strips render on Field Ops / Business Mgmt / Analytics / Customer Portal consoles.
4. **No code changes proposed** unless step 1 shows the new files aren't in the served bundle — in which case I'd investigate the build error and patch it.

## What I will not do

- Will not modify console/dashboard logic — last turn's changes are correct per the audit.
- Will not change SW caching strategy unless you ask (that's a separate hardening task).

Want me to proceed with step 1 (verify) and step 2 (force refresh) once you switch me to build mode?
