## Goal

Make the 4 Specialist Operatives (Diagnostic, Permit & Code, Site Survey & Quote, Insurance Claim) first-class citizens inside the AI Operatives Hub on every dashboard:

1. Render them as their own section ("Specialist Operatives") below Core and Advanced agents.
2. Show all 4, with industry-irrelevant ones clearly visible but locked.
3. On the **platform admin dashboard**, surface every operative as Active so you can see how they behave end-to-end.
4. Keep tier-gating for company users (Pro/Elite required); platform_admin and trial users see them unlocked.

## What changes

### 1. `src/hooks/useAIAgentOrchestrator.ts`
- Add the 4 specialists to `DEFAULT_AGENTS` under a new category `industry_specialist`:
  - `diagnostic`, `permit_code`, `site_survey`, `insurance_claim` (phase 3 each).
- For `platform_admin` callers, after `fetchAgents` merges DB rows, force-set `is_enabled: true` on every agent (in-memory only — doesn't write to the company's DB rows). This guarantees the platform admin's view of the dashboard always shows every operative active without polluting tenant data.

### 2. `src/pages/AIAgentsHub.tsx`
- Add `industry_specialist` to `CATEGORY_INFO` (label "Specialist Operatives", icon `Stethoscope` or `Sparkles`, uses `--feature-analytics` color).
- Pull the company's `extra_operatives` via `useIndustryPack()` to know which specialists the current industry actually wires up.
- New `SPECIALIST_AGENT_TYPES` set: split filtered agents into three buckets — Core, Advanced, **Specialist**.
- Render a third section "Specialist Operatives (Industry-Specific)" with a subtitle: "Auto-activated based on your industry. Requires Aura Pro or Elite."
- Per specialist card lock logic:
  - Locked if `!isAvailableInTier` (tier < performance and not in trial) → existing amber lock UI with "Upgrade to Aura Pro".
  - Locked if `isAvailableInTier` but `!pack.extra_operatives.includes(agent.type)` → new "Not in your industry" lock state (greyed, tooltip lists which industries trigger it).
  - Unlocked otherwise; toggle works normally.
- Add specialists to `AGENT_NAMES` and `AGENT_ROI_HINTS` (short value props).

### 3. `src/lib/subscriptionAgentConfig.ts`
- Add `INDUSTRY_SPECIALIST_OPERATIVES` to the `command` (Elite) tier and to `performance` (Pro) tier inside `TIER_AGENT_CONFIG.agents` so `canAccessAgent` returns true for Pro/Elite without special-casing.
- Add a helper `getSpecialistRequiredTier()` returning `'performance'`.
- Add a `CATEGORY` mapping so `industry_specialist` is recognized as a valid category.

### 4. `src/pages/AIAgentsHub.tsx` — platform admin "all active" treatment
- When `userRole === 'platform_admin'`:
  - Skip the auto-activation effect (the orchestrator hook already returns them as enabled in-memory).
  - In the Quick Stats grid + counts, show `totalCount/totalCount Operatives Active`.
  - Hide tier-locked styling on cards (treat all as available).

### 5. Edge function alignment
- `supabase/functions/ai-agent-chat/index.ts` already references the specialists. Update its `TIER_AGENTS` map to include the 4 specialists in `performance` and `command` so server-side tier checks match the client.

### 6. Industry Widget Grid (already done in prior phase) — no changes needed.

## Out of scope

- No DB migration. We do **not** auto-insert `ai_agent_configs` rows for specialists on every company; they're rendered from `DEFAULT_AGENTS` and stay disabled in DB until a user toggles them on (or industry pack opts them in via existing logic).
- No changes to the pricing comparison table (already updated last turn).
- No changes to the consumer-facing AI Operative Hub layout beyond the new section.

## Visual outcome

```text
AI Operatives Hub
├── Core Agents (Recommended)         [4 cards]
├── Advanced Agents (6) ▸             [6 cards, expandable]
└── Specialist Operatives (4) ▸       [4 cards — NEW]
        Auto-activated by industry. Pro/Elite tier.
        ├── Diagnostic         [Active on platform admin / Locked per industry]
        ├── Permit & Code      [Active / Locked]
        ├── Site Survey & Quote[Active / Locked]
        └── Insurance Claim    [Active / Locked]
```

Platform admin dashboard: all 14 operatives show **Active** with full controls. Company users see the same 14 cards but with proper tier + industry locks.
