# Settings & Dashboard Polish Pass

Six focused, low-risk fixes. No layout changes.

## 1. "AI Agents Active" tile (Platform Dashboard)

**Finding:** `PlatformAdminDashboard.tsx` line 229 sets `value: stats?.companies`. The "28" is the total company count, not an agent count. This contradicts the documented 24-agent architecture.

**Fix:** Relabel the tile to `"Companies with AI Deployed"` and update the description to `"Tenants running the agent stack"`. Keep the underlying query (`stats.companies`) — that's what the number actually represents. No new query needed.

## 2. Review Platform Links — empty-state guard

**Where:** Settings → Campaigns & Reviews tab (`ReviewSettings` / campaigns section).

**Fix:**
- When the "Enable Review Requests" toggle is on but all three URL fields (Google, Yelp, Facebook) are empty, render an inline warning banner: *"Add at least one review link before enabling review requests — messages will send without a destination."*
- Disable the toggle's save action while all three are empty (soft block: allow the toggle to flip visually, but the Save/persist call is blocked and the warning stays).
- Validate each URL with a light `https?://` + host check when non-empty; show per-field error if invalid.

## 3. Call Routing — conflicting configured / not-configured state

**Where:** Settings → Communications → Call Routing section.

**Fix:** When "How is your number connected?" = *"Not configured yet"*:
- Wrap the "When a customer calls your number" card in a disabled visual state (`opacity-60`, `pointer-events-none` on selection controls).
- Change the section heading to *"Default behavior once connected"* and add a small muted note: *"This preview activates after you connect a number above."*
- Once the dropdown moves off "Not configured yet", restore the normal active styling and heading.

## 4. Review-request template tone per business profile

**Where:** `src/lib/campaignTemplates.ts` (default SMS/email template source) + wherever it's read for defaults on new companies.

**Fix:**
- Add a `reviewRequestTemplates` map keyed by profile A–J in `campaignTemplates.ts`. Two tones:
  - **Warm / emoji** (profiles serving trades, outdoor, repair, home_health, restaurants, salon, beauty, fitness): keeps the ⭐⭐⭐⭐⭐ default.
  - **Formal / no emoji** (profiles serving real_estate, professional, personal_assistant, saas_platform, medical_practice, veterinary): plain-text ask, no emoji.
- Update the default-template resolver to look up the company's profile (`businessTypeProfileMap`) and return the matching template.
- Companies can still override manually — existing edits are preserved. Only affects the *default* used when no custom template exists.

## 5. Notification bell badge

**Where:** `NotificationBell.tsx` in top nav.

**Fix:**
- Add a `useStaffNotifications` (or the existing unread-count query) subscription. Render a small pill/dot on the bell when `unreadCount > 0`:
  - `1–9` → numeric badge
  - `10+` → "9+"
  - `0` → no badge
- Confirm click opens the existing notification dropdown/list. If it doesn't currently open a list, wire it to the existing notification panel.
- Uses semantic tokens (`bg-destructive text-destructive-foreground`) — no hardcoded colors.

## 6. "All Companies" button destination

**Where:** Platform Dashboard, next to `NewSignupsWidget`.

**Fix:**
- Verify the button's target route exists. If a full companies list page exists, keep as-is and confirm it renders.
- If it doesn't exist, add a minimal `/dashboard/platform/companies` page: table of companies (name, industry, tier, signup date, status) sourced from `list_companies_admin` RPC, with row click → company detail. Platform-admin only.

## Technical notes

- All copy uses semantic tokens; no hex colors.
- Profile lookup for #4 uses existing `businessTypeProfileMap.ts` — no new schema.
- No DB migrations required.
- Files touched (expected): `PlatformAdminDashboard.tsx`, review settings component, call-routing settings component, `campaignTemplates.ts`, `NotificationBell.tsx`, possibly one new page under `src/pages/admin/`.

## Out of scope

- Layout restructuring.
- Twilio/SignalWire routing logic (handled in prior prompt).
- Any duplicate-data reconciliation beyond the label fix in #1.
