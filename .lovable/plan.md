## 1. Duplicate business-type tag (`BusinessTypeContextStrip`)

File: `src/components/marketing/BusinessTypeContextStrip.tsx`

The header renders two badges:
- `displayLabel` (business type name)
- `profileSpec.label` (profile category)

For "Solo / Appointment-Only Services" both resolve to the same string, producing the duplicated pair on Business Management, Service Management, and Customer Portal consoles.

Fix: only render the secondary `profileSpec.label` badge when its normalized value differs from `displayLabel`. Keep both when they carry distinct information (e.g. business type "Plumbing" + profile "Field Dispatch"). No changes to callers.

## 2. Hardcoded "Satisfaction: 98.4%" on Customer Portal Console

Root: Customer Portal is the only console rendered via `AIAgentConsole` (`src/pages/ai-consoles/CustomerPortalConsole.tsx` → `src/components/ai/AIAgentConsole.tsx` lines 723–740), which hardcodes `Status: Live`, `Response: <1s`, `Satisfaction: 98.4%`. The other consoles use `CyberConsoleLayout` with `sessionMetrics` props (see `FieldOpsAgentConsole` lines 927–942 for the "No data yet" pattern).

Fix in `AIAgentConsole.tsx` Session footer:
- Replace hardcoded Satisfaction value with logic mirroring `FieldOpsAgentConsole`: query real feedback for the current company; when `feedbackCount > 0` show `((avgRating/5)*100).toFixed(1)%`, otherwise `No data yet`.
- Apply the same empty-state treatment to `Status` and `Response` if no live session activity exists (fall back to `—` / `No data yet`) so the panel matches the other consoles' honest empty state.
- No visual/style changes beyond swapping the value strings.

Audit note: search the Customer Portal render tree for any other hardcoded numeric stats (e.g. counters in the left agent tiles) and route them through the same real-data / empty-state pattern already used by the shared layout.

## 3. Hero image content clipped (Website → Media)

File: `src/components/smartwebsite/HeroBackgroundUpload.tsx` (preview at lines 184–207) and the public hero render on `src/pages/SmartWebsite.tsx`.

Steps:
1. Load the live published page and confirm the "Customer Portal" caption inside the uploaded hero raster is truly cropped at the bottom (vs. only in the admin thumbnail).
2. If cropped live: on the public hero container, change the background image behavior so the full image is visible on the affected breakpoints — either switch `object-cover` → `object-contain` with a neutral backdrop, or bump min-height and `object-position: center bottom`, plus add bottom padding on any overlay so text can't sit flush against the edge.
3. Mirror the same aspect ratio in the admin preview so what admins see matches what visitors see.
4. If the clipping only exists in the raster itself (caption baked into the image), no CSS change lands — instead surface a small helper note in `HeroBackgroundUpload` reminding admins to leave safe padding around edges (recommended size 1920×822).

## 4. Blog list search + status filter

File: `src/components/blog/BlogManagementTab.tsx` (post list built from the `blog-posts-admin` query around lines 54–65).

Add above the list:
- Search `Input` bound to a `search` state; filters posts client-side by `title`, `slug`, and `excerpt` (case-insensitive).
- Status `Select` / segmented control: `All | Live | Draft`, filtering on `post.published`.
- Show a result count and an empty state when filters exclude everything.

No schema or query changes; filtering runs on the already-fetched array.

## 5. Optional: "Current Plan" badge consistency across Website subpages

Once #1–#4 land, sign in as one account and walk Website → Analytics, Media, Content, Blog. If the plan chip differs across tabs for the same account, trace it to a single subscription hook and normalize; if it only differs between separate demo accounts, no change needed. Report findings without code changes unless a real mismatch is confirmed.

## Out of scope

- No changes to Field Ops, Integrations, Dashboard, or Settings surfaces.
- No new DB tables or migrations.
- No edits to Stripe/subscription plumbing (that was addressed previously).
