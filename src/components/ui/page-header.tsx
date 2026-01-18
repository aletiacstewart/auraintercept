import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  | 'dashboard'
  | 'platform';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  featureColor?: FeatureColor;
}

const featureColorClasses: Record<FeatureColor, { bg: string; text: string }> = {
  companies: { bg: 'bg-feature-companies/15', text: 'text-feature-companies' },
  employees: { bg: 'bg-feature-employees/15', text: 'text-feature-employees' },
  customers: { bg: 'bg-feature-customers/15', text: 'text-feature-customers' },
  leads: { bg: 'bg-feature-leads/15', text: 'text-feature-leads' },
  appointments: { bg: 'bg-feature-appointments/15', text: 'text-feature-appointments' },
  quotes: { bg: 'bg-feature-quotes/15', text: 'text-feature-quotes' },
  invoices: { bg: 'bg-feature-invoices/15', text: 'text-feature-invoices' },
  inventory: { bg: 'bg-feature-inventory/15', text: 'text-feature-inventory' },
  warranties: { bg: 'bg-feature-warranties/15', text: 'text-feature-warranties' },
  analytics: { bg: 'bg-feature-analytics/15', text: 'text-feature-analytics' },
  marketing: { bg: 'bg-feature-marketing/15', text: 'text-feature-marketing' },
  fieldops: { bg: 'bg-feature-fieldops/15', text: 'text-feature-fieldops' },
  dashboard: { bg: 'bg-feature-dashboard/15', text: 'text-feature-dashboard' },
  platform: { bg: 'bg-feature-platform/15', text: 'text-feature-platform' },
};

export function PageHeader({ 
  icon: Icon, 
  title, 
  description, 
  badge, 
  action,
  className,
  featureColor
}: PageHeaderProps) {
  const colorClasses = featureColor ? featureColorClasses[featureColor] : { bg: 'bg-accent/20', text: 'text-accent' };
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
          <Icon className={cn("h-6 w-6", colorClasses.text)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
