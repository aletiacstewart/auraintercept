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
  | 'warranties' 
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
  warranties: { bg: 'bg-feature-warranties/20', text: 'text-feature-warranties', ringColor: 'var(--feature-warranties)' },
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
  showAuraBar = false
}: PageHeaderProps) {
  const colorClasses = featureColor ? featureColorClasses[featureColor] : { bg: 'bg-accent/20', text: 'text-accent', ringColor: 'var(--accent)' };
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {/* Round container with breathing animation */}
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all",
              colorClasses.bg,
              pulse && "aura-breathing"
            )}>
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
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {badge}
              <VoiceStatusIndicator size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      
      {/* Inline Ask Aura Bar */}
      {showAuraBar && (
        <InlineAuraBar placeholder={`Ask about ${title.toLowerCase()}...`} />
      )}
    </div>
  );
}
