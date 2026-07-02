## 3rd Party Integrations — Fixes

### 1. Remove Carrier Cheat Sheet from Voice Agent page

**File:** `src/pages/integrations/VoiceIntegration.tsx`
- Remove the `CarrierForwardingGuide` import (line 10) and its usage (~line 163). Voice/ElevenLabs handles TTS, not call routing.
- **Keep** the guide on `SMSIntegration.tsx` (Phone & SMS / SignalWire — correct home).
- **Keep** on `Integrations.tsx` (3rd Party Overview) since it functions as a consolidated summary hub.

### 2. Fix broken company-wide Calendar cards (CalDAV + ICS)

Both `type="company"` variants currently render the fully-styled card (title, "Free" badge, feature tags) and then show a "not available. Please contact support." message when the backend feature isn't wired up.

**Files:**
- `src/components/integrations/CalendarSubscription.tsx` (~line 196–199)
- `src/components/integrations/CalDAVSubscription.tsx` (~line 192)

**Fix:** When `type === "company"` and no usable URL/config is available, render a "Coming Soon" state instead of the current fallback:
- Replace the "Free" badge with a muted "Coming Soon" badge.
- Apply `opacity-60` to the card body and drop the action buttons.
- Remove the "not available, please contact support" line entirely.
- Individual-user variants (`type !== "company"`) render unchanged.

### 3. Standardize sidebar across all Integration pages

All integration pages already import `DashboardLayout` (verified in `VoiceIntegration`, `EmailIntegration`, `SMSIntegration`, `TavilyIntegration`, `CalendarIntegration`, `CRMIntegration`, `SocialMediaIntegration`, and `Integrations.tsx` at `/dashboard/3rd-party-overview`), so the sidebar component is shared.

**Fix:** Audit `DashboardLayout` / `AppSidebar` for any conditional that hides the `MARKETING`, `CONFIGURATION`, or `INTEGRATIONS` section headers based on route, role, or feature flag. Ensure the section headers always render for `platform_admin` / `company_admin` regardless of current path. If the sections are only hidden because their child groups collapse to empty, force the header labels to remain visible with their canonical child links so a user landing on any integration subpage sees the same navigation structure.

### 4. Follow-up check on Platform Dashboard "Active Integrations: 1 configured"

After the above lands, verify the count on `PlatformAdminDashboard.tsx` maps to an actual configured integration (not a stale placeholder). If every integration on the Overview shows "Not configured" / 0%, the count should read `0`. Adjust the query so it counts only integrations with a truthy config record.

### Out of scope
- No changes to Settings hub or Platform Dashboard fixes from the prior pass beyond the count correction in (4).
- No layout restructuring, no changes to individual-user calendar sync flows.
- No DB migrations.
