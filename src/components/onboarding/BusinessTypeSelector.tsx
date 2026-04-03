import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Wrench, Flame, Zap, HardHat, TreePine, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface BusinessTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  services: string[];
  hours: { weekday: string; weekend: string };
  coreAgents: string[];
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'hvac',
    label: 'HVAC',
    icon: Flame,
    description: 'Heating, ventilation & air conditioning',
    services: ['AC Repair', 'Furnace Install', 'Duct Cleaning', 'Maintenance Plan', 'Emergency Service'],
    hours: { weekday: '7:00-18:00', weekend: 'On-call' },
    coreAgents: ['triage', 'customer_journey', 'dispatch', 'business_finance'],
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: Wrench,
    description: 'Residential & commercial plumbing',
    services: ['Drain Cleaning', 'Water Heater', 'Pipe Repair', 'Fixture Install', 'Emergency Service'],
    hours: { weekday: '7:00-17:00', weekend: 'On-call' },
    coreAgents: ['triage', 'customer_journey', 'dispatch', 'business_finance'],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    icon: Zap,
    description: 'Electrical installation & repair',
    services: ['Panel Upgrade', 'Wiring', 'Outlet Install', 'Lighting', 'Safety Inspection'],
    hours: { weekday: '7:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'customer_journey', 'dispatch', 'business_finance'],
  },
  {
    id: 'general_contractor',
    label: 'General Contractor',
    icon: HardHat,
    description: 'Construction & renovation',
    services: ['Remodeling', 'Additions', 'Roofing', 'Siding', 'Deck Building'],
    hours: { weekday: '7:00-16:00', weekend: 'Closed' },
    coreAgents: ['triage', 'customer_journey', 'business_finance', 'outreach'],
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    icon: TreePine,
    description: 'Lawn care & outdoor services',
    services: ['Lawn Mowing', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Snow Removal'],
    hours: { weekday: '6:00-18:00', weekend: '8:00-14:00' },
    coreAgents: ['triage', 'customer_journey', 'dispatch', 'outreach'],
  },
  {
    id: 'other',
    label: 'Other',
    icon: Building2,
    description: 'Custom business type',
    services: [],
    hours: { weekday: '9:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'customer_journey', 'dispatch', 'business_finance'],
  },
];

interface BusinessTypeSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function BusinessTypeSelector({ selected, onSelect }: BusinessTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {BUSINESS_TEMPLATES.map((tmpl) => {
        const Icon = tmpl.icon;
        const isSelected = selected === tmpl.id;
        return (
          <Card
            key={tmpl.id}
            onClick={() => onSelect(tmpl.id)}
            className={cn(
              'cursor-pointer p-4 transition-all text-center hover:border-primary/50',
              isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/30'
            )}
          >
            <div className={cn(
              'mx-auto mb-2 rounded-full p-3 w-fit',
              isSelected ? 'bg-primary/15' : 'bg-muted'
            )}>
              <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <h3 className="font-medium text-sm text-foreground">{tmpl.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
