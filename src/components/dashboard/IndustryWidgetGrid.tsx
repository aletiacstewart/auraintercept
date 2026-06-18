import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, Wrench, Zap, Settings, Map, Clock, Shield,
  Sun, Bug, Waves, Hammer, Building2, Sparkles, FileText, Activity,
} from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useNavigate } from 'react-router-dom';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';
import { useIndustryWidgetCounts } from '@/hooks/useIndustryWidgetCounts';

// Widget registry: id → { label, icon, description, primary CTA }
// Phase 2 ships full content for trades widgets. Outdoor/Repair/Booking widgets
// render as informational placeholders with a "Coming soon" badge until Phases 3-5.
interface WidgetSpec {
  label: string;
  icon: typeof AlertCircle;
  description: string;
  cta?: { label: string; route: string };
  comingSoon?: boolean;
}

const WIDGET_REGISTRY: Record<string, WidgetSpec> = {
  // Cluster A — Trades (live)
  emergency_queue: { label: 'Emergency Queue', icon: AlertCircle,
    description: 'P0/P1 calls awaiting dispatch.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  emergency_queue_24_7: { label: '24/7 Emergency Queue', icon: AlertCircle,
    description: 'Round-the-clock no-water and burst-pipe calls.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  parts_inventory: { label: 'Parts Inventory', icon: Wrench,
    description: 'Truck stock + warehouse levels.',
    cta: { label: 'Open inventory', route: '/dashboard/inventory' } },
  dispatch_map: { label: 'Dispatch Map', icon: Map,
    description: 'Live tech locations and active jobs.',
    cta: { label: 'Open map', route: '/dashboard/dispatch-field-ops' } },
  tech_utilization: { label: 'Tech Utilization', icon: Activity,
    description: 'Today\'s billable hours per technician.',
    cta: { label: 'View report', route: '/dashboard/analytics' } },
  seasonal_demand_heatmap: { label: 'Seasonal Demand', icon: Sun,
    description: 'AC vs furnace load by week.',
    cta: { label: 'View forecast', route: '/dashboard/analytics' } },
  load_calculator: { label: 'Load Calculator', icon: Zap,
    description: 'Quick service-amperage calc for quotes.',
    cta: { label: 'Open calculator', route: '/dashboard/quotes' } },
  permit_tracker: { label: 'Permit Tracker', icon: FileText,
    description: 'Permits pending, approved, or expiring.',
    cta: { label: 'View permits', route: '/dashboard/ai-agents' } },
  error_code_lookup: { label: 'Error Code Lookup', icon: Settings,
    description: 'Brand-specific appliance error code library.',
    cta: { label: 'Open lookup', route: '/dashboard/knowledge' } },
  water_damage_alerts: { label: 'Water Damage Alerts', icon: AlertCircle,
    description: 'Recent leak and water-damage tickets.',
    cta: { label: 'Open queue', route: '/dashboard/dispatch-field-ops' } },

  // Cluster B — Outdoor & Property (Phase 3, live)
  recurring_route_map: { label: 'Recurring Route Map', icon: Map,
    description: 'Weekly/monthly route clusters for repeat stops.',
    cta: { label: 'Open dispatch map', route: '/dashboard/dispatch-field-ops' } },
  storm_map: { label: 'Storm Tracker', icon: Activity,
    description: 'Recent storm-damage tickets in your service area.',
    cta: { label: 'Open queue', route: '/dashboard/dispatch-field-ops' } },
  insurance_claim_tracker: { label: 'Insurance Claims', icon: FileText,
    description: 'Open and pending insurance claims by job.',
    cta: { label: 'Open jobs', route: '/dashboard/dispatch-field-ops' } },
  site_survey_queue: { label: 'Site Surveys', icon: Map,
    description: 'Pre-install surveys scheduled this week.',
    cta: { label: 'Open quotes', route: '/dashboard/quotes' } },
  production_monitor: { label: 'Solar Production', icon: Sun,
    description: 'kWh produced per installed system.',
    cta: { label: 'View analytics', route: '/dashboard/analytics' } },
  incentive_calculator: { label: 'Incentives', icon: FileText,
    description: 'Local rebates + federal tax credits per job.',
    cta: { label: 'Open quotes', route: '/dashboard/quotes' } },
  seasonal_calendar: { label: 'Seasonal Calendar', icon: Clock,
    description: 'Service windows by season for recurring stops.',
    cta: { label: 'Open calendar', route: '/dashboard/appointments' } },
  crew_scheduler: { label: 'Crew Scheduler', icon: Clock,
    description: 'Multi-tech crew assignments by job.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  equipment_tracker: { label: 'Equipment Status', icon: Wrench,
    description: 'Mowers, trailers, and shared equipment.',
    cta: { label: 'Open inventory', route: '/dashboard/inventory' } },
  weather_alerts: { label: 'Weather Alerts', icon: AlertCircle,
    description: 'Reschedule triggers when weather hits routes.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  material_calculator: { label: 'Material Calculator', icon: Wrench,
    description: 'Linear ft, sq ft, and material takeoffs for quotes.',
    cta: { label: 'Open quotes', route: '/dashboard/quotes' } },
  quote_pipeline: { label: 'Quote Pipeline', icon: FileText,
    description: 'Open quotes by stage (sent, viewed, accepted).',
    cta: { label: 'Open pipeline', route: '/dashboard/quotes' } },
  chemistry_log: { label: 'Pool Chemistry', icon: Waves,
    description: 'pH, chlorine, and alkalinity logged per stop.',
    cta: { label: 'View jobs', route: '/dashboard/dispatch-field-ops' } },
  infestation_map: { label: 'Infestation Map', icon: Bug,
    description: 'Active treatment areas across your routes.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  treatment_log: { label: 'Treatment Log', icon: FileText,
    description: 'Per-customer treatment & chemical history.',
    cta: { label: 'Open customers', route: '/dashboard/customers' } },

  // Cluster C — Repair (Phase 4, live)
  bay_scheduler: { label: 'Bay Scheduler', icon: Building2,
    description: 'Auto-shop bay assignments by appointment.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  vin_lookup: { label: 'VIN Lookup', icon: FileText,
    description: 'Look up vehicle history & specs by VIN.',
    cta: { label: 'Open customers', route: '/dashboard/customers' } },
  service_history: { label: 'Service History', icon: Clock,
    description: 'Per-vehicle service records & next-due intervals.',
    cta: { label: 'Open customers', route: '/dashboard/customers' } },
  task_bundling: { label: 'Task Bundling', icon: Hammer,
    description: 'Combine small tasks into one efficient visit.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },
  multi_phase_tracker: { label: 'Project Phases', icon: Activity,
    description: 'Track multi-phase construction projects.',
    cta: { label: 'Open jobs', route: '/dashboard/dispatch-field-ops' } },
  monitoring_status: { label: 'Monitoring Status', icon: Shield,
    description: 'Active alarm-monitoring sessions & alerts.',
    cta: { label: 'View customers', route: '/dashboard/customers' } },
  installation_queue: { label: 'Install Queue', icon: Wrench,
    description: 'Upcoming security & alarm installs.',
    cta: { label: 'Open dispatch', route: '/dashboard/dispatch-field-ops' } },

  // Cluster D — Booking-First (Phase 5, live)
  receptionist_queue: { label: 'Receptionist Queue', icon: Activity,
    description: 'Calls handled by your AI receptionist today.',
    cta: { label: 'View call history', route: '/dashboard/calls' } },
  smart_link_clicks: { label: 'Smart Link Clicks', icon: Activity,
    description: 'Customers routed to your booking platform.',
    cta: { label: 'Open analytics', route: '/dashboard/analytics' } },
  review_pulse: { label: 'Review Pulse', icon: Sparkles,
    description: 'New reviews captured this week.',
    cta: { label: 'Open reviews', route: '/dashboard/quick-setup?tab=reviews' } },
  hours_status: { label: 'Hours Status', icon: Clock,
    description: 'Open/closed signal feeding the receptionist.',
    cta: { label: 'Edit hours', route: '/dashboard/quick-setup' } },
  missed_calls: { label: 'Missed Calls', icon: AlertCircle,
    description: 'Auto-followup queue for missed calls.',
    cta: { label: 'View call history', route: '/dashboard/calls' } },
  appointment_calendar: { label: 'Appointments', icon: Clock,
    description: 'Today\'s booked appointments.',
    cta: { label: 'Open calendar', route: '/dashboard/appointments' } },
  upsell_tracker: { label: 'Upsell Tracker', icon: Sparkles,
    description: 'Add-on services suggested by Aura.',
    cta: { label: 'View analytics', route: '/dashboard/analytics' } },
  stylist_schedule: { label: 'Stylist Schedule', icon: Clock,
    description: 'Per-stylist booking density today.',
    cta: { label: 'Open employees', route: '/dashboard/employees' } },
  showings_calendar: { label: 'Showings Calendar', icon: Clock,
    description: 'Buyer & seller showings scheduled.',
    cta: { label: 'Open calendar', route: '/dashboard/appointments' } },
  lead_scoring: { label: 'Lead Scoring', icon: Activity,
    description: 'Hot / warm / cold buyer & seller leads.',
    cta: { label: 'View leads', route: '/dashboard/leads' } },
  listing_tracker: { label: 'Listing Tracker', icon: FileText,
    description: 'Active listings + days on market.',
    cta: { label: 'Open customers', route: '/dashboard/customers' } },
  task_queue: { label: 'Task Queue', icon: FileText,
    description: 'Client tasks awaiting action.',
    cta: { label: 'Open jobs', route: '/dashboard/dispatch-field-ops' } },
  client_portal: { label: 'Client Portal', icon: Activity,
    description: 'Active client portal engagements.',
    cta: { label: 'Open customers', route: '/dashboard/customers' } },
  calendar_sync: { label: 'Calendar Sync', icon: Clock,
    description: 'Calendars connected & syncing.',
    cta: { label: 'Manage calendars', route: '/dashboard/integrations/calendar' } },
};

export function IndustryWidgetGrid() {
  const { pack, loading } = useIndustryPack();
  const navigate = useNavigate();
  const widgetIds = pack?.dashboard_widgets ?? [];
  const { counts } = useIndustryWidgetCounts(widgetIds);

  if (loading || !pack || pack.industry_id === 'generic' || !pack.dashboard_widgets?.length) {
    return null;
  }
  const cfg = getIndustryServiceConsoleConfig(pack);
  const rerouteForBooking = (route: string) =>
    cfg.fieldRouting === false && route === '/dashboard/dispatch-field-ops'
      ? cfg.openWorkRoute
      : route;

  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {pack.label} — Industry Widgets
          </CardTitle>
          <Badge variant="outline" className="border-primary/40 text-primary">
            {pack.cluster}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {pack.dashboard_widgets.map((id) => {
            const w = WIDGET_REGISTRY[id];
            if (!w) return null;
            const Icon = w.icon;
            const clickable = !!w.cta;
            const count = counts[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => clickable && navigate(rerouteForBooking(w.cta!.route))}
                disabled={!clickable}
                className={
                  'text-left p-3 rounded-lg border border-border/60 bg-background/60 transition-all ' +
                  (clickable ? 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer' : 'opacity-80 cursor-default')
                }
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {typeof count === 'number' && (
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {count}
                    </span>
                  )}
                  {w.comingSoon && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      soon
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground leading-tight">{w.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{w.description}</div>
                {w.cta && (
                  <div className="text-[11px] text-primary mt-1.5">{w.cta.label} →</div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}