/**
 * Agent registry and service discovery.
 *
 * Replaces the hardcoded LEGACY_AGENT_MAP / TIER_AGENTS / TOOL_KEY_MAP /
 * SPECIALIST_* tables that used to live inside ai-agent-chat. Every agent
 * lookup — alias normalization, tier gating, prompt selection, tool selection
 * and capability discovery — goes through one registry instance.
 */

import {
  AGENT_DEFINITIONS,
  type AgentDefinition,
  LEGACY_TIER_MAP,
  meetsTier,
} from './agent-definitions.ts';

export type { AgentDefinition };
export { LEGACY_TIER_MAP, meetsTier };

/** Resolvers supplied by the host function (prompt + tool tables). */
export interface AgentRuntime {
  /** Returns the base system prompt for a canonical agent type, if any. */
  getPrompt: (type: string) => string | undefined;
  /** Returns the tool array for a tool key, if any. */
  getTools: (toolKey: string) => unknown[] | undefined;
}

export interface ResolveOptions {
  /** Canonical or legacy subscription tier for the company. */
  tier: string;
  /** Specialists the company's industry pack opts into. */
  packExtraOperatives?: string[];
  /** Per-specialist minimum tier overrides from the industry pack. */
  packMinTiers?: Record<string, string>;
  isPlatformAdmin?: boolean;
  inTrial?: boolean;
}

export type AgentResolution =
  | { allowed: true; agent: BaseAgent }
  | {
      allowed: false;
      agent: BaseAgent | null;
      reason: string;
      requiredTier: string | null;
      currentTier: string;
    };

/**
 * Every agent extends this. `DeclarativeAgent` below covers all 38 agents we
 * ship today; subclass it only when an agent needs behaviour the definition
 * object can't express.
 */
export abstract class BaseAgent {
  readonly type: string;
  readonly name: string;
  readonly category: string;
  readonly aliases: string[];
  readonly isSpecialist: boolean;
  readonly minTier: string;

  constructor(def: AgentDefinition) {
    this.type = def.type;
    this.name = def.name;
    this.category = def.category;
    this.aliases = def.aliases ?? [];
    this.isSpecialist = def.isSpecialist;
    this.minTier = def.minTier;
  }

  /** Base system prompt (before industry deltas are layered on). */
  abstract systemPrompt(): string;
  /** OpenAI-style tool definitions this agent can call. */
  abstract tools(): unknown[];
  /** Plain-English list of what this agent can do. */
  abstract capabilities(): string[];
  /** Lowest plan tier that unlocks this agent. */
  requiredTier(): string {
    return this.minTier;
  }
}

/** Agent whose behaviour comes entirely from its definition + runtime tables. */
export class DeclarativeAgent extends BaseAgent {
  private readonly def: AgentDefinition;
  private readonly runtime: AgentRuntime;

  constructor(def: AgentDefinition, runtime: AgentRuntime) {
    super(def);
    this.def = def;
    this.runtime = runtime;
  }

  systemPrompt(): string {
    return (
      this.runtime.getPrompt(this.type) ||
      this.def.basePrompt ||
      'You are a helpful AI assistant for a service business.'
    );
  }

  tools(): unknown[] {
    return this.runtime.getTools(this.def.toolKey || this.type) ?? [];
  }

  capabilities(): string[] {
    return this.def.capabilities ?? [];
  }
}

export class AgentRegistry {
  private byType = new Map<string, BaseAgent>();
  private byAlias = new Map<string, string>();

  register(agent: BaseAgent): this {
    this.byType.set(agent.type, agent);
    for (const alias of agent.aliases) {
      this.byAlias.set(alias, agent.type);
    }
    return this;
  }

  /** Resolve a canonical id OR a legacy alias to its agent. */
  find(typeOrAlias: string | null | undefined): BaseAgent | null {
    if (!typeOrAlias) return null;
    const direct = this.byType.get(typeOrAlias);
    if (direct) return direct;
    const canonical = this.byAlias.get(typeOrAlias);
    return canonical ? this.byType.get(canonical) ?? null : null;
  }

  /** Canonical agent id for any name (falls back to the input). */
  normalize(typeOrAlias: string): string {
    return this.find(typeOrAlias)?.type ?? typeOrAlias;
  }

  /** Every registered agent, optionally filtered to what a tier unlocks. */
  list(opts?: { tier?: string }): BaseAgent[] {
    const all = [...this.byType.values()];
    if (!opts?.tier) return all;
    const tier = LEGACY_TIER_MAP[opts.tier] || opts.tier;
    return all.filter((a) => !a.isSpecialist && meetsTier(tier, a.requiredTier()));
  }

  capabilitiesOf(typeOrAlias: string): string[] {
    return this.find(typeOrAlias)?.capabilities() ?? [];
  }

  /**
   * Full access decision for one request: alias resolution + tier gating +
   * industry-pack gating for specialists.
   */
  resolve(typeOrAlias: string, opts: ResolveOptions): AgentResolution {
    const tier = LEGACY_TIER_MAP[opts.tier] || opts.tier || 'free';
    const agent = this.find(typeOrAlias);

    if (!agent) {
      return {
        allowed: false,
        agent: null,
        reason: 'is not a known agent',
        requiredTier: null,
        currentTier: tier,
      };
    }

    if (agent.isSpecialist) {
      const optedIn = (opts.packExtraOperatives ?? []).includes(agent.type);
      const minTier = opts.packMinTiers?.[agent.type] || agent.requiredTier() || 'free';
      if (!optedIn && !opts.isPlatformAdmin) {
        return {
          allowed: false,
          agent,
          reason: 'is not enabled for this industry pack',
          requiredTier: null,
          currentTier: tier,
        };
      }
      if (!opts.isPlatformAdmin && !opts.inTrial && !meetsTier(tier, minTier)) {
        return {
          allowed: false,
          agent,
          reason: `requires the ${minTier} subscription tier`,
          requiredTier: minTier,
          currentTier: tier,
        };
      }
      return { allowed: true, agent };
    }

    if (!meetsTier(tier, agent.requiredTier())) {
      return {
        allowed: false,
        agent,
        reason: `requires the ${agent.requiredTier()} subscription tier`,
        requiredTier: agent.requiredTier(),
        currentTier: tier,
      };
    }

    return { allowed: true, agent };
  }
}

/** Build a registry with all 38 shipped agents wired to the host's tables. */
export function createAgentRegistry(runtime: AgentRuntime): AgentRegistry {
  const registry = new AgentRegistry();
  for (const def of AGENT_DEFINITIONS) {
    registry.register(new DeclarativeAgent(def, runtime));
  }
  return registry;
}

/** Registry with no prompt/tool tables — for name resolution only. */
export function createLookupRegistry(): AgentRegistry {
  return createAgentRegistry({ getPrompt: () => undefined, getTools: () => undefined });
}
