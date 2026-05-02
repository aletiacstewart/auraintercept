
## Per-vertical analytics presets (Phase M)
## Phase 4+5: Console widget surfacing & terminology

- **Customer Portal** (`CustomerPortalConsole.tsx`) — picks specialist roster
  per cluster (`PORTAL_SPECIALISTS_BY_CLUSTER`) with industry overrides for
  real_estate, beauty_wellness, restaurants, personal_assistant.
- **Marketing Sales Console** — surfaces a `Marketing Specialists` launcher
  with cluster + industry overrides (e.g. `listing_writer` for real_estate,
  `menu_writer` for restaurants, `style_consultant` for beauty).
- **Quotes page** — surfaces a `Quote Specialists` launcher (site_survey,
  permit_code, insurance_claim for trades; comp_analyst+offer_drafter for
  real_estate). Hidden if no specialists apply.
- **Field Ops Console** — already cluster-aware via `console_visibility`;
  picks specialists from `pack.extra_operatives` first, then mode defaults.
- **Nav labels** (`industryNavLabels.ts`) — extended with `teamMemberNoun`
  and `jobNoun` per cluster + per industry. Drives `TechnicianDashboardLayout`
  sidebar so a salon sees "Stylist View / My Appointments" instead of
  "Technician View / My Jobs".

`src/lib/industryAnalyticsPresets.ts` maps each `industry_id` to a curated
list of `{ source, field, view, label }` shortcuts (HVAC system age, Real
Estate pre-approval funnel, Roofing leak trend, etc.). `IntakeAnalytics.tsx`
renders these as chips at the top of the tab and auto-applies the first
matching preset on mount when no `?field=` is in the URL. Presets whose
`field` isn't present in the active pack's `form_schemas` are filtered out
so the UI never offers a broken shortcut. A universal completeness preset
is appended to every vertical.

## Runtime prompt injection (Phase L)

Voice (`voice-handler` SWML), SMS (`sms-handler`), and chat/booking
(`ai-agent-chat`) edge functions all decorate their base system prompts with
the active company's industry pack via `supabase/functions/_shared/industry-pack.ts`:

- `loadIndustryPackForCompany(supabase, companyId)` → `{ industry_id, label, terminology, agent_prompt_deltas }`
- `applyIndustryPackToPrompt(basePrompt, pack, agentType)` appends an
  `INDUSTRY CONTEXT (<label>):` block (from the matching delta key —
  `voice` / `sms` / `chat` / `booking` / `dispatch` / `billing` / fallback
  `aura`) plus a `PREFERRED TERMINOLOGY` block listing verbatim
  `"<from>" → "<to>"` substitutions.

`ai-agent-chat` already had pack-aware deltas; Phase L added the terminology
block there too. Voice + SMS were not pack-aware before Phase L.

## Embed loader (Phase K)

`public/embed/booking.js` is a vanilla drop-in script:

```html
<div data-aura-booking="<slug>"></div>
<script async src="https://auraintercept.ai/embed/booking.js"></script>
```

It mounts an iframe pointed at `/book/<slug>?embed=1` and listens for
`{ source: 'aura-booking', type: 'resize', height }` postMessages from
`PublicBooking.tsx` to auto-grow. Optional attrs: `data-aura-host`,
`data-aura-min-height`, `data-aura-max-width`, `data-aura-theme`,
`data-aura-primary` (hex → converted to `--primary` HSL token at runtime).
The loader is offered alongside the legacy iframe snippet inside
`SmartWebsiteManager → Booking widget` settings.

## Authoring UI (Phase I)

Platform admins edit packs at `/dashboard/admin/industry-packs` (list) and
`/dashboard/admin/industry-packs/:id` (editor). Gated via
`ProtectedRoute requiredRole="platform_admin"`. Existing RLS already
restricts writes to `has_role(auth.uid(), 'platform_admin')` — no new
migration was needed.

Editor tabs: Meta · Terminology · Job templates · Form schemas (with
live `<DynamicIntakeFields>` preview + `show_if` rule builder) · Prompt
deltas · Extra operatives. Save validates against
`packEditableSchema` (zod, mirrors Phase H types) and on success
invalidates `['industry-pack']` so live company sessions hot-swap on
their next refetch — no app reload required.

Import / Export JSON buttons enable cross-environment pack sync.
