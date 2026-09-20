/**
 * App-side view of the agent catalog.
 *
 * Re-exports the SAME definition file the edge functions use
 * (supabase/functions/_shared/agent-definitions.ts), so aliases, tier gating
 * and capability lists can never drift between the app and the backend.
 * Presentation concerns (icons, colors, config fields) stay in agentRegistry.ts.
 */

import {
  AGENT_DEFINITIONS,
  LEGACY_TIER_MAP,
  TIER_ORDER,
  meetsTier,
  type AgentDefinition,
  type AgentTier,
} from '../../supabase/functions/_shared/agent-definitions';

export { AGENT_DEFINITIONS, LEGACY_TIER_MAP, TIER_ORDER, meetsTier };
export type { AgentDefinition, AgentTier };

/** Canonical agent id for any legacy alias (falls back to the input). */
export function normalizeAgentType(typeOrAlias: string): string {
  if (AGENT_DEFINITIONS.some((d) => d.type === typeOrAlias)) return typeOrAlias;
  const match = AGENT_DEFINITIONS.find((d) => d.aliases.includes(typeOrAlias));
  return match?.type ?? typeOrAlias;
}

/** Definition for a canonical id or legacy alias. */
export function findAgentDefinition(typeOrAlias: string): AgentDefinition | null {
  const canonical = normalizeAgentType(typeOrAlias);
  return AGENT_DEFINITIONS.find((d) => d.type === canonical) ?? null;
}

/** Plain-English capabilities for an agent, for UI and handoff copy. */
export function agentCapabilities(typeOrAlias: string): string[] {
  return findAgentDefinition(typeOrAlias)?.capabilities ?? [];
}

/** Core operatives a plan tier unlocks. */
export function operativesForTier(tier: string): AgentDefinition[] {
  const canonicalTier = LEGACY_TIER_MAP[tier] || tier;
  return AGENT_DEFINITIONS.filter((d) => !d.isSpecialist && meetsTier(canonicalTier, d.minTier));
}

/** The 14 industry specialists. */
export const SPECIALIST_DEFINITIONS = AGENT_DEFINITIONS.filter((d) => d.isSpecialist);
