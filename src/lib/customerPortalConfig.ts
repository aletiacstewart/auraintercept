/**
 * Customer Portal Tier Configuration
 * 
 * Maps quick actions and features to subscription tiers.
 * Connect: Basic chat, emergency, hours, services, feedback, call-to-book
 * Performance: All Connect + schedule, quote, track, billing
 * Command: Same as Performance for customer-facing features
 */

import { Calendar, Clock, DollarSign, AlertTriangle, Star, MapPin, Sparkles, Phone, FileText } from 'lucide-react';
import { SubscriptionTier } from '@/lib/subscriptionAgentConfig';

export type { SubscriptionTier };

export interface QuickActionConfig {
  id: string;
  label: string;
  icon: typeof Calendar;
  message: string;
  featureColor?: string;
  variant?: 'default' | 'destructive' | 'outline';
  requiresTier: SubscriptionTier;
  isCallAction?: boolean; // Opens phone dialer instead of sending message
}

// All quick actions with their tier requirements
export const ALL_QUICK_ACTIONS: QuickActionConfig[] = [
  { 
    id: 'schedule', 
    label: 'Appt', 
    icon: Calendar, 
    message: "I'd like to request an appointment", 
    featureColor: 'text-feature-appointments',
    requiresTier: 'performance'
  },
  { 
    id: 'quote', 
    label: 'Quote', 
    icon: DollarSign, 
    message: "I need a quote for your services", 
    featureColor: 'text-feature-quotes',
    requiresTier: 'performance'
  },
  { 
    id: 'track', 
    label: 'Track', 
    icon: MapPin, 
    message: "I want to track my appointment status", 
    featureColor: 'text-feature-fieldops',
    requiresTier: 'performance'
  },
  { 
    id: 'billing', 
    label: 'Billing', 
    icon: FileText, 
    message: "I have a question about my invoice", 
    featureColor: 'text-feature-invoices',
    requiresTier: 'performance'
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: Sparkles, 
    message: "What services do you offer?", 
    featureColor: 'text-feature-customers',
    requiresTier: 'connect'
  },
  { 
    id: 'hours', 
    label: 'Hours', 
    icon: Clock, 
    message: "What are your business hours?", 
    featureColor: 'text-feature-overview',
    requiresTier: 'connect'
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    icon: AlertTriangle, 
    message: "I have an urgent emergency situation", 
    variant: 'destructive',
    requiresTier: 'connect'
  },
  { 
    id: 'feedback', 
    label: 'Feedback', 
    icon: Star, 
    message: "I'd like to leave feedback about my service", 
    featureColor: 'text-feature-customers',
    requiresTier: 'connect'
  },
];

// Call-to-book action for Connect tier (replaces online booking)
export const CALL_TO_BOOK_ACTION: QuickActionConfig = {
  id: 'call_to_book',
  label: 'Call to Book',
  icon: Phone,
  message: '', // No message - opens phone dialer
  featureColor: 'text-feature-appointments',
  requiresTier: 'connect',
  isCallAction: true,
};

// Tier hierarchy for comparison
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  connect: 2,
  performance: 3,
  command: 4,
};

// Tiers that have customer portal access (starter and above)
const PORTAL_ACCESS_TIERS: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];

// Tiers that have online booking (performance and above)
const ONLINE_BOOKING_TIERS: SubscriptionTier[] = ['performance', 'command'];

/**
 * Check if a company's tier includes customer portal access
 */
export function hasPortalAccess(tier: string | null | undefined): boolean {
  return PORTAL_ACCESS_TIERS.includes((tier || 'free') as SubscriptionTier);
}

/**
 * Check if a company's tier includes online booking (vs call-to-book)
 */
export function hasOnlineBooking(tier: string | null | undefined): boolean {
  return ONLINE_BOOKING_TIERS.includes((tier || 'free') as SubscriptionTier);
}

/**
 * Check if a company's tier includes access to a specific feature tier
 */
export function hasTierAccess(companyTier: string | null | undefined, requiredTier: SubscriptionTier): boolean {
  const effectiveTier = (companyTier || 'connect') as SubscriptionTier;
  const companyLevel = TIER_LEVELS[effectiveTier] ?? TIER_LEVELS.connect;
  const requiredLevel = TIER_LEVELS[requiredTier];
  return companyLevel >= requiredLevel;
}

/**
 * Get the effective subscription tier, accounting for trial status
 */
export function getEffectiveTier(
  subscriptionTier: string | null | undefined, 
  inTrial: boolean
): SubscriptionTier {
  if (inTrial) return 'command'; // Trial gets full access
  return (subscriptionTier || 'connect') as SubscriptionTier;
}

/**
 * Filter quick actions based on company subscription tier
 */
export function getQuickActionsForTier(
  tier: SubscriptionTier,
  hasDispatchPhone: boolean = false
): QuickActionConfig[] {
  const actions: QuickActionConfig[] = [];
  
  // For Connect: Add call-to-book if company has a phone
  if (tier === 'connect' && hasDispatchPhone) {
    actions.push(CALL_TO_BOOK_ACTION);
  }
  
  // Add all actions that the tier has access to
  for (const action of ALL_QUICK_ACTIONS) {
    // Skip schedule for connect tier - they get call_to_book instead
    if (tier === 'connect' && action.id === 'schedule') {
      continue;
    }
    
    if (hasTierAccess(tier, action.requiresTier)) {
      actions.push(action);
    }
  }
  
  return actions;
}

/**
 * Navigation tabs configuration based on tier
 */
export interface TabConfig {
  value: string;
  label: string;
  icon: typeof Calendar;
  featureColor?: string;
  requiresTier: SubscriptionTier;
  triggersChat?: boolean; // Tab switches to chat and sends a message
  chatMessage?: string;
}

export const ALL_TABS: TabConfig[] = [
  { value: 'chat', label: 'Chat', icon: Calendar, requiresTier: 'connect' },
  { value: 'schedule', label: 'Appt', icon: Calendar, featureColor: 'text-feature-appointments', requiresTier: 'performance', triggersChat: true, chatMessage: "I'd like to request an appointment" },
  { value: 'quote', label: 'Quote', icon: DollarSign, featureColor: 'text-feature-quotes', requiresTier: 'performance', triggersChat: true, chatMessage: "I need a quote for your services" },
  { value: 'services', label: 'Services', icon: Sparkles, featureColor: 'text-feature-customers', requiresTier: 'connect' },
  { value: 'hours', label: 'Hours', icon: Clock, featureColor: 'text-feature-overview', requiresTier: 'connect' },
];

/**
 * Get visible tabs based on tier
 */
export function getTabsForTier(tier: SubscriptionTier): TabConfig[] {
  return ALL_TABS.filter(tab => hasTierAccess(tier, tab.requiresTier));
}

// Quick action IDs that require performance or higher
export const PERFORMANCE_ONLY_ACTIONS = ['schedule', 'quote', 'track', 'billing'];

// Tab values that require performance or higher  
export const PERFORMANCE_ONLY_TABS = ['schedule', 'quote'];

// Keep legacy exports for backwards compatibility
export const MULTI_TRACK_ONLY_ACTIONS = PERFORMANCE_ONLY_ACTIONS;
export const MULTI_TRACK_ONLY_TABS = PERFORMANCE_ONLY_TABS;
