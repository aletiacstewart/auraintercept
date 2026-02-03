/**
 * Customer Portal Tier Configuration
 * 
 * Maps quick actions and features to subscription tiers.
 * Express/Core: No customer portal access (redirects to chat only)
 * Aura Flow: No customer portal (scheduling via calendar sync)
 * Halo: Customer portal with scheduling for salons/wellness
 * Single-Point: Basic chat, emergency, hours, services, feedback, call-to-book
 * Multi-Track: All Single-Point + schedule, quote, track, billing
 * Command: Same as Multi-Track for customer-facing features
 */

import { Calendar, Clock, DollarSign, AlertTriangle, Star, MapPin, Sparkles, Phone, FileText } from 'lucide-react';

export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command';

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
    requiresTier: 'multi_track'
  },
  { 
    id: 'quote', 
    label: 'Quote', 
    icon: DollarSign, 
    message: "I need a quote for your services", 
    featureColor: 'text-feature-quotes',
    requiresTier: 'multi_track'
  },
  { 
    id: 'track', 
    label: 'Track', 
    icon: MapPin, 
    message: "I want to track my appointment status", 
    featureColor: 'text-feature-fieldops',
    requiresTier: 'multi_track'
  },
  { 
    id: 'billing', 
    label: 'Billing', 
    icon: FileText, 
    message: "I have a question about my invoice", 
    featureColor: 'text-feature-invoices',
    requiresTier: 'multi_track'
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: Sparkles, 
    message: "What services do you offer?", 
    featureColor: 'text-feature-customers',
    requiresTier: 'single_point'
  },
  { 
    id: 'hours', 
    label: 'Hours', 
    icon: Clock, 
    message: "What are your business hours?", 
    featureColor: 'text-feature-overview',
    requiresTier: 'single_point'
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    icon: AlertTriangle, 
    message: "I have an urgent emergency situation", 
    variant: 'destructive',
    requiresTier: 'single_point'
  },
  { 
    id: 'feedback', 
    label: 'Feedback', 
    icon: Star, 
    message: "I'd like to leave feedback about my service", 
    featureColor: 'text-feature-customers',
    requiresTier: 'single_point'
  },
];

// Call-to-book action for Single-Point tier (replaces online booking)
export const CALL_TO_BOOK_ACTION: QuickActionConfig = {
  id: 'call_to_book',
  label: 'Call to Book',
  icon: Phone,
  message: '', // No message - opens phone dialer
  featureColor: 'text-feature-appointments',
  requiresTier: 'single_point',
  isCallAction: true,
};

// Tier hierarchy for comparison - lower tiers with portal access mapped appropriately
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  express: 0, // No customer portal
  aura_flow: 0, // No customer portal (direct calendar)
  core: 1, // Basic chat only
  halo: 2, // Has customer portal with scheduling
  single_point: 2,
  multi_track: 3,
  command: 4,
};

// Tiers that have customer portal access
const PORTAL_ACCESS_TIERS: SubscriptionTier[] = ['halo', 'single_point', 'multi_track', 'command'];

// Tiers that have online booking (not call-to-book)
const ONLINE_BOOKING_TIERS: SubscriptionTier[] = ['halo', 'multi_track', 'command'];

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
  const effectiveTier = (companyTier || 'core') as SubscriptionTier;
  const companyLevel = TIER_LEVELS[effectiveTier] || TIER_LEVELS.core;
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
  return (subscriptionTier || 'core') as SubscriptionTier;
}

/**
 * Filter quick actions based on company subscription tier
 */
export function getQuickActionsForTier(
  tier: SubscriptionTier,
  hasDispatchPhone: boolean = false
): QuickActionConfig[] {
  const actions: QuickActionConfig[] = [];
  
  // For Core and Single-Point: Add call-to-book if company has a phone
  if ((tier === 'core' || tier === 'single_point') && hasDispatchPhone) {
    actions.push(CALL_TO_BOOK_ACTION);
  }
  
  // Add all actions that the tier has access to
  for (const action of ALL_QUICK_ACTIONS) {
    // Skip schedule for core and single_point - they get call_to_book instead
    if ((tier === 'core' || tier === 'single_point') && action.id === 'schedule') {
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
  { value: 'chat', label: 'Chat', icon: Calendar, requiresTier: 'single_point' },
  { value: 'schedule', label: 'Appt', icon: Calendar, featureColor: 'text-feature-appointments', requiresTier: 'multi_track', triggersChat: true, chatMessage: "I'd like to request an appointment" },
  { value: 'quote', label: 'Quote', icon: DollarSign, featureColor: 'text-feature-quotes', requiresTier: 'multi_track', triggersChat: true, chatMessage: "I need a quote for your services" },
  { value: 'services', label: 'Services', icon: Sparkles, featureColor: 'text-feature-customers', requiresTier: 'single_point' },
  { value: 'hours', label: 'Hours', icon: Clock, featureColor: 'text-feature-overview', requiresTier: 'single_point' },
];

/**
 * Get visible tabs based on tier
 */
export function getTabsForTier(tier: SubscriptionTier): TabConfig[] {
  return ALL_TABS.filter(tab => hasTierAccess(tier, tab.requiresTier));
}

// Quick action IDs that require multi_track or higher
export const MULTI_TRACK_ONLY_ACTIONS = ['schedule', 'quote', 'track', 'billing'];

// Tab values that require multi_track or higher  
export const MULTI_TRACK_ONLY_TABS = ['schedule', 'quote'];
