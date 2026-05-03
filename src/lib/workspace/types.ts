export type OperatingModel =
  | 'field_dispatch'
  | 'appointment_booking'
  | 'pipeline_sales'
  | 'receptionist_only'
  | 'custom';

export interface IndustryBlueprint {
  slug: string;
  name: string;
  operating_model: OperatingModel;
  primary_records: string[];
  default_consoles: string[];
  default_kpis: string[];
  agent_actions: Record<string, string[]>;
  prompt_overrides: Record<string, unknown>;
  restrictions: Record<string, unknown>;
}

export interface ResolvedWorkspace {
  industrySlug: string | null;
  industryName: string;
  operatingModel: OperatingModel;
  primaryRecords: string[];
  activeConsoles: string[];
  kpis: string[];
  agentActions: Record<string, string[]>;
  promptOverrides: Record<string, unknown>;
  restrictions: Record<string, unknown>;
  industryCapacity: number; // how many industries the plan allows
}

export interface CompanyForResolver {
  id: string;
  industry_vertical?: string | null;
  operating_model?: string | null;
  industry_config?: Record<string, unknown> | null;
  secondary_industries?: string[] | null;
  subscription_tier?: string | null;
}