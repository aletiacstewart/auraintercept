
## Content: 10-Second Scripts + 9:16 Console Images for Grok Video Production

### What we know from the codebase:

**7 Consoles:**
1. Customer Portal Console
2. Field Operations Console
3. Business Mgt Ops Console
4. Outreach & Sales Ops Console
5. Analytics & Reports Console
6. Social Media Console
7. Creative & Web Presence Console

**10 AI Agents:**
1. AI Receptionist (triage)
2. Customer Journey
3. Dispatch
4. Field Navigation
5. Admin
6. Business Finance
7. Outreach
8. Creative Content
9. Web Presence
10. Analytics Intelligence

### Plan

**Step 1 — Generate 7 console images (9:16 / 1080×1920)**
Use the `generate-content-image` edge function or the AI gateway script to generate one image per console. Each image will be a cinematic, dark-theme AI-tech visual matching the console's color identity (cyan, green, orange, purple, indigo, pink, teal). No text in the images — just visuals to underlay the script on video.

**Step 2 — Write all scripts to a downloadable document**
Generate a clean PDF with:
- 7 Console scripts (10-second each, ~25-30 words spoken at ~130 wpm)
- 10 Agent scripts (10-second each, same format)
- Each script labeled with: Console/Agent name, color theme, suggested B-roll cue, spoken lines (bold), and visual direction note for Grok

**Script structure for each clip (10 seconds = ~25-30 spoken words):**
```
[0-2s] Hook / Power statement
[2-7s] Core value prop (what it does)
[7-10s] CTA / brand close ("Powered by Aura Intercept")
```

### Files to produce:
- `/mnt/documents/aura-video-scripts.pdf` — all 17 scripts in clean branded layout
- 7 console images saved to `/mnt/documents/console-images/` as PNG files

### Image style per console:
| Console | Color | Visual Theme |
|---|---|---|
| Customer Portal | Cyan/Blue | Futuristic AI receptionist, holographic chat interface |
| Field Operations | Green/Emerald | Aerial route map, GPS pins, fleet vehicles |
| Business Mgt Ops | Orange/Amber | Clean dashboard with invoices, charts, golden tones |
| Outreach & Sales | Purple/Pink | Email campaign waves, lead funnel visualization |
| Analytics & Reports | Indigo/Violet | Dark data dashboard, glowing KPI charts |
| Social Media | Pink/Rose | Multi-platform social grid, content creator scene |
| Creative & Web | Teal/Cyan | AI website builder, brand design workspace |

### Implementation approach:
- Use the Lovable AI gateway (edge function model `google/gemini-3-pro-image-preview`) for highest quality 9:16 images
- Generate the PDF using Python with fpdf2, styled with dark brand colors and clean typography
- All outputs go to `/mnt/documents/` for download

### Technical note:
This is a pure artifact generation task — no UI changes needed. Everything runs via `code--exec` scripts. The PDF and 7 PNG images are the deliverables.
