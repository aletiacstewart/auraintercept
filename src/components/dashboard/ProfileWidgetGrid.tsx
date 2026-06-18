import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, Activity, Clock, FileText, Map, MapPin, MessageSquare,
  Package, PhoneCall, PhoneMissed, RefreshCcw, Repeat, Star, Truck,
  Users, Wallet, Wrench, Sparkles, Image as ImageIcon, ShieldAlert,
  CalendarDays, CalendarRange, ClipboardList, Receipt, Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

/**
 * Profile-driven dashboard widgets.
 *
 * Reads `PROFILE_SPECS[key].dashboardWidgets` (canonical ids from the
 * 10-profile spec) and renders ordered tiles linking into the right
 * console. Replaces the legacy per-industry `IndustryWidgetGrid` for
 * profile-aware tenants while staying side-by-side until that grid is
 * fully retired.
 */

interface WidgetSpec {
  label: string;
  icon: typeof AlertCircle;
  description: string;
  route: string;
}

const W: Record<string, WidgetSpec> = {
  // Profile A — Emergency / Dispatch
  live_map: { label: 'Live Truck Map', icon: Map, description: 'Active technicians and current jobs.', route: '/dashboard/dispatch-field-ops' },
  incoming_call_queue: { label: 'Incoming Calls', icon: PhoneCall, description: 'Live receptionist queue.', route: '/dashboard/calls' },
  emergency_flag_counter: { label: 'Emergency Flags', icon: AlertCircle, description: 'P0/P1 calls awaiting dispatch.', route: '/dashboard/dispatch-field-ops' },
  todays_job_board: { label: "Today's Job Board", icon: ClipboardList, description: 'All jobs scheduled today.', route: '/dashboard/dispatch-field-ops' },
  technician_utilization: { label: 'Tech Utilization', icon: Activity, description: 'Billable hours per tech today.', route: '/dashboard/analytics' },
  revenue_today: { label: 'Revenue Today', icon: Wallet, description: 'Captured revenue for today.', route: '/dashboard/analytics' },
  missed_call_recovery: { label: 'Missed Call Recovery', icon: PhoneMissed, description: 'Auto follow-up on missed calls.', route: '/dashboard/calls' },

  // Profile B — Recurring Routes
  todays_route_map: { label: "Today's Route", icon: Map, description: 'Optimized stops for today.', route: '/dashboard/dispatch-field-ops' },
  completed_vs_remaining: { label: 'Completed vs Remaining', icon: Activity, description: 'Route progress in real time.', route: '/dashboard/dispatch-field-ops' },
  subscription_status: { label: 'Subscriptions', icon: Repeat, description: 'Active recurring customers.', route: '/dashboard/customers' },
  upcoming_renewals: { label: 'Upcoming Renewals', icon: RefreshCcw, description: 'Renewals coming this week.', route: '/dashboard/customers' },
  seasonal_campaign: { label: 'Seasonal Campaign', icon: Sparkles, description: 'Active seasonal outreach.', route: '/dashboard/marketing-sales-ops' },
  review_score: { label: 'Review Score', icon: Star, description: 'Latest review pulse.', route: '/dashboard/quick-setup?tab=reviews' },
  winback_candidates: { label: 'Winback Candidates', icon: Users, description: 'Lapsed customers to re-engage.', route: '/dashboard/customers' },

  // Profile C — Project Contractors
  active_projects: { label: 'Active Projects', icon: ClipboardList, description: 'Projects in progress.', route: '/dashboard/dispatch-field-ops' },
  pending_estimates: { label: 'Pending Estimates', icon: FileText, description: 'Estimates awaiting response.', route: '/dashboard/quotes' },
  crew_assignments_map: { label: 'Crew Assignments', icon: Map, description: 'Crews and current sites.', route: '/dashboard/dispatch-field-ops' },
  material_inventory: { label: 'Material Inventory', icon: Package, description: 'On-hand materials.', route: '/dashboard/inventory' },
  revenue_pipeline: { label: 'Revenue Pipeline', icon: Wallet, description: 'Forecasted revenue by stage.', route: '/dashboard/analytics' },
  completion_rate: { label: 'Completion Rate', icon: Trophy, description: 'On-time completion %.', route: '/dashboard/analytics' },
  before_after_gallery: { label: 'Before / After', icon: ImageIcon, description: 'Project photo gallery.', route: '/dashboard/social-media-ops' },

  // Profile D — Solo / Appointment
  todays_appointments: { label: "Today's Appointments", icon: CalendarDays, description: 'Calendar for today.', route: '/dashboard/appointments' },
  pending_bookings: { label: 'Pending Bookings', icon: Clock, description: 'New booking requests.', route: '/dashboard/appointments' },
  followup_queue: { label: 'Follow-up Queue', icon: MessageSquare, description: 'Post-visit follow-ups.', route: '/dashboard/messages' },
  review_status: { label: 'Review Status', icon: Star, description: 'Recent review activity.', route: '/dashboard/quick-setup?tab=reviews' },
  revenue_this_month: { label: 'Revenue MTD', icon: Wallet, description: 'Captured revenue this month.', route: '/dashboard/analytics' },
  availability_gaps: { label: 'Availability Gaps', icon: CalendarRange, description: 'Open slots to promote.', route: '/dashboard/appointments' },

  // Profile E — Real Estate
  lead_pipeline: { label: 'Lead Pipeline', icon: Users, description: 'Hot, warm, cold leads.', route: '/dashboard/leads' },
  todays_showings: { label: "Today's Showings", icon: CalendarDays, description: 'Booked showings today.', route: '/dashboard/appointments' },
  lead_response_time: { label: 'Lead Response Time', icon: Activity, description: 'Avg time-to-first-response.', route: '/dashboard/analytics' },
  listing_campaigns: { label: 'Listing Campaigns', icon: Sparkles, description: 'Active marketing campaigns.', route: '/dashboard/marketing-sales-ops' },
  social_post_scheduler: { label: 'Social Schedule', icon: CalendarRange, description: 'Upcoming social posts.', route: '/dashboard/social-media-ops' },
  review_referral_tracker: { label: 'Reviews & Referrals', icon: Star, description: 'Reviews and referral activity.', route: '/dashboard/referrals' },
  revenue_closed: { label: 'Revenue Closed', icon: Wallet, description: 'Closed-won revenue.', route: '/dashboard/analytics' },

  // Profile F — Delivery / Logistics
  todays_delivery_route: { label: "Today's Deliveries", icon: Truck, description: 'Planned drops today.', route: '/dashboard/dispatch-field-ops' },
  delivery_windows: { label: 'Delivery Windows', icon: Clock, description: 'Open/close windows by stop.', route: '/dashboard/dispatch-field-ops' },
  driver_assignments: { label: 'Driver Assignments', icon: Users, description: 'Drivers and assigned routes.', route: '/dashboard/employees' },
  in_transit_status: { label: 'In Transit', icon: Truck, description: 'Live status of active deliveries.', route: '/dashboard/dispatch-field-ops' },
  eta_notification_status: { label: 'ETA Notifications', icon: MessageSquare, description: 'Outbound ETA texts.', route: '/dashboard/messages' },
  proof_of_delivery: { label: 'Proof of Delivery', icon: FileText, description: 'Signed/photo confirmations.', route: '/dashboard/dispatch-field-ops' },

  // Profile G — Mobile Auto
  mobile_unit_locations: { label: 'Mobile Units', icon: MapPin, description: 'Live unit locations.', route: '/dashboard/dispatch-field-ops' },
  todays_appointment_map: { label: "Today's Service Map", icon: Map, description: 'Service stops today.', route: '/dashboard/dispatch-field-ops' },
  booking_queue: { label: 'Booking Queue', icon: Clock, description: 'New booking requests.', route: '/dashboard/appointments' },
  repeat_customers_due: { label: 'Repeat Customers', icon: Repeat, description: 'Repeat customers due for service.', route: '/dashboard/customers' },
  revenue_by_service: { label: 'Revenue by Service', icon: Wallet, description: 'Revenue mix by service type.', route: '/dashboard/analytics' },

  // Profile H — Pet Services
  todays_pet_appointments: { label: "Today's Pet Visits", icon: CalendarDays, description: 'Pet appointments today.', route: '/dashboard/appointments' },
  pet_profiles: { label: 'Pet Profiles', icon: Users, description: 'All pet profiles on file.', route: '/dashboard/customers' },
  route_map: { label: 'Route Map', icon: Map, description: "Today's mobile route.", route: '/dashboard/dispatch-field-ops' },
  recurring_appointment_status: { label: 'Recurring Care', icon: Repeat, description: 'Active recurring care.', route: '/dashboard/customers' },
  review_requests: { label: 'Review Requests', icon: Star, description: 'Open review asks.', route: '/dashboard/quick-setup?tab=reviews' },

  // Profile I — Events
  event_calendar: { label: 'Event Calendar', icon: CalendarDays, description: 'Booked and held event dates.', route: '/dashboard/appointments' },
  pending_quote_approvals: { label: 'Pending Quotes', icon: FileText, description: 'Quotes awaiting client approval.', route: '/dashboard/quotes' },
  deposit_payment_status: { label: 'Deposit Status', icon: Wallet, description: 'Deposits collected vs pending.', route: '/dashboard/quotes' },
  upcoming_events_30day: { label: 'Next 30 Days', icon: CalendarRange, description: 'Events in the next 30 days.', route: '/dashboard/appointments' },
  seasonal_booking_trend: { label: 'Booking Trend', icon: Activity, description: 'Booking pace vs prior season.', route: '/dashboard/analytics' },
  post_event_review_requests: { label: 'Post-Event Reviews', icon: Star, description: 'Review asks after each event.', route: '/dashboard/quick-setup?tab=reviews' },

  // Profile J — Sensitive / Specialty
  sensitive_job_intake: { label: 'Sensitive Intake', icon: ShieldAlert, description: 'New discreet intake requests.', route: '/dashboard/leads' },
  crew_assignments: { label: 'Crew Assignments', icon: Users, description: 'Crews and active sites.', route: '/dashboard/dispatch-field-ops' },
  active_jobs: { label: 'Active Jobs', icon: ClipboardList, description: 'All jobs in progress.', route: '/dashboard/dispatch-field-ops' },
  before_after_documentation: { label: 'Before / After Docs', icon: ImageIcon, description: 'On-site documentation per job.', route: '/dashboard/dispatch-field-ops' },
  quoted_vs_invoiced: { label: 'Quoted vs Invoiced', icon: Receipt, description: 'Estimate accuracy by job.', route: '/dashboard/analytics' },
};

export function ProfileWidgetGrid() {
  const { spec, loading } = useCompanyProfile();
  const navigate = useNavigate();

  if (loading || !spec?.dashboardWidgets?.length) return null;

  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {spec.label} — Priority Widgets
          </CardTitle>
          <Badge variant="outline" className="border-primary/40 text-primary">
            {spec.key.replace('PROFILE_', 'Profile ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {spec.dashboardWidgets.map((id) => {
            const w = W[id];
            if (!w) return null;
            const Icon = w.icon;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(w.route)}
                className="text-left p-3 rounded-lg border border-border/60 bg-background/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Icon className="h-4 w-4 text-primary mb-1.5" />
                <div className="text-sm font-medium text-foreground leading-tight">{w.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{w.description}</div>
                <div className="text-[11px] text-primary mt-1.5">Open →</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}