/**
 * Centralized Feature Color System
 * 
 * This utility provides consistent color definitions for all platform features.
 * Colors are defined as CSS variable references to maintain theme consistency.
 */

export const FEATURE_COLORS = {
  // Core Business Features
  companies: { 
    cssVar: '--feature-companies', 
    text: 'text-feature-companies', 
    bg: 'bg-feature-companies',
    iconClass: 'icon-feature-companies',
    badgeClass: 'badge-feature-companies',
  },
  employees: { 
    cssVar: '--feature-employees', 
    text: 'text-feature-employees', 
    bg: 'bg-feature-employees',
    iconClass: 'icon-feature-employees',
    badgeClass: 'badge-feature-employees',
  },
  customers: { 
    cssVar: '--feature-customers', 
    text: 'text-feature-customers', 
    bg: 'bg-feature-customers',
    iconClass: 'icon-feature-customers',
    badgeClass: 'badge-feature-customers',
  },
  leads: { 
    cssVar: '--feature-leads', 
    text: 'text-feature-leads', 
    bg: 'bg-feature-leads',
    iconClass: 'icon-feature-leads',
    badgeClass: 'badge-feature-leads',
  },
  appointments: { 
    cssVar: '--feature-appointments', 
    text: 'text-feature-appointments', 
    bg: 'bg-feature-appointments',
    iconClass: 'icon-feature-appointments',
    badgeClass: 'badge-feature-appointments',
  },
  quotes: { 
    cssVar: '--feature-quotes', 
    text: 'text-feature-quotes', 
    bg: 'bg-feature-quotes',
    iconClass: 'icon-feature-quotes',
    badgeClass: 'badge-feature-quotes',
  },
  invoices: { 
    cssVar: '--feature-invoices', 
    text: 'text-feature-invoices', 
    bg: 'bg-feature-invoices',
    iconClass: 'icon-feature-invoices',
    badgeClass: 'badge-feature-invoices',
  },
  inventory: { 
    cssVar: '--feature-inventory', 
    text: 'text-feature-inventory', 
    bg: 'bg-feature-inventory',
    iconClass: 'icon-feature-inventory',
    badgeClass: 'badge-feature-inventory',
  },
  warranties: { 
    cssVar: '--feature-warranties', 
    text: 'text-feature-warranties', 
    bg: 'bg-feature-warranties',
    iconClass: 'icon-feature-warranties',
    badgeClass: 'badge-feature-warranties',
  },
  
  // Platform & System Features
  analytics: { 
    cssVar: '--feature-analytics', 
    text: 'text-feature-analytics', 
    bg: 'bg-feature-analytics',
    iconClass: 'icon-feature-analytics',
    badgeClass: 'badge-feature-analytics',
  },
  marketing: { 
    cssVar: '--feature-marketing', 
    text: 'text-feature-marketing', 
    bg: 'bg-feature-marketing',
    iconClass: 'icon-feature-marketing',
    badgeClass: 'badge-feature-marketing',
  },
  fieldops: { 
    cssVar: '--feature-fieldops', 
    text: 'text-feature-fieldops', 
    bg: 'bg-feature-fieldops',
    iconClass: 'icon-feature-fieldops',
    badgeClass: 'badge-feature-fieldops',
  },
  platform: { 
    cssVar: '--feature-platform', 
    text: 'text-feature-platform', 
    bg: 'bg-feature-platform',
    iconClass: 'icon-feature-platform',
    badgeClass: 'badge-feature-platform',
  },
  config: { 
    cssVar: '--feature-config', 
    text: 'text-feature-config', 
    bg: 'bg-feature-config',
    iconClass: 'icon-feature-config',
    badgeClass: 'badge-feature-config',
  },
  overview: { 
    cssVar: '--feature-overview', 
    text: 'text-feature-overview', 
    bg: 'bg-feature-overview',
    iconClass: 'icon-feature-overview',
    badgeClass: 'badge-feature-overview',
  },
  integrations: { 
    cssVar: '--feature-integrations', 
    text: 'text-feature-integrations', 
    bg: 'bg-feature-integrations',
    iconClass: 'icon-feature-integrations',
    badgeClass: 'badge-feature-integrations',
  },
} as const;

export type FeatureColorKey = keyof typeof FEATURE_COLORS;

/**
 * Get feature color configuration by key
 */
export function getFeatureColor(key: FeatureColorKey) {
  return FEATURE_COLORS[key];
}

/**
 * Get inline style for dynamic color application
 * Useful for components that need CSS variable-based colors
 */
export function getFeatureColorStyle(key: FeatureColorKey) {
  const feature = FEATURE_COLORS[key];
  return {
    color: `hsl(var(${feature.cssVar}))`,
    '--feature-color': `var(${feature.cssVar})`,
  } as React.CSSProperties;
}

/**
 * Get background style with opacity for feature colors
 */
export function getFeatureBgStyle(key: FeatureColorKey, opacity: number = 0.15) {
  const feature = FEATURE_COLORS[key];
  return {
    backgroundColor: `hsl(var(${feature.cssVar}) / ${opacity})`,
    color: `hsl(var(${feature.cssVar}))`,
  } as React.CSSProperties;
}

/**
 * Agent Category to Feature Color mapping
 */
export const AGENT_CATEGORY_COLORS: Record<string, FeatureColorKey> = {
  customer_engagement: 'customers',
  field_operations: 'fieldops',
  business_operations: 'analytics',
  marketing_sales: 'marketing',
  analytics_reports: 'overview',
};

/**
 * Get feature color for an agent category
 */
export function getAgentCategoryColor(category: string): FeatureColorKey {
  return AGENT_CATEGORY_COLORS[category] || 'platform';
}
