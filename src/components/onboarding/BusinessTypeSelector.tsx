import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Wrench, Flame, Zap, HardHat, TreePine, Building2,
  Settings, Sun, Home, Fence, Waves, Bug,
  Car, Hammer, Shield, UtensilsCrossed, Sparkles, Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface BusinessTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  services: string[];
  hours: { weekday: string; weekend: string };
  coreAgents: string[];
  cluster: 'trades' | 'outdoor' | 'repair' | 'booking' | 'other';
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  // Cluster A — Core Trades
  { id: 'hvac', label: 'HVAC', icon: Flame, description: 'Heating, ventilation & A/C',
    services: ['AC Repair', 'Furnace Install', 'Duct Cleaning', 'Maintenance Plan', 'Emergency Service'],
    hours: { weekday: '7:00-18:00', weekend: 'On-call' },
    coreAgents: ['triage', 'booking', 'dispatch', 'route'], cluster: 'trades' },
  { id: 'plumbing', label: 'Plumbing', icon: Wrench, description: 'Residential & commercial plumbing',
    services: ['Drain Cleaning', 'Water Heater', 'Pipe Repair', 'Fixture Install', '24/7 Emergency'],
    hours: { weekday: '7:00-17:00', weekend: 'On-call' },
    coreAgents: ['triage', 'booking', 'dispatch', 'route'], cluster: 'trades' },
  { id: 'electrical', label: 'Electrical', icon: Zap, description: 'Electrical install & repair',
    services: ['Panel Upgrade', 'Wiring', 'Outlet Install', 'Lighting', 'Safety Inspection'],
    hours: { weekday: '7:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'dispatch', 'route'], cluster: 'trades' },
  { id: 'appliance_repair', label: 'Appliance Repair', icon: Settings, description: 'Appliance repair & install',
    services: ['Refrigerator', 'Washer/Dryer', 'Dishwasher', 'Oven/Range', 'Diagnostic'],
    hours: { weekday: '8:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'dispatch'], cluster: 'trades' },

  // Cluster B — Outdoor & Property
  { id: 'solar', label: 'Solar', icon: Sun, description: 'Solar install & service',
    services: ['Site Survey', 'System Design', 'Install', 'Monitoring', 'Service'],
    hours: { weekday: '8:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'outdoor' },
  { id: 'roofing', label: 'Roofing', icon: Home, description: 'Roof install & repair',
    services: ['Inspection', 'Repair', 'Re-Roof', 'Storm Damage', 'Insurance Claims'],
    hours: { weekday: '7:00-17:00', weekend: 'Storm response' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'outdoor' },
  { id: 'landscape', label: 'Landscape & Trees', icon: TreePine, description: 'Lawn care & outdoor services',
    services: ['Mowing', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Snow Removal'],
    hours: { weekday: '6:00-18:00', weekend: '8:00-14:00' },
    coreAgents: ['triage', 'booking', 'route'], cluster: 'outdoor' },
  { id: 'fencing', label: 'Fencing & Decking', icon: Fence, description: 'Fence & deck install',
    services: ['Site Survey', 'Wood Fence', 'Vinyl Fence', 'Deck Build', 'Repair'],
    hours: { weekday: '7:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'outdoor' },
  { id: 'pool_spa', label: 'Pool & Spa', icon: Waves, description: 'Pool & spa service',
    services: ['Weekly Service', 'Chemistry', 'Equipment Repair', 'Opening', 'Closing'],
    hours: { weekday: '7:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'route'], cluster: 'outdoor' },
  { id: 'pest_control', label: 'Pest Control', icon: Bug, description: 'Pest control & extermination',
    services: ['Inspection', 'Monthly Treatment', 'Quarterly Treatment', 'Termite', 'Rodent'],
    hours: { weekday: '7:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'route'], cluster: 'outdoor' },

  // Cluster C — Repair & Service
  { id: 'auto_care', label: 'Auto Care', icon: Car, description: 'Auto repair & maintenance',
    services: ['Oil Change', 'Brakes', 'Diagnostic', 'Alignment', 'Tires'],
    hours: { weekday: '8:00-18:00', weekend: '8:00-14:00' },
    coreAgents: ['triage', 'booking'], cluster: 'repair' },
  { id: 'handyman', label: 'Handyman & Cleaning', icon: Hammer, description: 'Handyman & home services',
    services: ['Minor Repairs', 'TV Mounting', 'Painting', 'Cleaning', 'Bundled Tasks'],
    hours: { weekday: '8:00-17:00', weekend: '9:00-15:00' },
    coreAgents: ['triage', 'booking', 'dispatch'], cluster: 'repair' },
  { id: 'construction', label: 'Construction', icon: HardHat, description: 'Painting, flooring, tile, trim',
    services: ['Estimate', 'Painting', 'Flooring', 'Tile', 'Trim Carpentry'],
    hours: { weekday: '7:00-16:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'repair' },
  { id: 'security_systems', label: 'Security Systems', icon: Shield, description: 'Security & monitoring',
    services: ['Site Survey', 'Camera Install', 'Alarm Install', 'Monitoring', 'Service'],
    hours: { weekday: '8:00-17:00', weekend: '24/7 Monitoring' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'repair' },

  // Cluster D — Booking-First
  { id: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed, description: 'Restaurants & food service',
    services: ['Hours & Menu Info', 'Reservations via Smart Link', 'Catering Inquiries'],
    hours: { weekday: '11:00-22:00', weekend: '10:00-23:00' },
    coreAgents: ['triage', 'review'], cluster: 'booking' },
  { id: 'beauty_wellness', label: 'Beauty & Wellness', icon: Sparkles, description: 'Salons, spas & wellness',
    services: ['Hair', 'Color', 'Nails', 'Spa', 'Wellness'],
    hours: { weekday: '9:00-19:00', weekend: '9:00-17:00' },
    coreAgents: ['triage', 'booking', 'review'], cluster: 'booking' },
  { id: 'real_estate', label: 'Real Estate', icon: Building2, description: 'Real estate agencies',
    services: ['Buyer Inquiries', 'Seller Inquiries', 'Showings', 'Listing Info'],
    hours: { weekday: '9:00-19:00', weekend: '10:00-17:00' },
    coreAgents: ['triage', 'booking', 'lead'], cluster: 'booking' },
  { id: 'personal_assistant', label: 'Personal Assistant', icon: Briefcase, description: 'Personal & exec assistant',
    services: ['Task Intake', 'Calendar Mgmt', 'Errands', 'Coordination'],
    hours: { weekday: '8:00-18:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking'], cluster: 'booking' },

  // Catch-all
  { id: 'other', label: 'Other', icon: Building2, description: 'Custom business type',
    services: [], hours: { weekday: '9:00-17:00', weekend: 'Closed' },
    coreAgents: ['triage', 'booking'], cluster: 'other' },
];

const CLUSTER_LABELS: Record<string, string> = {
  trades: 'Core Trades',
  outdoor: 'Outdoor & Property',
  repair: 'Repair & Service',
  booking: 'Booking-First',
  other: 'Other',
};

interface BusinessTypeSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function BusinessTypeSelector({ selected, onSelect }: BusinessTypeSelectorProps) {
  const clusters: Array<BusinessTemplate['cluster']> = [
    'trades', 'outdoor', 'repair', 'booking', 'other',
  ];
  return (
    <div className="space-y-5">
      {clusters.map((cluster) => {
        const items = BUSINESS_TEMPLATES.filter((t) => t.cluster === cluster);
        if (!items.length) return null;
        return (
          <div key={cluster} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CLUSTER_LABELS[cluster]}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selected === tmpl.id;
                return (
                  <Card
                    key={tmpl.id}
                    onClick={() => onSelect(tmpl.id)}
                    className={cn(
                      'cursor-pointer p-3 transition-all text-center hover:border-primary/50',
                      isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    )}
                  >
                    <div className={cn(
                      'mx-auto mb-1.5 rounded-full p-2.5 w-fit',
                      isSelected ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <h3 className="font-medium text-sm text-foreground leading-tight">{tmpl.label}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tmpl.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
