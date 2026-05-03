import type {
  CompanyForResolver,
  IndustryBlueprint,
  OperatingModel,
  ResolvedWorkspace,
} from './types';

const TIER_INDUSTRY_CAPACITY: Record<string, number> = {
  core: 1,
  starter: 1,
  boost: 2,
  growth: 2,
  pro: 3,
  professional: 3,
  elite: 99,
  enterprise: 99,
};

const FALLBACK_BLUEPRINT: IndustryBlueprint = {
  slug: 'custom',
  name: 'Custom',
  operating_model: 'custom',
  primary_records: ['records'],
  default_consoles: ['business_mgmt', 'analytics'],
  default_kpis: ['records_today', 'revenue_mtd'],
  agent_actions: {},
  prompt_overrides: {},
  restrictions: {},
};

export function getIndustryCapacityForTier(tier?: string | null): number {
  if (!tier) return 1;
  return TIER_INDUSTRY_CAPACITY[tier.toLowerCase()] ?? 1;
}

export function resolveCompanyWorkspace(
  company: CompanyForResolver | null | undefined,
  blueprint: IndustryBlueprint | null | undefined,
): ResolvedWorkspace {
  const bp = blueprint ?? FALLBACK_BLUEPRINT;
  const overrides = (company?.industry_config ?? {}) as Record<string, unknown>;

  const operatingModel: OperatingModel =
    ((overrides.operating_model as OperatingModel) ||
      (company?.operating_model as OperatingModel) ||
      bp.operating_model ||
      'custom') as OperatingModel;

  return {
    industrySlug: company?.industry_vertical ?? null,
    industryName: bp.name,
    operatingModel,
    primaryRecords: (overrides.primary_records as string[]) ?? bp.primary_records,
    activeConsoles: (overrides.active_consoles as string[]) ?? bp.default_consoles,
    kpis: (overrides.kpis as string[]) ?? bp.default_kpis,
    agentActions: {
      ...(bp.agent_actions ?? {}),
      ...((overrides.agent_actions as Record<string, string[]>) ?? {}),
    },
    promptOverrides: {
      ...(bp.prompt_overrides ?? {}),
      ...((overrides.prompt_overrides as Record<string, unknown>) ?? {}),
    },
    restrictions: {
      ...(bp.restrictions ?? {}),
      ...((overrides.restrictions as Record<string, unknown>) ?? {}),
    },
    industryCapacity: getIndustryCapacityForTier(company?.subscription_tier),
  };
}

export function consoleAllowedByModel(
  consoleKey: string,
  workspace: ResolvedWorkspace,
): boolean {
  return workspace.activeConsoles.includes(consoleKey);
}