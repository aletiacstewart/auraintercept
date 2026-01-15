import { useAuth } from '@/contexts/AuthContext';
import {
  SubscriptionTier as ConfigTier,
  TIER_AGENT_CONFIG,
  getRequiredTierForAgent,
  getRequiredTierForConsole,
  tierIncludesAgent,
  tierIncludesConsole,
  getAgentsForTier,
  getConsolesForTier,
  getAgentDependencies,
  getConsoleRequiredAgents,
  getTierDisplayInfo,
  getUpgradeTierForAgent,
  isTierAtLeast,
  TIER_HIERARCHY,
} from '@/lib/subscriptionAgentConfig';

export type SubscriptionTier = 'free' | 'single_point' | 'multi_track' | 'command';

// All features available on Command tier
const ALL_FEATURES = [
  'email_reminders', 'sms_reminders', 'voice_reminders',
  'advanced_dashboard', 'appointments_unlimited', 'advanced_ai',
  'custom_branding', 'widget', 'api_access', 'white_label', 'priority_support'
];

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['email_reminders', 'basic_dashboard', 'appointments_10'],
  single_point: ['email_reminders', 'sms_reminders', 'advanced_dashboard', 'appointments_unlimited', 'widget'],
  multi_track: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'advanced_ai', 'widget'],
  command: ALL_FEATURES,
};

export type Feature = string;

export const useSubscription = () => {
  const { subscribed, subscriptionTier: authTier, subscriptionEnd, inTrial, trialEndsAt, checkSubscription } = useAuth();

  // Normalize tier to our new tier system
  const normalizeSubscriptionTier = (tier: string | null): SubscriptionTier => {
    if (!tier) return 'free';
    
    // Map legacy 'enterprise' to 'command' for backwards compatibility
    if (tier === 'enterprise') return 'command';
    
    // Check if it's a valid tier
    if (['free', 'single_point', 'multi_track', 'command'].includes(tier)) {
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

  // Get all tiers for display
  const getAllTiers = (): { tier: SubscriptionTier; label: string; price: string; description: string }[] => {
    return (['single_point', 'multi_track', 'command'] as SubscriptionTier[]).map(tier => ({
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
  };
};
