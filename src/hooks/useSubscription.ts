import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'free' | 'enterprise';

// All features available on Enterprise tier
const ALL_FEATURES = [
  'email_reminders', 'sms_reminders', 'voice_reminders',
  'advanced_dashboard', 'appointments_unlimited', 'advanced_ai',
  'custom_branding', 'widget', 'api_access', 'white_label', 'priority_support'
];

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['email_reminders', 'basic_dashboard', 'appointments_10'],
  enterprise: ALL_FEATURES,
};

export type Feature = string;

export const useSubscription = () => {
  const { subscribed, subscriptionTier, subscriptionEnd, inTrial, trialEndsAt, checkSubscription } = useAuth();

  const hasFeature = (feature: Feature): boolean => {
    const tier = (subscriptionTier === 'enterprise' ? 'enterprise' : 'free') as SubscriptionTier;
    return TIER_FEATURES[tier]?.includes(feature) ?? false;
  };

  const isAtLeastTier = (requiredTier: SubscriptionTier): boolean => {
    const tierOrder: SubscriptionTier[] = ['free', 'enterprise'];
    const currentTier = (subscriptionTier === 'enterprise' ? 'enterprise' : 'free') as SubscriptionTier;
    const currentTierIndex = tierOrder.indexOf(currentTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    return currentTierIndex >= requiredTierIndex;
  };

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscribed,
    subscriptionTier: (subscriptionTier === 'enterprise' ? 'enterprise' : 'free') as SubscriptionTier,
    subscriptionEnd,
    inTrial,
    trialEndsAt,
    trialDaysRemaining,
    hasFeature,
    isAtLeastTier,
    refreshSubscription: checkSubscription,
  };
};
