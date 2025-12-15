import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['email_reminders', 'basic_dashboard', 'appointments_10'],
  basic: ['email_reminders', 'sms_reminders', 'basic_dashboard', 'appointments_100', 'basic_ai'],
  pro: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_500', 'advanced_ai', 'custom_branding', 'widget'],
  enterprise: ['email_reminders', 'sms_reminders', 'voice_reminders', 'advanced_dashboard', 'appointments_unlimited', 'advanced_ai', 'custom_branding', 'widget', 'api_access', 'white_label', 'priority_support'],
};

export type Feature = string;

export const useSubscription = () => {
  const { subscribed, subscriptionTier, subscriptionEnd, checkSubscription } = useAuth();

  const hasFeature = (feature: Feature): boolean => {
    const tier = subscriptionTier || 'free';
    return TIER_FEATURES[tier]?.includes(feature) ?? false;
  };

  const isAtLeastTier = (requiredTier: SubscriptionTier): boolean => {
    const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(subscriptionTier || 'free');
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    return currentTierIndex >= requiredTierIndex;
  };

  return {
    subscribed,
    subscriptionTier: subscriptionTier || 'free',
    subscriptionEnd,
    hasFeature,
    isAtLeastTier,
    refreshSubscription: checkSubscription,
  };
};
