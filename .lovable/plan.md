## Goal

Package every screenshot already captured in `/mnt/documents/console-screenshots/` into two clean, separately downloadable zip archives — one for desktop, one for mobile.

## What gets bundled

**Desktop zip** — `console-screenshots-desktop.zip`
Includes every PNG in `/mnt/documents/console-screenshots/` (top level, non-recursive):
- 23 main console screenshots from the first run (`01-dashboard.png` … `23-customer-website-app.png`)
- 3 social media sub-tab screenshots (`sub-social-create-content/my-posts/chat.png`)
- 2 customer-facing portal pages (`customer-portal-home.png`, `customer-company-portal.png`)
- 9 operations pages (`ops-appointments`, `ops-messages`, `ops-call-history`, `ops-sms-logs`, `ops-email-logs`, `ops-quotes`, `ops-inventory`, `ops-employees`, `ops-customers`)
- Plus the 7 earlier legacy console images already in that folder (`01-customer-portal.png`, `02-field-ops.png`, etc.) — kept since they're in the same directory

**Mobile zip** — `console-screenshots-mobile.zip`
Includes all 15 PNGs in `/mnt/documents/console-screenshots/mobile/` captured at iPhone viewport (390×1600, 2x DPR).

## Steps

1. Delete the existing combined `console-screenshots.zip` to avoid confusion.
2. Create `console-screenshots-desktop.zip` from the desktop PNGs (flat structure, no nested folder).
3. Create `console-screenshots-mobile.zip` from the mobile PNGs (flat structure).
4. Emit both as `presentation-artifact` downloads.

## Out of scope

- No new screenshots captured — this is purely a repackaging step.
- No edits to the PNGs themselves (no resizing, watermarking, or renaming).
