## Goal
Tighten the **Demo Transparency / "What is live — and what is mocked"** grid in `IntegrationStatusPanel.tsx` so the cards are short, dense tiles (similar to the compact 4-up boxes on the homepage), instead of the tall, wordy boxes shown in the screenshot.

## Changes — `src/components/marketing/IntegrationStatusPanel.tsx`

**Section header**
- Heading: `text-2xl md:text-3xl` → `text-xl md:text-2xl`
- Description copy: trim to a single short line: *"What runs end-to-end vs. what's mocked in the 48-hour demo."*
- Remove `mb-2` on Badge → `mb-1`; section header `mb-6` → `mb-4`

**Grid density**
- Grid: `md:grid-cols-2 gap-3` → `sm:grid-cols-2 lg:grid-cols-3 gap-2` (3-up on desktop = much shorter)
- Card padding: `p-3` → `p-2.5`
- Icon box: `w-8 h-8` → `w-7 h-7`; icon `w-4 h-4` → `w-3.5 h-3.5`
- Row gap: `gap-2.5` → `gap-2`

**Per-card content trimming (the real height killer)**
- Title row: keep title + LIVE/MOCK badge (badge `text-[10px]` → `text-[9px] px-1.5 py-0`)
- Description: clamp to 2 lines via `line-clamp-2` and shrink to `text-[11px] leading-snug`
- "Real version needs" line: shrink to `text-[10px]`, `line-clamp-1`, keep Info icon at `w-2.5 h-2.5`
- Remove `mb-1` between title row and description → `mb-0.5`

**Footer**
- Disclaimer: `text-[11px] mt-4` → `text-[10px] mt-3`

## Result
- 3-column grid on desktop instead of 2 → ~33% less vertical space
- Each tile shorter (smaller icon, tighter padding, clamped text)
- Matches the compact density of the homepage 4-up stat tiles

## Out of scope
- No changes to `DEMO_FEATURE_STATUS` data
- No color/theme token changes
- Other sections on `/for-business` already compacted in prior pass
