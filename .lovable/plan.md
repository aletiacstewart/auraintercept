# Remove duplicate onboarding fee block above Beta box

In `src/pages/Index.tsx` (lines 1069–1070), delete the two `<p>` lines that duplicate the onboarding fee + coverage text now living inside the Beta box. Keep the surrounding "90-Day Live Trial / honest feedback / additional employees" lines and the Beta box block intact.

Lines to remove:
- L1069: `One-Time Onboarding Fee (due at start of 90-Day Live Trial): Core $497 • Boost $697 • Pro $1,197 • Elite $2,197`
- L1070: `Covers account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation … Non-refundable once onboarding begins.`

No other surfaces touched.