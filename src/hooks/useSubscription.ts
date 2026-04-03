import { useAuth } from '@/contexts/AuthContext';
import {
  SubscriptionTier as ConfigTier,
  TIER_AGENT_CONFIG,
  getRequiredTierForAgent,
  getRequiredTierForConsole,
  getRequiredTierForFeature,
  tierIncludesAgent,
  tierIncludesConsole,
  tierIncludesFeature,
  getAgentsForTier,
  getConsolesForTier,
  getAgentDependencies,
  getConsoleRequiredAgents,
  getTierDisplayInfo,
  getUpgradeTierForAgent,
  isTierAtLeast,
  TIER_HIERARCHY,
  TIER_FEATURE_CONFIG,
  normalizeTierName,
} from '@/lib/subscriptionAgentConfig';

// 3-TIER STRUCTURE: Connect, Performance, Command
export type SubscriptionTier = 'free' | 'connect' | 'performance' | 'command';

// All features available on Command tier
const ALL_FEATURES = [
  'email_reminders', 'sms_reminders', 'voice_reminders',
  'advanced_dashboard', 'appointments_unlimited', 'advanced_ai',
  'custom_branding', 'widget', 'api_access', 'white_label', 'priority_support',
  'calendar_sync', 'customer_portal', 'social_media', 'marketing_automation',
  'creative_tools', 'web_presence', 'field_ops', 'quotes', 'invoices', 'analytics',
  'smart_links',
];

// Feature mapping for 3-tier structure
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['basic_dashboard'],
  connect: [
    'voice_reminders', 'email_reminders', 'sms_reminders',
    'advanced_dashboard', 'appointments_unlimited',
    'widget', 'smart_links', 'api_access',
    'calendar_sync', 'customer_portal',
    'social_media', 'marketing_automation', 'creative_tools', 'web_presence',
  ],
  performance: [
    'email_reminders', 'sms_reminders', 'voice_reminders',
    'advanced_dashboard', 'appointments_unlimited',
    'widget', 'customer_portal', 'field_ops',
    'quotes', 'invoices', 'social_media',
    'marketing_automation', 'creative_tools', 'web_presence', 'api_access',
  ],
  command: ALL_FEATURES,
};

export type Feature = string;

export const useSubscription = () => {
  const { subscribed, subscriptionTier: authTier, subscriptionEnd, inTrial, trialEndsAt, checkSubscription } = useAuth();

  // Normalize tier to our 3-tier system (handles all legacy names)
  const normalizeSubscriptionTier = (tier: string | null): SubscriptionTier => {
    if (!tier) return 'free';
    const normalized = normalizeTierName(tier);
    if (['free', 'connect', 'performance', 'command'].includes(normalized)) {
      return normalized as SubscriptionTier;
    }
    return 'free';
  };

  const subscriptionTier = normalizeSubscriptionTier(authTier);

  const hasFeature = (feature: Feature): boolean => {
    return TIER_FEATURES[subscriptionTier]?.includes(feature) ?? false;
  };

  const isAtLeastTier = (requiredTier: SubscriptionTier): boolean => {
    return isTierAtLeast(subscriptionTier as ConfigTier, requiredTier as ConfigTier);
  };

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // AI Agent access methods
  const canAccessAgent = (agentType: string): boolean => {
    if (inTrial) return true;
    return tierIncludesAgent(subscriptionTier as ConfigTier, agentType);
  };

  const canAccessConsole = (consoleType: string): boolean => {
    if (inTrial) return true;
    return tierIncludesConsole(subscriptionTier as ConfigTier, consoleType);
  };

  const getAvailableAgents = (): string[] => {
    if (inTrial) return getAgentsForTier('command');
    return getAgentsForTier(subscriptionTier as ConfigTier);
  };

  const getAvailableConsoles = (): string[] => {
    if (inTrial) return getConsolesForTier('command');
    return getConsolesForTier(subscriptionTier as ConfigTier);
  };

  const getAgentRequiredTier = (agentType: string): SubscriptionTier | null => {
    return getRequiredTierForAgent(agentType) as SubscriptionTier | null;
  };

  const getConsoleRequiredTier = (consoleType: string): SubscriptionTier | null => {
    return getRequiredTierForConsole(consoleType) as SubscriptionTier | null;
  };

  const getAgentDependenciesList = (agentType: string): string[] => {
    return getAgentDependencies(agentType);
  };

  const getConsoleRequiredAgentsList = (consoleType: string): string[] => {
    return getConsoleRequiredAgents(consoleType);
  };

  const getTierInfo = (tier: SubscriptionTier) => {
    return getTierDisplayInfo(tier as ConfigTier);
  };

  const getUpgradeTier = (agentType: string): SubscriptionTier | null => {
    return getUpgradeTierForAgent(subscriptionTier as ConfigTier, agentType) as SubscriptionTier | null;
  };

  // Feature area access methods (for role permissions)
  const canAccessFeatureArea = (featureField: string): boolean => {
    if (inTrial) return true;
    return tierIncludesFeature(subscriptionTier as ConfigTier, featureField);
  };

  const getFeatureRequiredTier = (featureField: string): SubscriptionTier | null => {
    return getRequiredTierForFeature(featureField) as SubscriptionTier | null;
  };

  // Get all tiers for display
  const getAllTiers = (): { tier: SubscriptionTier; label: string; price: string; description: string }[] => {
    return (['connect', 'performance', 'command'] as SubscriptionTier[]).map(tier => ({
      tier,
      ...getTierDisplayInfo(tier as ConfigTier),
    }));
  };

  return {
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    inTrial,
    trialEndsAt,
    trialDaysRemaining,
    hasFeature,
    isAtLeastTier,
    refreshSubscription: checkSubscription,
    canAccessAgent,
    canAccessConsole,
    getAvailableAgents,
    getAvailableConsoles,
    getAgentRequiredTier,
    getConsoleRequiredTier,
    getAgentDependencies: getAgentDependenciesList,
    getConsoleRequiredAgents: getConsoleRequiredAgentsList,
    getTierInfo,
    getUpgradeTier,
    getAllTiers,
    canAccessFeatureArea,
    getFeatureRequiredTier,
  };
};
