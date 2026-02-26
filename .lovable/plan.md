
## Full Console Color Audit — White Background Issues

The page-level console wrapper files (`AnalyticsConsole.tsx`, `FieldOpsConsole.tsx`, etc.) are all clean — they just wrap with `PageContainer`. The color problems live inside the **child component files**. Here is the complete cross-console audit:

---

### Summary of Issues Found

| Console | File | Issue Type | Severity |
|---|---|---|---|
| Analytics | `AnalyticsAgentConsole.tsx` line 42 | `text-pink-400` in quick action featureColor | Minor |
| Analytics | `CompanyAnalytics.tsx` lines 504, 514, 535–542 | `text-green-400`, `text-amber-400` for stat values; `bg-green-500/20 border-green-500/30`, `bg-amber-500/20 border-amber-500/30` revenue boxes | **Medium** |
| Analytics | `PlatformAnalytics.tsx` line 514 | `text-green-400` for revenue figure | Minor |
| Analytics | `ForecastAnalytics.tsx` line 412 | `bg-amber-500/10 border-amber-500/20` — actually fine (amber-500 text used) | Acceptable |
| Social | `SocialContentCalendar.tsx` lines 58–64 | Full `PLATFORM_COLORS` map: `text-pink-400`, `text-blue-400`, `text-indigo-400`, `text-green-400`, `text-rose-400`, `text-sky-400` all dark-mode tones | **High** |
| Social | `SocialContentCalendar.tsx` lines 142–143, 222, 271–272, 306–307 | `text-pink-400`, `bg-blue-500/10 text-blue-400`, `bg-green-500/10 text-green-400` | **High** |
| Social | `SocialMediaAgentConsole.tsx` lines 28–35, 160–161 | `text-pink-400` in quick actions and `agentColor` | Minor (used in dark console widget) |
| Field Ops | `AppointmentCalendar.tsx` lines 480–486, 706–726 | `bg-blue-500/10 text-blue-600`, `bg-green-500/10 text-green-600` etc. — **actually fine**, uses -600 text | ✅ OK |
| Field Ops | `CommunicationLogs.tsx` lines 131–136 | `bg-green-500/10 text-green-600`, `bg-red-500/10 text-red-600` etc. — uses -600 text | ✅ OK |
| Field Ops | `TechnicianJobQueue.tsx` line 683 | `bg-blue-500/5 border-blue-500/20 text-blue-600` — uses -600 text | ✅ OK |
| Social | `SocialScheduleQueue.tsx` line 414 | `border-pink-500/30 bg-pink-500/10 text-pink-600` — uses -600 text | ✅ OK |
| Marketing | `SocialContentCard.tsx` lines 197, 204 | `text-purple-400`, `text-blue-400` in badges on white cards | **Medium** |

---

### The 3 Files That Need Fixing

#### File 1: `src/components/analytics/CompanyAnalytics.tsx`

**Lines 504, 514** — Revenue figure colors:
- `text-green-400` → `text-green-600`
- `text-amber-400` → `text-amber-600`

**Lines 535–542** — Revenue breakdown boxes:
- `bg-green-500/20 border border-green-500/30 text-green-400` → `bg-green-50 border border-green-200 text-green-700`
- `bg-amber-500/20 border border-amber-500/30 text-amber-400` → `bg-amber-50 border border-amber-200 text-amber-700`

**Lines 369, 582** — Checkmark icons:
- `text-green-400` → `text-green-600`

---

#### File 2: `src/components/social/SocialContentCalendar.tsx`

**Lines 58–64** — `PLATFORM_COLORS` map (all dark-mode tones, renders on white background):

| Before | After |
|---|---|
| `bg-pink-500/20 text-pink-400 border-pink-500/30` | `bg-pink-100 text-pink-700 border-pink-200` |
| `bg-blue-500/20 text-blue-400 border-blue-500/30` | `bg-blue-100 text-blue-700 border-blue-200` |
| `bg-indigo-500/20 text-indigo-400 border-indigo-500/30` | `bg-indigo-100 text-indigo-700 border-indigo-200` |
| `bg-green-500/20 text-green-400 border-green-500/30` | `bg-green-100 text-green-700 border-green-200` |
| `bg-rose-500/20 text-rose-400 border-rose-500/30` | `bg-rose-100 text-rose-700 border-rose-200` |
| `bg-sky-500/20 text-sky-400 border-sky-500/30` | `bg-sky-100 text-sky-700 border-sky-200` |

**Line 143** — Calendar header icon:
- `text-pink-400` → `text-pink-600`

**Line 222** — Current day date text:
- `text-pink-400` → `text-pink-600`

**Lines 271–272** — Scheduled post indicator:
- `bg-blue-500/10 border-blue-500/20 text-blue-400` → `bg-blue-50 border-blue-200 text-blue-600`

**Lines 303–308** — Published post indicator:
- `bg-green-500/10 border-green-500/20 text-green-400` → `bg-green-50 border-green-200 text-green-600`

---

#### File 3: `src/components/marketing/SocialContentCard.tsx`

**Line 197** — AI Generated badge:
- `bg-purple-500/15 text-purple-400 border-purple-500/30` → `bg-purple-100 text-purple-700 border-purple-200`

**Line 204** — LinkedIn Visibility badge:
- `bg-blue-500/15 text-blue-400 border-blue-500/30` → `bg-blue-100 text-blue-700 border-blue-200`

---

### What Does NOT Need Fixing

- **`AnalyticsAgentConsole.tsx`** line 42: `text-pink-400` is used as a `featureColor` prop passed to `QuickActionGrid`. That component handles the hover glow on a **dark console surface** — this is intentional and correct.
- **`SocialMediaAgentConsole.tsx`** lines 160–161: `agentColor="text-pink-400"` and `agentBgColor` are used inside the `GlassHeader` and `MobileTabNav` dark console components — intentional dark-mode UI.
- **`AppointmentCalendar.tsx`**, **`CommunicationLogs.tsx`**, **`TechnicianJobQueue.tsx`**, **`SocialScheduleQueue.tsx`**: All already use `-600` text variants with light bg tones — correctly styled for light background.
- **`ForecastAnalytics.tsx`**: Uses `text-amber-500` (not 400) with `bg-amber-500/10` — readable enough.
- **`PlatformAnalytics.tsx`** line 514: `text-green-400` for a revenue figure in a leaderboard list — borderline but minor.

---

### 3 Files to Edit

```text
src/components/analytics/CompanyAnalytics.tsx  — 6 color swaps
src/components/social/SocialContentCalendar.tsx — 10 color swaps  
src/components/marketing/SocialContentCard.tsx  — 2 badge swaps
```

All are pure color value replacements. No structural changes, no logic changes.
