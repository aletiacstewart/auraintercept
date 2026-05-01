# Phases J → I — Intake analytics NL queries, then pack authoring UI

Two sequential phases. J ships first (small, immediate win on top of Phase F);
I follows (high leverage — unblocks non-engineer pack editing).

---

## Phase J — Aura NL queries over intake analytics

Extend the existing Aura command parser so admins can ask questions like
"show HVAC system age distribution" or "which intake fields are blank
most often" and land directly on the right card in the Intake analytics tab.

### Behavior

- New intent `intake_analytics` recognized by phrases mentioning
  `intake`, `field`, `distribution`, `completeness`, `blank`, plus any
  pack-defined field label (e.g. "system age", "pre-approval").
- Parser returns a structured payload `{ source, field, view }` where:
  - `source` ∈ `appointments | leads` (defaults to `appointments`).
  - `field` resolved by fuzzy-matching the query against the active
    pack's `getReportableIntakeFields()` labels.
  - `view` ∈ `distribution | trend | completeness`.
- Aura response renderer adds a "Open Intake analytics" CTA that
  navigates to `/dashboard/analytics?tab=intake&source=…&field=…&view=…`.
- `IntakeAnalytics.tsx` (already reads `source` + `field` query params)
  gains support for `view` and auto-scrolls/focuses the matching card.

### Technical details

- `src/lib/auraQueryParser.ts`:
  - Add `'intake_analytics'` to `AuraIntent` union.
  - Add regex patterns + new `extractIntakeTarget(query, pack)` helper
    that imports `getReportableIntakeFields` (no DB call — pack already
    in memo).
  - Extend `ParsedQuery` with optional `intake?: { source, field, view }`.
  - Update `getTabFromIntent` to map → `'intake'`.
- `src/pages/AskAura.tsx`: when intent === `intake_analytics`, render
  the deep-link CTA via `Link` to the analytics route with query string.
- `src/components/aura/AuraResponseRenderer.tsx`: surface the intake
  CTA card when payload.intake is present.
- `src/components/analytics/IntakeAnalytics.tsx`: read `view` param,
  auto-scroll to that card via `ref.current?.scrollIntoView` and apply a
  brief `ring-2 ring-primary/40` highlight.
- `src/pages/Analytics.tsx`: read `tab` query param so deep-link selects
  the Intake tab on mount.

### Files

New: none.

Edited:
- `src/lib/auraQueryParser.ts`
- `src/pages/AskAura.tsx`
- `src/components/aura/AuraResponseRenderer.tsx`
- `src/components/analytics/IntakeAnalytics.tsx`
- `src/pages/Analytics.tsx`
- `.lovable/memory/features/industry/pack-data-fields.md` (new "Aura NL"
  subsection)

### QA

1. Active HVAC pack → "show me hvac system age distribution" routes to
   Intake tab with the bar chart card focused on `system_age`.
2. "which intake fields are blank most often" → Completeness card
   focused, sorted by lowest fill %.
3. Generic / no pack → fallback to `general` intent (no broken link).
4. Source disambiguation: "lead intake completeness" → `source=leads`.

---

## Phase I — Industry pack authoring UI (platform admin)

Replace SQL-only pack editing with an admin screen that lets a platform
admin manage `industry_template_packs` rows in-place: terminology,
job templates, form schemas (including the Phase H `show_if` / `pattern`
/ `step` extensions), and prompt deltas.

### Behavior

- New page `/dashboard/admin/industry-packs` (gated to `platform_admin`
  via existing `RequireRole` guard — same pattern as `/audit` exclusion
  in `power-user-pages-restricted-v1` memory).
- List view: table of all packs (id, vertical key, label, # templates,
  # schemas, # extra operatives, last updated). Search + filter by
  cluster.
- Editor (drawer or `/admin/industry-packs/:id` route):
  - **Terminology** tab — key/value editor (e.g. `service → "tune-up"`).
  - **Job templates** tab — repeatable rows: id, label, form_id select,
    duration_minutes.
  - **Form schemas** tab — accordion per form_id; each accordion exposes:
    - Steps editor (id + label + description).
    - Field repeater with: name, label, type select, required, options
      (chips, for select), placeholder, helper, step select, pattern,
      patternMessage, min, max, and a `show_if` rule builder
      (field/op/value selector that auto-populates from existing field
      names in the same schema).
    - Live preview pane that mounts `<DynamicIntakeFields>` against the
      in-memory schema with sample data so the admin sees branching
      and validation working.
  - **Prompt deltas** tab — JSON-aware textarea for `prompt_deltas` and
    `kb_seed` keyed by agent id, with schema hint chips.
  - **Extra operatives** tab — multi-select against the canonical
    operative list from `subscriptionAgentConfig`.
- Save action validates the JSON against a zod schema (re-using the
  Phase H typings) and writes the row via `supabase.from('industry_template_packs').update`.
- "Duplicate pack" + "Export JSON" + "Import JSON" buttons for
  cross-environment reuse.

### Technical details

- Routing: add to `src/App.tsx` inside the `RequireRole roles={['platform_admin']}` block.
- Data layer: new hook `src/hooks/useIndustryPackAdmin.ts`
  - `useAllPacks()` — list query.
  - `usePack(id)` — single pack with stale-time 0 (always fresh in editor).
  - `useUpdatePack()` — optimistic mutation with toast + invalidates
    the `useIndustryPack` cache for any company using that pack so the
    rest of the app picks up changes without refresh.
- Validation: `src/lib/industryPackSchema.ts` — zod schemas mirroring
  `IntakeFormSchema`, `IntakeFieldDef`, `JobTemplate`, terminology map.
  Reuses the Phase H union types as the source of truth.
- Editor components (all in `src/components/admin/industry-packs/`):
  - `PackList.tsx`
  - `PackEditor.tsx` (tabbed shell)
  - `TerminologyEditor.tsx`
  - `JobTemplatesEditor.tsx`
  - `FormSchemasEditor.tsx`
  - `FieldRow.tsx` (single field editor row)
  - `ShowIfRuleBuilder.tsx`
  - `PromptDeltasEditor.tsx`
  - `ExtraOperativesPicker.tsx`
  - `LivePreview.tsx` (mounts `<DynamicIntakeFields>`)
- DB: no schema migration needed — table already exists. Add an
  `updated_by uuid` column + trigger for audit only if cheap; otherwise
  skip and rely on `updated_at`.
- RLS: tighten with a migration that ensures only `has_role(auth.uid(),
  'platform_admin')` can `UPDATE`/`INSERT`/`DELETE` on
  `industry_template_packs`. Public/company-scoped `SELECT` stays as-is
  via existing read policy.
- Memory:
  - Update `mem://architecture/industry-template-pack-system` with the
    authoring-UI route and the rule that pack edits hot-swap into
    company sessions on next `useIndustryPack` refetch.
  - Cross-link from `mem://features/dashboard/power-user-pages-restricted-v1`.

### Files

New:
- `src/hooks/useIndustryPackAdmin.ts`
- `src/lib/industryPackSchema.ts`
- `src/pages/admin/IndustryPacksAdmin.tsx`
- `src/components/admin/industry-packs/*` (9 components above)
- `supabase/migrations/<ts>_industry_pack_admin_rls.sql`

Edited:
- `src/App.tsx` (route + guard)
- `.lovable/memory/architecture/industry-template-pack-system.md`
- `.lovable/memory/features/dashboard/power-user-pages-restricted-v1.md`
- `.lovable/plan.md`

### QA

1. As `platform_admin`: open editor for HVAC pack → add a `show_if`
   rule on a furnace-only field → live preview hides/shows correctly.
2. Save → switch demo HVAC company, open booking form → branching
   field appears with the new rule (no app reload required after
   `queryClient.invalidateQueries(['industry-pack'])`).
3. As `company_admin`: route is 403/redirected.
4. Import a pack JSON exported from another env → validates via zod →
   saved.
5. RLS: company_admin attempts `UPDATE` via REST → denied.
6. Bad regex in `pattern` field → zod rejects with inline error before
   save.

---

## Sequencing & rollout

- Phase J ships first (single-day scope, no migration, no auth changes).
- Phase I follows once J is verified — bigger surface area, includes a
  migration for tightened RLS and ~10 new components.
- After both: only outstanding industry-pack initiative items will be
  K (JS embed loader), L (pack-driven agent prompts), M (per-vertical
  analytics presets).

---

# Phase J — Aura NL queries over intake analytics (DONE)

- `auraQueryParser`: new `intake_analytics` intent, `extractIntakeTarget`,
  `buildIntakeAnalyticsHref`. `parseAuraQuery(query, pack?)` is now
  pack-aware — pack field labels promote queries.
- `Analytics.tsx` reads `?tab=` for deep-link tab selection.
- `IntakeAnalytics.tsx` reads `?view=` and auto-scrolls + ring-highlights
  the matching card (Distribution / Trend / Completeness).
- `AskAura.tsx` + `AuraResponseRenderer.tsx` show an "Open in Intake
  analytics" CTA when the query parses to an intake target.

# Phase I — Industry pack authoring UI (DONE)

- `src/lib/industryPackSchema.ts` — zod schemas mirroring Phase H types
  (`packEditableSchema`, `intakeFieldDefSchema` with regex/min/max/
  show_if validation).
- `src/pages/admin/IndustryPacksAdmin.tsx` — single-file admin page with
  list view + tabbed editor (Meta / Terminology / Job templates /
  Form schemas / Prompt deltas / Extra operatives). Form schemas tab
  includes a live `<DynamicIntakeFields>` preview and a `show_if` rule
  builder. Save validates via zod; on success invalidates
  `['industry-pack']` so live company sessions hot-swap.
- Routes mounted at `/dashboard/admin/industry-packs` and
  `/dashboard/admin/industry-packs/:id`, both gated to `platform_admin`.
- No migration needed — existing RLS already restricts writes to
  platform admins.
- Import / Export JSON buttons for cross-env pack sync.

Remaining proposed phases: K (JS embed loader), L (pack-driven agent
prompts), M (per-vertical analytics presets).
