
# Add Video Prompts Page to Admin Dashboard Resources

## What's Being Built

A dedicated **Promo Video Prompts** page accessible from the admin dashboard sidebar under **Platform Resources** and linked from the **Export Documentation** Outreach & Sales Toolkit section. The page will display all 34 approved AI video generation prompts (organized by console/section), each in a copyable card with color-coded console branding, assembly instructions, and a quick-reference guide.

---

## Files to Create/Modify

### 1. NEW FILE: `src/pages/VideoPromptsPage.tsx`
A full dashboard page with:
- **Header**: "Promo Video Prompts" with subtitle about using with Runway, Sora, Kling, etc.
- **Assembly Guide card** at the top (total clips, runtime, transition tips, color codes)
- **34 prompt cards** organized into 10 sections:
  - Intro (1 clip)
  - Customer Portal — Blue (5 clips)
  - Field Operations — Green (5 clips)
  - Business Operations — Purple (5 clips)
  - Outreach & Sales — Orange (4 clips)
  - Social Media — Pink/Magenta (4 clips)
  - Creative & Web Presence — Violet (3 clips)
  - Analytics & Reports — Cyan (5 clips)
  - AI Operatives Hub — Indigo (1 clip)
  - Finale (1 clip)
- Each card shows: clip number, name, duration badge, color-coded section label, and full prompt text with a **Copy** button
- Color-coded section headers matching the visual palette from the approved plan

### 2. MODIFY: `src/components/dashboard/DashboardLayout.tsx`
Add one new nav item to the **Platform Resources** group (lines 179-191):
```
{ label: 'Video Prompts', icon: Video, href: '/dashboard/video-prompts', roles: ['platform_admin'], featureColor: 'text-feature-overview' }
```
Also import `Video` from `lucide-react` (it's already imported on line 8 of ExportDocumentation, need to add to DashboardLayout).

### 3. MODIFY: `src/App.tsx`
Register the new route near line 224 alongside the other Platform Resources routes:
```tsx
<Route path="/dashboard/video-prompts" element={<ProtectedRoute><VideoPromptsPage /></ProtectedRoute>} />
```

### 4. MODIFY: `src/pages/ExportDocumentation.tsx`
Add a new card to the **Outreach & Sales Toolkit** grid (after the Industry Marketing Kits card, ~line 625) linking to the new page:
- Card border: `border-purple-500/20`
- Icon: `Video` (already imported on line 8)
- Title: "AI Promo Video Prompts"
- Description: "34 ready-to-use AI video generation prompts for Runway, Sora, Kling & more"
- List items: Console & Agent Clips, 4m 32s Full Video, Color-Coded by Console, Assembly Guide Included
- Button: `Link` to `/dashboard/video-prompts` styled as a Button (not a PDF download since it's a page link, using `ExternalLink` icon)

---

## Page Layout (Visual Structure)

```text
┌─────────────────────────────────────────────────────┐
│ 🎬 Promo Video Prompts                              │
│ 34 AI video prompts for the full platform promo...  │
├─────────────────────────────────────────────────────┤
│ ASSEMBLY GUIDE (single wide card)                   │
│ 34 clips • 4min 32sec • 0.5s dissolves within      │
│ console • 1s glitch between consoles               │
├─────────────────────────────────────────────────────┤
│ ── CLIP 1: Platform Intro ──                       │
│ [Copy] "Cinematic dark tech..."                    │
├─────────────────────────────────────────────────────┤
│ 🔵 CUSTOMER PORTAL (5 clips)                       │
│ [Clip 2] [Clip 3] [Clip 4] [Clip 5] [Clip 6]      │
├─────────────────────────────────────────────────────┤
│ 🟢 FIELD OPERATIONS (5 clips)                      │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

---

## Technical Details

- Uses existing `DashboardLayout`, `PageContainer`, `PageHeader`, `Card`, `CardContent`, `CardHeader`, `CardTitle` components — no new dependencies
- Copy-to-clipboard via `navigator.clipboard.writeText()` with a toast notification using `sonner`
- Section color styling via Tailwind border and text color classes (already available)
- `Video` icon imported from `lucide-react` in DashboardLayout (currently only `Clapperboard` is a separate import on line 63 — will add `Video` to the main import block on line 10-54)
- Route protected with existing `ProtectedRoute` wrapper, `platform_admin` role only
