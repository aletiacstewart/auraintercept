import { useMemo } from 'react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  resolveQuickstart,
  type FeatureKey,
  type IndustryQuickstart,
  type IntegrationKey,
} from '@/lib/industryConfig';

export interface IndustryConfigResult {
  loading: boolean;
  /** Industry label, e.g. "HVAC". */
  label: string;
  industryId: string;
  config: IndustryQuickstart;
  recommendedAgents: string[];
  requiredIntegrations: IntegrationKey[];
  /** Soft check — never hard-gates a paid feature, only tailors emphasis. */
  isFeatureEnabled: (feature: FeatureKey) => boolean;
  isIntegrationRecommended: (integration: IntegrationKey) => boolean;
}

/**
 * Resolves the current company's industry quick-start configuration
 * (recommended agents, connections, feature emphasis, onboarding copy).
 */
export function useIndustryConfig(companyIdOverride?: string | null): IndustryConfigResult {
  const { pack, loading } = useIndustryPack(companyIdOverride);

  return useMemo(() => {
    const config = resolveQuickstart(pack as never);
    const features = new Set(config.features_enabled);
    const integrations = new Set(config.required_integrations);
    return {
      loading,
      label: pack?.label || 'Service Business',
      industryId: pack?.industry_id || 'generic',
      config,
      recommendedAgents: config.recommended_agents,
      requiredIntegrations: config.required_integrations,
      isFeatureEnabled: (feature: FeatureKey) => features.has(feature),
      isIntegrationRecommended: (integration: IntegrationKey) => integrations.has(integration),
    };
  }, [pack, loading]);
}
