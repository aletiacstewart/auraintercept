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
} from '@/lib/subscriptionAgentConfig';

// Updated to include all 7 subscription tiers
export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command';

// All features available on Command tier
const ALL_FEATURES = [
  'email_reminders', 'sms_reminders', 'voice_reminders',
  'advanced_dashboard', 'appointments_unlimited', 'advanced_ai',
  'custom_branding', 'widget', 'api_access', 'white_label', 'priority_support'
];

// Feature mapping for all 7 tiers - API Access included in all paid tiers
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['basic_dashboard'],
  express: ['voice_reminders', 'widget', 'smart_links', 'api_access'],  // Removed social_media, marketing_automation, creative_tools
  aura_flow: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'widget', 'calendar_sync', 'social_media', 'creative_tools', 'api_access'],  // Removed marketing_automation, kept social
  halo: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'widget', 'customer_portal', 'social_media', 'marketing_automation', 'creative_tools', 'api_access'],  // Added api_access
  core: ['email_reminders', 'advanced_dashboard', 'widget', 'social_media', 'web_presence', 'marketing_automation', 'creative_tools', 'api_access'],  // Added api_access
  single_point: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'widget', 'customer_portal', 'quotes', 'social_media', 'marketing_automation', 'creative_tools', 'web_presence', 'api_access'],  // Added web_presence, api_access
  multi_track: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'advanced_ai', 'widget', 'field_ops', 'invoices', 'customer_portal', 'social_media', 'marketing_automation', 'creative_tools', 'web_presence', 'api_access'],  // Added web_presence, api_access
  command: ALL_FEATURES,
};

export type Feature = string;

export const useSubscription = () => {
  const { subscribed, subscriptionTier: authTier, subscriptionEnd, inTrial, trialEndsAt, checkSubscription } = useAuth();

  // Normalize tier to our 7-tier system
  const normalizeSubscriptionTier = (tier: string | null): SubscriptionTier => {
    if (!tier) return 'free';
    
    // Map legacy 'enterprise' to 'command' for backwards compatibility
    if (tier === 'enterprise') return 'command';
    
    // Check if it's a valid tier (all 7 tiers)
    if (['free', 'express', 'aura_flow', 'halo', 'core', 'single_point', 'multi_track', 'command'].includes(tier)) {
      return tier as SubscriptionTier;
    }
    
    return 'free';
  };

  const subscriptionTier = normalizeSubscriptionTier(authTier);

  const hasFeature = (feature: Feature): boolean => {
    return TIER_FEATURES[subscriptionTier]?.includes(feature) ?? false;
  };

  const isAtLeastTier = (requiredTier: SubscriptionTier): boolean => {
    return isTierAtLeast(subscriptionTier, requiredTier as ConfigTier);
  };

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // AI Agent access methods
  const canAccessAgent = (agentType: string): boolean => {
    // During trial, grant full access
    if (inTrial) return true;
    
    return tierIncludesAgent(subscriptionTier as ConfigTier, agentType);
  };

  const canAccessConsole = (consoleType: string): boolean => {
    // During trial, grant full access
    if (inTrial) return true;
    
    return tierIncludesConsole(subscriptionTier as ConfigTier, consoleType);
  };

  const getAvailableAgents = (): string[] => {
    // During trial, return all agents from command tier
    if (inTrial) return getAgentsForTier('command');
    
    return getAgentsForTier(subscriptionTier as ConfigTier);
  };

  const getAvailableConsoles = (): string[] => {
    // During trial, return all consoles from command tier
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
    // During trial, grant full access
    if (inTrial) return true;
    
    return tierIncludesFeature(subscriptionTier as ConfigTier, featureField);
  };

  const getFeatureRequiredTier = (featureField: string): SubscriptionTier | null => {
    return getRequiredTierForFeature(featureField) as SubscriptionTier | null;
  };

  // Get all tiers for display
  const getAllTiers = (): { tier: SubscriptionTier; label: string; price: string; description: string }[] => {
    return (['express', 'aura_flow', 'halo', 'core', 'single_point', 'multi_track', 'command'] as SubscriptionTier[]).map(tier => ({
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
    // AI Agent access methods
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
    // Feature area access methods
    canAccessFeatureArea,
    getFeatureRequiredTier,
  };
};
