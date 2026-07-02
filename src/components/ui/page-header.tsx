import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceStatusIndicator } from '@/components/voice/VoiceStatusIndicator';
import { InlineAuraBar } from '@/components/aura/InlineAuraBar';

export type FeatureColor = 
  | 'companies' 
  | 'employees' 
  | 'customers' 
  | 'leads' 
  | 'appointments' 
  | 'quotes' 
  | 'invoices' 
  | 'inventory' 
  | 'analytics' 
  | 'marketing' 
  | 'fieldops'
  | 'platform'
  | 'config'
  | 'overview'
  | 'integrations';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  featureColor?: FeatureColor;
  /** Enable pulsing animation on the icon when true */
  pulse?: boolean;
  /** Show inline Ask Aura bar below the header */
  showAuraBar?: boolean;
  /** Optional override for the inline Ask Aura bar placeholder text */
  auraBarPlaceholder?: string;
}

const featureColorClasses: Record<FeatureColor, { bg: string; text: string; ringColor: string }> = {
  companies: { bg: 'bg-feature-companies/20', text: 'text-feature-companies', ringColor: 'var(--feature-companies)' },
  employees: { bg: 'bg-feature-employees/20', text: 'text-feature-employees', ringColor: 'var(--feature-employees)' },
  customers: { bg: 'bg-feature-customers/20', text: 'text-feature-customers', ringColor: 'var(--feature-customers)' },
  leads: { bg: 'bg-feature-leads/20', text: 'text-feature-leads', ringColor: 'var(--feature-leads)' },
  appointments: { bg: 'bg-feature-appointments/20', text: 'text-feature-appointments', ringColor: 'var(--feature-appointments)' },
  quotes: { bg: 'bg-feature-quotes/20', text: 'text-feature-quotes', ringColor: 'var(--feature-quotes)' },
  invoices: { bg: 'bg-feature-invoices/20', text: 'text-feature-invoices', ringColor: 'var(--feature-invoices)' },
  inventory: { bg: 'bg-feature-inventory/20', text: 'text-feature-inventory', ringColor: 'var(--feature-inventory)' },
  analytics: { bg: 'bg-feature-analytics/20', text: 'text-feature-analytics', ringColor: 'var(--feature-analytics)' },
  marketing: { bg: 'bg-feature-marketing/20', text: 'text-feature-marketing', ringColor: 'var(--feature-marketing)' },
  fieldops: { bg: 'bg-feature-fieldops/20', text: 'text-feature-fieldops', ringColor: 'var(--feature-fieldops)' },
  platform: { bg: 'bg-feature-platform/20', text: 'text-feature-platform', ringColor: 'var(--feature-platform)' },
  config: { bg: 'bg-feature-config/20', text: 'text-feature-config', ringColor: 'var(--feature-config)' },
  overview: { bg: 'bg-feature-overview/20', text: 'text-feature-overview', ringColor: 'var(--feature-overview)' },
  integrations: { bg: 'bg-feature-integrations/20', text: 'text-feature-integrations', ringColor: 'var(--feature-integrations)' },
};

export function PageHeader({ 
  icon: Icon, 
  title, 
  description, 
  badge, 
  action,
  className,
  featureColor,
  pulse = true,
  showAuraBar = false,
  auraBarPlaceholder,
}: PageHeaderProps) {
  const colorClasses = featureColor ? featureColorClasses[featureColor] : { bg: 'bg-accent/20', text: 'text-accent', ringColor: 'var(--accent)' };
  
  return (
    <div className={cn("min-w-0 space-y-3 overflow-hidden", className)}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="relative shrink-0">
            {/* Round container with breathing animation + cyber neon ring */}
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all",
              colorClasses.bg,
              pulse && "aura-breathing"
            )} style={{ boxShadow: `0 0 14px hsl(${colorClasses.ringColor}/0.4), 0 0 28px hsl(${colorClasses.ringColor}/0.15)` }}>
              <Icon className={cn("h-4 w-4", colorClasses.text)} />
            </div>
            
            {/* Pulse ring effect when pulsing is enabled */}
            {pulse && (
              <div 
                className="absolute inset-0 rounded-full aura-pulse-ring-feature"
                style={{ '--ring-color': `hsl(${colorClasses.ringColor})` } as React.CSSProperties}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <h1 className={cn("min-w-0 break-words text-lg font-bold leading-tight", colorClasses.text)}>{title}</h1>
              {badge}
              <VoiceStatusIndicator size="sm" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white break-words">{description}</p>
          </div>
        </div>
        {action && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {action}
          </div>
        )}
      </div>
      
      {/* Inline Ask Aura Bar */}
      {showAuraBar && (
        <InlineAuraBar placeholder={auraBarPlaceholder || `Ask about ${title.toLowerCase()}...`} />
      )}
    </div>
  );
}
