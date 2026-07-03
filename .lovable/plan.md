# Agent Registry Consolidation + CustomerPortal Rename — Review + Plan

Both of Claude's recommendations are correct and address real risks. Verified against the current codebase:

- `AGENT_DEFINITIONS` (AgentDetailPage.tsx line 43), `DEFAULT_AGENTS` (useAIAgentOrchestrator.ts line 95), and `AGENTS` (Automation.tsx line 21) are three independent hand-maintained lists — exactly the drift risk Claude flagged.
- `src/pages/CustomerPortal.tsx` really is the `/appointment?token=…` lookup page and shares a name with `CustomerPortalHome` / `CustomerCompanyPortal` / `CustomerPortalConsole` — meaningful collision.

Recommend implementing both fixes as specified, with a few small refinements below.

---

## FIX 1 — Single agent registry

### New file `src/lib/agentRegistry.ts`

- Defines `AgentRegistryEntry` (icon + config schema) and exports `AGENT_REGISTRY: Record<string, AgentRegistryEntry>`.
- Populated by moving all 24 entries currently living in `AGENT_DEFINITIONS` verbatim (10 operatives + 14 specialists), adding `type` and `isSpecialist` flags.
- Exports `getAgentEntry`, `listCoreAgents`, `listSpecialistAgents`.

### `src/pages/AgentDetailPage.tsx`

- Delete the local `AGENT_DEFINITIONS` block.
- Import from `@/lib/agentRegistry` and replace the lookup:
  ```ts
  const agentDef = agentId ? AGENT_REGISTRY[agentId] : null;
  ```
- Drop the now-unused `lucide-react` icon imports that were only referenced by `AGENT_DEFINITIONS`.

### `src/hooks/useAIAgentOrchestrator.ts`

- Replace hand-written `DEFAULT_AGENTS: AgentInfo[]` with:
  ```ts
  const DEFAULT_AGENTS: AgentInfo[] = Object.values(AGENT_REGISTRY).map(entry => ({
    type: entry.type,
    name: entry.name,
    category: entry.category,
    phase: entry.phase,
    is_enabled: false,
    settings: {},
  }));
  ```
- Will verify `AgentInfo` shape lines up (any extra required fields — e.g. `id` or `capabilities` — get filled from the entry or defaulted the same way today's list does) before flipping the assignment.

### `src/pages/Automation.tsx`

- Replace the local `AGENTS` array with `listCoreAgents().map(...)`.
- **Judgment call kept from prior round**: excluding specialists from Automation matches today's behavior. Specialists draft content on request and don't have autonomy dials, so surfacing them in Automation would be a new UX surface, not a bug fix. Keeping `listCoreAgents()`. If you'd rather they appear too, say so and I'll switch to `Object.values(AGENT_REGISTRY)`.

### Scope guardrails

- Leave `SPECIALIST_LABELS` / `SPECIALIST_DESCRIPTIONS` in `subscriptionAgentConfig.ts` untouched — tier gating and hub filtering read them and unifying is out of scope for this pass.
- No changes to `AIAgentsHub.tsx` — it already reads from the orchestrator hook and will pick up the registry indirectly.

### Risk

Icons: some `AGENT_DEFINITIONS` entries reference icons that aren't currently imported anywhere else. Registry file will own those imports; `AgentDetailPage.tsx` keeps only the icons it uses for chrome (Save, ArrowLeft, etc.). Verified before deleting imports.

---

## FIX 2 — Rename `CustomerPortal.tsx` → `AppointmentLookup.tsx`

Confirmed current state:
- `src/App.tsx` line 72: `import CustomerPortal from "./pages/CustomerPortal";`
- `src/App.tsx` line 309: `<Route path="/appointment" element={<CustomerPortal />} />`
- File exports `default function CustomerPortal()`.

Steps:
1. `mv src/pages/CustomerPortal.tsx src/pages/AppointmentLookup.tsx`.
2. Rename the exported function `CustomerPortal` → `AppointmentLookup`.
3. Update `src/App.tsx` import + JSX usage to `AppointmentLookup`.
4. Grep for any other references to `from ".*CustomerPortal"` (not `CustomerPortalHome`/`Install`/`AppInstall`/`Console`) and update them — a first pass shows only `App.tsx` needs the change, but will re-check post-rename.

No logic changes.

---

## Acceptance

- All 24 agent detail routes still open (registry-sourced).
- Automation page shows the same 10 core operatives as today.
- Editing `agentRegistry.ts` propagates to both AgentDetailPage and Automation without touching either.
- `/appointment?token=…` still loads the lookup page.
- Codebase has no dangling imports of the old `CustomerPortal` default export.

## Open decisions to confirm

1. **Specialists in Automation**: keep excluded (default) or include? Recommend keep excluded.
2. **`SPECIALIST_LABELS/DESCRIPTIONS` unification**: defer to a later pass. OK to defer?
