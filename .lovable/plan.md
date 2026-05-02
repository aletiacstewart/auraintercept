## Problems Found

You are correct on all three counts. Here is what the code/database actually does today:

**1. Field Ops & Dispatch show on booking-only verticals (PA, Beauty, Real Estate, Restaurants).**
`industry_template_packs.console_visibility.field_ops` is already set to `"booking_mode"` for these four industries (verified in DB), and `FieldOpsConsole.tsx` reads it — but **`DashboardLayout.tsx` ignores it**. The "Field Ops" sidebar group is gated only by `requiredTier: 'performance'`, so any Pro/Elite booking-only vertical still sees Technician View + Dispatch View in the sidebar. (Aura Intercept itself is Elite, which is why you see it.)

**2. Social Media console lists every industry in a dropdown.**
`src/components/social/IndustryTemplateSelector.tsx` renders all 18 entries from the static `INDUSTRY_LIST` regardless of which industry the company selected. It should be locked to the active company's industry pack (with a "switch industry" affordance only for platform_admin).

**3. Demo accounts have ZERO AI agents activated.**
DB query confirms: all 18 demo companies have `0` rows in `ai_agent_configs`. The seeder (`seed-demo-accounts-v2`) builds a `TIER_AGENTS[ind.tier]` array on line 433 and uses it to gate sample data, but **never writes those agents to `ai_agent_configs`**. So `personalassistantadmin@demo.com` (Aura Core / starter tier) shows no AI Receptionist, Booking Agent, Follow-Up, etc., even though Core is supposed to ship 8 agents.

---

## Plan

### Step 1 — Activate AI agents on all demo companies
In `supabase/functions/seed-demo-accounts-v2/index.ts`, after the company is created (around line 470, before the data wipe), upsert one `ai_agent_configs` row per agent in `TIER_AGENTS[ind.tier]` with `is_enabled = true`, plus the industry pack's `extra_operatives` (so Personal Assistant gets `task_triager`, `calendar_optimizer`, `review_responder`; Real Estate gets `listing_writer`, `offer_drafter`, `comp_analyst`, etc.).

Tier → agent counts after fix:
- Core (4 demos): 8 agents + extras
- Boost (5 demos): 12 agents + extras
- Pro (4 demos): 16 agents + extras
- Elite (5 demos): 24 agents + extras

Then redeploy the function and run `Seed All Demo Accounts` from `/dashboard/demo-seeder`.

### Step 2 — Hide Field Ops nav for booking-only industries
In `src/components/dashboard/DashboardLayout.tsx`:
- Read `industryPack.console_visibility?.field_ops` (already loaded via `useIndustryPack` on line 272).
- When `mode === 'hidden'` OR `mode === 'booking_mode'`, filter out the `'/dashboard/ai-consoles/field-ops'` and `'/dashboard/dispatch-field-ops'` nav items.
- Also drop the entire "Field Ops" group when both children are filtered out (already handled by the existing `.filter(group => group.items.length > 0)` at line 326).
- Platform admin still sees everything (already covered by `isPlatformAdmin` short-circuit).

This means Aura Intercept (which is on the SaaS Platform / generic pack) keeps Field Ops, but `personalassistantadmin@demo.com`, `realestateadmin@demo.com`, `beautywellnessadmin@demo.com`, `restaurantsadmin@demo.com` will not see Technician View / Dispatch View.

### Step 3 — Lock the Social Media industry templates to the company's pack
In `src/components/social/SocialContentWizard.tsx` (and `IndustryTemplateSelector.tsx`):
- Replace the full `INDUSTRY_LIST` dropdown with the single industry that matches `useIndustryPack().pack.industry_id`.
- Show it as a static badge ("Templates for: Personal Assistant") instead of a multi-choice menu.
- Keep the full list visible only when `userRole === 'platform_admin'` (so platform admins can still preview other verticals).
- If the company's pack has no matching entry in `INDUSTRY_TEMPLATES` (e.g., the generic SaaS Platform fallback), fall back to the closest match by `cluster` and show a small "Generic templates" note.

### Step 4 — Verify with the Personal Assistant demo
After redeploying the seeder and reseeding:
- Sign in as `personalassistantadmin@demo.com` / `aidemo*!`
- Confirm sidebar has NO Field Ops / Dispatch group.
- Confirm `/dashboard/ai-agents` shows the 8 Core agents activated.
- Confirm Social Media console only shows Personal Assistant templates (or generic if not mapped), not the 18-industry list.
- Spot-check Elite (`hvacadmin@demo.com`) shows 24 agents and full Field Ops; spot-check Beauty (`beautywellnessadmin@demo.com`) shows no Field Ops and the chair-grid console.

---

## Files to change

```text
supabase/functions/seed-demo-accounts-v2/index.ts   (insert ai_agent_configs rows)
src/components/dashboard/DashboardLayout.tsx        (filter Field Ops by console_visibility)
src/components/social/IndustryTemplateSelector.tsx  (lock to company industry)
src/components/social/SocialContentWizard.tsx       (pass company industry, hide selector for non-admins)
.lovable/memory/platform-operations/demo-account-registry.md  (note that seeder now activates agents)
```

No DB schema changes — everything uses existing `ai_agent_configs`, `industry_template_packs.console_visibility`, and `useIndustryPack`.

## Out of scope

- Changing the canonical 4-tier names (`starter/connect/performance/command`) — separate cleanup, not needed to fix the symptoms above.
- Per-industry overrides for non-demo customer accounts — they already get the right `console_visibility`; only the sidebar filter and the social selector were ignoring it.