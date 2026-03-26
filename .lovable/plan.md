
## Plan: Screenshot Each Console UI at 16:9 for Video

The user wants actual screenshots of their live console pages — not AI-generated art. I'll use the browser tool to navigate to each of the 7 console URLs in the preview, take a screenshot at 16:9 resolution (1920×1080), and save them as downloadable PNG files.

### The 7 Console URLs (from App.tsx):
1. `/dashboard/ai-consoles/customer-portal`
2. `/dashboard/ai-consoles/field-ops`
3. `/dashboard/ai-consoles/business-mgt-ops`
4. `/dashboard/ai-consoles/marketing-sales`
5. `/dashboard/ai-consoles/social-media`
6. `/dashboard/ai-consoles/analytics`
7. `/dashboard/content-engine` (Creative & Web Presence)

### Steps:
1. Set browser viewport to 1920×1080 (16:9)
2. Navigate to the preview URL for each console
3. Take a full-page screenshot of each
4. Save all 7 PNGs to `/mnt/documents/console-screenshots/`

### Output files:
- `console-screenshots/01-customer-portal.png`
- `console-screenshots/02-field-ops.png`
- `console-screenshots/03-business-mgt-ops.png`
- `console-screenshots/04-outreach-sales.png`
- `console-screenshots/05-social-media.png`
- `console-screenshots/06-analytics.png`
- `console-screenshots/07-content-engine.png`

No code changes to the app — purely browser capture and file export.
