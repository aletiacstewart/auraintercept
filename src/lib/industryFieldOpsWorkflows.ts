import {
  Route, Wrench, Map, ClipboardList, Phone, Home, Scissors,
  Sparkles, Hammer, AlertCircle, Calendar, Camera, Sun, Bug,
  Waves, Shield, Utensils, Briefcase, type LucideIcon,
} from 'lucide-react';
import type { WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import type { IndustryPack } from '@/hooks/useIndustryPack';

/* Cluster defaults — used when no per-industry override is present. */
const CLUSTER: Record<IndustryPack['cluster'], WorkflowChain[]> = {
  trades: [
    { id: 'dispatch-complete', label: 'Dispatch → Complete',
      description: 'Full field job from dispatch to completion report',
      icon: Route, steps: ['Dispatch', 'Route', 'Arrive', 'Complete'],
      command: 'Dispatch the next pending job to the nearest available technician, optimize the route, and prepare the completion checklist' },
    { id: 'emergency-dispatch', label: 'Emergency Job',
      description: 'Fast-track an emergency service call',
      icon: AlertCircle, steps: ['Triage', 'Assign', 'Route', 'ETA Notify'],
      command: 'Create an emergency service call, assign the closest available technician, calculate the fastest route, and send the customer an ETA notification' },
    { id: 'end-of-day', label: 'End of Day Wrap-Up',
      description: 'Close out all field jobs and generate daily summary',
      icon: Wrench, steps: ['Review Jobs', 'Close Open', 'Summary'],
      command: 'Review all field jobs from today, close any that are completed, and generate an end-of-day summary with technician performance metrics' },
  ],
  outdoor: [
    { id: 'route-service', label: 'Route → Service → Photos',
      description: 'Run today’s recurring route with proof-of-service photos',
      icon: Map, steps: ['Route', 'Service', 'Photos', 'Invoice'],
      command: 'Run today’s recurring route: confirm completion at each stop, attach service photos, and generate invoices' },
    { id: 'weather-reshuffle', label: 'Weather Reshuffle',
      description: 'Reschedule weather-impacted stops automatically',
      icon: AlertCircle, steps: ['Scan Weather', 'Flag At-Risk', 'Reschedule'],
      command: 'Scan today’s outdoor jobs against current weather, flag at-risk stops, and propose a new schedule for my approval' },
    { id: 'site-survey', label: 'Site Survey → Quote',
      description: 'Convert a site survey into an itemized quote',
      icon: ClipboardList, steps: ['Survey', 'Photos', 'Measure', 'Quote'],
      command: 'For my latest completed site survey, draft an itemized quote with measurements and photo references' },
  ],
  repair: [
    { id: 'intake-diagnose', label: 'Intake → Diagnose → Quote',
      description: 'Take in a ticket, run diagnostics, send a quote',
      icon: ClipboardList, steps: ['Intake', 'Diagnose', 'Quote'],
      command: 'Run the repair intake flow: log a new ticket, draft a diagnostic checklist, and send a quote for approval' },
    { id: 'parts-repair', label: 'Parts → Repair → QC → Invoice',
      description: 'Order parts, complete the repair, QC, and invoice',
      icon: Wrench, steps: ['Parts', 'Repair', 'QC', 'Invoice'],
      command: 'For my latest approved repair quote: order needed parts, schedule the repair, run QC, and generate the invoice when complete' },
    { id: 'status-update', label: 'Status Update Loop',
      description: 'Notify customers at every repair stage',
      icon: Phone, steps: ['Status', 'Notify', 'Confirm'],
      command: 'For all open repair tickets, draft status update messages for each customer and send them for my approval' },
  ],
  booking: [
    { id: 'lead-to-booking', label: 'Lead → Booking → Close',
      description: 'Convert a new lead into a booked appointment and close',
      icon: Home, steps: ['Lead', 'Schedule', 'Follow-Up', 'Close'],
      command: 'Take my newest lead: book the next available appointment, send confirmation, and queue follow-up messages until close' },
    { id: 'no-show-recovery', label: 'No-Show Recovery',
      description: 'Reach out to no-shows and rebook',
      icon: Phone, steps: ['Detect', 'Reach Out', 'Rebook'],
      command: 'Find today’s no-shows, draft a friendly rebook message for each, and send for my approval' },
    { id: 'daily-prep', label: 'Daily Prep Brief',
      description: 'Brief on today’s appointments and prep notes',
      icon: Calendar, steps: ['Pull Schedule', 'Prep Notes', 'Brief'],
      command: 'Brief me on today’s appointments with any prep notes, prior visit history, and known preferences for each customer' },
  ],
};

/* Per-industry overrides — covers ALL 18 packs explicitly. */
const OVERRIDES: Record<string, WorkflowChain[]> = {
  hvac: [
    { id: 'dispatch-complete', label: 'Dispatch → Complete',
      description: 'Full HVAC service call from dispatch to closeout',
      icon: Route, steps: ['Dispatch', 'Route', 'Arrive', 'Complete'],
      command: 'Dispatch the next pending HVAC call to the nearest available tech, optimize the route, and prepare the closeout checklist' },
    { id: 'no-cool-emergency', label: 'No-Cool / No-Heat Emergency',
      description: 'Triage and dispatch an HVAC emergency',
      icon: AlertCircle, steps: ['Triage', 'Assign', 'Route', 'ETA'],
      command: 'Create a no-cool/no-heat emergency, assign the closest qualified tech, calculate fastest route, and notify the customer of ETA' },
    { id: 'maintenance-renewal', label: 'Maintenance Renewal Sweep',
      description: 'Find expiring maintenance plans and renew',
      icon: Calendar, steps: ['Find Expiring', 'Draft Offer', 'Send'],
      command: 'Find HVAC maintenance plans expiring this month, draft renewal offers, and queue them for approval' },
  ],
  plumbing: [
    { id: 'leak-emergency', label: 'Leak / Burst Emergency',
      description: 'Fast-track a water emergency to the nearest plumber',
      icon: AlertCircle, steps: ['Triage', 'Assign', 'Route', 'ETA'],
      command: 'Create a burst-pipe emergency, assign the closest plumber, calculate the fastest route, and notify the customer of ETA' },
    { id: 'drain-clog', label: 'Drain / Clog Service',
      description: 'Standard drain clearing dispatch flow',
      icon: Wrench, steps: ['Intake', 'Quote', 'Dispatch', 'Invoice'],
      command: 'Take a drain-clog request: confirm fixture and access, send a flat-rate quote, dispatch a plumber, and invoice on completion' },
    { id: 'water-heater', label: 'Water Heater Replacement',
      description: 'Quote and schedule a water heater swap',
      icon: Sparkles, steps: ['Survey', 'Quote', 'Order', 'Install'],
      command: 'For my newest water heater lead, schedule a survey, draft a replacement quote with options, and pre-order the unit on approval' },
  ],
  electrical: [
    { id: 'panel-upgrade', label: 'Panel Upgrade Flow',
      description: 'Site survey → permit → quote → install',
      icon: ClipboardList, steps: ['Survey', 'Permit', 'Quote', 'Install'],
      command: 'For my newest panel upgrade lead, schedule a site survey, draft a permit application, and prepare an itemized quote' },
    { id: 'outage-emergency', label: 'Outage Emergency',
      description: 'Dispatch an emergency electrical call',
      icon: AlertCircle, steps: ['Triage', 'Assign', 'Route', 'ETA'],
      command: 'Create an outage emergency, assign the closest licensed electrician, calculate the fastest route, and notify the customer of ETA' },
    { id: 'service-call', label: 'Standard Service Call',
      description: 'Dispatch and complete a routine electrical job',
      icon: Route, steps: ['Dispatch', 'Diagnose', 'Repair', 'Invoice'],
      command: 'Dispatch the next pending electrical service call, run diagnosis, complete the repair, and generate the invoice' },
  ],
  appliance_repair: [
    { id: 'intake-diagnose', label: 'Intake → Diagnose → Quote',
      description: 'Take an appliance ticket and quote the repair',
      icon: ClipboardList, steps: ['Intake', 'Diagnose', 'Quote'],
      command: 'Run appliance intake: capture brand and model, suggest likely faults, and draft a quote with parts and labor' },
    { id: 'parts-repair', label: 'Parts → Repair → Invoice',
      description: 'Order parts and complete the repair',
      icon: Wrench, steps: ['Parts', 'Repair', 'QC', 'Invoice'],
      command: 'For my latest approved appliance repair quote, order the needed parts, schedule the repair, and invoice on completion' },
    { id: 'warranty-check', label: 'Warranty Check',
      description: 'Verify OEM warranty status before billing',
      icon: Shield, steps: ['Lookup Serial', 'Verify', 'Note'],
      command: 'For each open appliance ticket, look up the brand warranty status by serial number and note coverage on the job' },
  ],
  landscape: [
    { id: 'recurring-route', label: 'Recurring Route Day',
      description: 'Run a maintenance route with photo proof',
      icon: Map, steps: ['Route', 'Service', 'Photos', 'Invoice'],
      command: 'Run today’s recurring landscape route: confirm completion, capture before/after photos, and generate invoices' },
    { id: 'storm-cleanup', label: 'Storm Cleanup Sweep',
      description: 'Surface storm-impacted properties for cleanup',
      icon: AlertCircle, steps: ['Scan Weather', 'Flag', 'Draft Outreach'],
      command: 'Scan recent storm activity, flag impacted properties, and draft cleanup outreach for my approval' },
    { id: 'seasonal-quote', label: 'Seasonal Service Quote',
      description: 'Quote a recurring seasonal service plan',
      icon: ClipboardList, steps: ['Survey', 'Plan', 'Quote'],
      command: 'For my latest landscape lead, propose a recurring seasonal service plan with itemized pricing' },
  ],
  pest_control: [
    { id: 'recurring-route', label: 'Recurring Route Day',
      description: 'Run today’s treatment route with chemical log',
      icon: Map, steps: ['Route', 'Treat', 'Log Chems', 'Invoice'],
      command: 'Run today’s recurring pest route: confirm treatment at each stop, log chemicals applied, and generate invoices' },
    { id: 'urgent-infestation', label: 'Urgent Infestation',
      description: 'Dispatch an urgent infestation call',
      icon: Bug, steps: ['Triage', 'Assign', 'Route', 'ETA'],
      command: 'Create an urgent infestation call, assign the closest tech, calculate the fastest route, and notify the customer of ETA' },
    { id: 'inspection-quote', label: 'Inspection → Plan',
      description: 'Convert an inspection into a treatment plan',
      icon: ClipboardList, steps: ['Inspect', 'Findings', 'Plan'],
      command: 'For my latest pest inspection, summarize findings and draft a recurring treatment plan for approval' },
  ],
  pool_spa: [
    { id: 'recurring-route', label: 'Recurring Route Day',
      description: 'Run today’s pool service route with chemistry log',
      icon: Waves, steps: ['Route', 'Service', 'Chem Log', 'Invoice'],
      command: 'Run today’s pool route: confirm service, log water chemistry readings, and generate invoices' },
    { id: 'green-pool', label: 'Green Pool Recovery',
      description: 'Quote and schedule a green pool recovery',
      icon: Sparkles, steps: ['Inspect', 'Quote', 'Schedule'],
      command: 'For my newest green-pool lead, draft a recovery quote with chemicals and visits, and schedule the first treatment' },
    { id: 'equipment-repair', label: 'Equipment Repair',
      description: 'Diagnose and quote a pump or heater issue',
      icon: Wrench, steps: ['Diagnose', 'Parts', 'Quote'],
      command: 'For the latest pool equipment ticket, run diagnosis, identify needed parts, and draft a repair quote' },
  ],
  roofing: [
    { id: 'storm-canvass', label: 'Storm Canvass Sweep',
      description: 'Surface storm-damaged neighborhoods for outreach',
      icon: AlertCircle, steps: ['Storm Map', 'Target', 'Draft Outreach'],
      command: 'Pull recent storm tracks, target impacted neighborhoods, and draft door-hanger outreach for my approval' },
    { id: 'inspection-quote', label: 'Inspection → Quote',
      description: 'Convert a roof inspection into an itemized quote',
      icon: ClipboardList, steps: ['Inspect', 'Photos', 'Quote'],
      command: 'For my latest roof inspection, draft an itemized quote with photos and material options' },
    { id: 'insurance-claim', label: 'Insurance Claim Assist',
      description: 'Track an insurance claim end to end',
      icon: Shield, steps: ['Document', 'Submit', 'Follow Up'],
      command: 'For the latest claim-eligible roof job, document damage, draft the insurance submission, and queue follow-ups' },
  ],
  solar: [
    { id: 'site-survey', label: 'Site Survey → Design',
      description: 'Convert a survey into a system design and quote',
      icon: Sun, steps: ['Survey', 'Design', 'Quote'],
      command: 'For my newest solar lead, schedule a site survey, propose a system design, and draft an itemized quote with incentives' },
    { id: 'incentive-calc', label: 'Incentive Calculator',
      description: 'Calculate rebates and tax credits per job',
      icon: ClipboardList, steps: ['Lookup', 'Calculate', 'Attach'],
      command: 'For the latest open solar quote, look up local rebates and federal tax credits, then attach a savings summary' },
    { id: 'install-day', label: 'Install Day Run',
      description: 'Coordinate the install crew and final inspection',
      icon: Hammer, steps: ['Assign Crew', 'Install', 'Inspect'],
      command: 'For today’s solar installs, assign the crew, confirm materials on hand, and queue the final inspection' },
  ],
  fencing: [
    { id: 'site-survey', label: 'Site Survey → Quote',
      description: 'Convert a measure into a fencing quote',
      icon: ClipboardList, steps: ['Survey', 'Measure', 'Quote'],
      command: 'For my latest fencing lead, schedule a measure, draft an itemized quote, and pre-list materials needed' },
    { id: 'install-day', label: 'Install Day Run',
      description: 'Coordinate the install crew and confirm materials',
      icon: Hammer, steps: ['Assign Crew', 'Stage Materials', 'Install'],
      command: 'For today’s fence installs, assign the crew, confirm staged materials, and prepare the completion checklist' },
    { id: 'permit-check', label: 'Permit Check',
      description: 'Verify permits and HOA approvals before install',
      icon: Shield, steps: ['Pull Permits', 'HOA', 'Confirm'],
      command: 'For each pending fence install, verify required permits and HOA approvals are in place' },
  ],
  auto_care: [
    { id: 'intake-diagnose', label: 'Intake → Diagnose → Estimate',
      description: 'Vehicle intake, diagnostics, and estimate',
      icon: ClipboardList, steps: ['Intake', 'Diagnose', 'Estimate'],
      command: 'Run vehicle intake: capture VIN and mileage, list reported symptoms, and draft a diagnostic estimate' },
    { id: 'parts-repair', label: 'Parts → Repair → Invoice',
      description: 'Order parts, complete the repair, and invoice',
      icon: Wrench, steps: ['Parts', 'Repair', 'QC', 'Invoice'],
      command: 'For my latest approved repair order, order needed parts, schedule the bay, run QC, and invoice on completion' },
    { id: 'status-update', label: 'Customer Status Loop',
      description: 'Keep vehicle owners informed every stage',
      icon: Phone, steps: ['Status', 'Notify', 'Confirm'],
      command: 'For all open repair orders, draft status update messages for each customer and send for my approval' },
  ],
  construction: [
    { id: 'bid-walk', label: 'Bid Walk → Estimate',
      description: 'Convert a bid walk into a structured estimate',
      icon: ClipboardList, steps: ['Walk', 'Scope', 'Estimate'],
      command: 'For my latest bid walk, summarize the scope, list assemblies needed, and draft a structured estimate' },
    { id: 'change-order', label: 'Change Order Loop',
      description: 'Process and track change orders',
      icon: Wrench, steps: ['Capture', 'Price', 'Approve'],
      command: 'For each open job, capture pending change orders, price them, and queue them for owner approval' },
    { id: 'punch-list', label: 'Punch List Closeout',
      description: 'Close out the punch list and invoice',
      icon: Camera, steps: ['Punch', 'Photos', 'Invoice'],
      command: 'For the project nearing closeout, generate the punch list, capture photo proof, and draft the final invoice' },
  ],
  handyman: [
    { id: 'intake-quote', label: 'Intake → Quote',
      description: 'Take a request and send a flat-rate quote',
      icon: ClipboardList, steps: ['Intake', 'Scope', 'Quote'],
      command: 'Take a handyman request: clarify scope, draft a flat-rate quote, and pre-fill required materials' },
    { id: 'route-day', label: 'Route Day Run',
      description: 'Sequence today’s mixed jobs efficiently',
      icon: Route, steps: ['Sequence', 'Dispatch', 'Complete'],
      command: 'Sequence today’s mixed handyman/cleaning jobs by location and priority, dispatch, and prepare a closeout summary' },
    { id: 'recurring-clean', label: 'Recurring Clean Plan',
      description: 'Convert a one-off into a recurring plan',
      icon: Sparkles, steps: ['Quote', 'Approve', 'Recurring'],
      command: 'For my latest cleaning lead, draft a recurring service plan with frequency options and pricing' },
  ],
  security_systems: [
    { id: 'site-survey', label: 'Site Survey → Design',
      description: 'Convert a survey into a security system design',
      icon: ClipboardList, steps: ['Survey', 'Design', 'Quote'],
      command: 'For my latest security lead, schedule a site survey, propose a system design, and draft an itemized quote' },
    { id: 'install-day', label: 'Install Day Run',
      description: 'Coordinate install and arm-up checklist',
      icon: Shield, steps: ['Assign', 'Install', 'Arm-Up'],
      command: 'For today’s security installs, assign the crew, confirm equipment, and prepare the arm-up and customer training checklist' },
    { id: 'monitoring-check', label: 'Monitoring Check-In',
      description: 'Audit active monitoring accounts',
      icon: AlertCircle, steps: ['Audit', 'Flag', 'Reach Out'],
      command: 'Audit active monitoring accounts, flag any with offline panels, and draft outreach to the affected customers' },
  ],
  real_estate: [
    { id: 'lead-to-showing', label: 'Lead → Showing → Offer',
      description: 'Convert a buyer lead into a showing and offer',
      icon: Home, steps: ['Lead', 'Showing', 'Offer', 'Close'],
      command: 'Take my newest buyer lead: book a showing today, draft a follow-up, and prep a sample offer packet' },
    { id: 'listing-launch', label: 'Listing Launch',
      description: 'Promote a new listing with social and email',
      icon: Sparkles, steps: ['Listing', 'Posts', 'Email', 'Open House'],
      command: 'For my newest listing, draft social posts and an email blast, then schedule the open house and capture RSVPs' },
    { id: 'no-show-recovery', label: 'No-Show / No-Reply Recovery',
      description: 'Re-engage no-show buyers and stale leads',
      icon: Phone, steps: ['Detect', 'Reach Out', 'Rebook'],
      command: 'Find no-show showings and stale buyer leads, draft personalized re-engagement messages, and send for approval' },
  ],
  beauty_wellness: [
    { id: 'daily-prep', label: 'Daily Prep Brief',
      description: 'Brief the team on today’s appointments and prefs',
      icon: Scissors, steps: ['Pull Schedule', 'Notes', 'Brief'],
      command: 'Brief me on today’s chair schedule with each client’s prior service notes and known preferences' },
    { id: 'rebook-loop', label: 'Rebook Loop',
      description: 'Reach out to clients due for their next visit',
      icon: Calendar, steps: ['Find Due', 'Draft', 'Send'],
      command: 'Find clients due for a rebook based on service interval, draft personalized invites, and queue for my approval' },
    { id: 'no-show-recovery', label: 'No-Show / Late Recovery',
      description: 'Recover today’s no-shows and lates',
      icon: Phone, steps: ['Detect', 'Reach Out', 'Rebook'],
      command: 'Find today’s no-shows and late cancels, draft a friendly rebook offer, and send for my approval' },
  ],
  restaurants: [
    { id: 'menu-update', label: 'Menu & Hours Update',
      description: 'Refresh menu, daily specials, and hours sent via Smart Links',
      icon: Utensils, steps: ['Pull Menu', 'Update', 'Publish'],
      command: 'Refresh tonight’s menu and daily specials, confirm hours, and update the Smart Link sent by Aura on calls and chats' },
    { id: 'inquiry-recovery', label: 'Missed Call / Inquiry Recovery',
      description: 'Follow up on missed calls and unanswered inquiries with Smart Links',
      icon: Phone, steps: ['Detect', 'Smart Link', 'Send'],
      command: 'For today’s missed calls and unanswered chats, send each guest the booking, menu, or catering Smart Link they likely needed' },
    { id: 'review-pulse', label: 'Review Pulse',
      description: 'Surface and respond to recent reviews',
      icon: Sparkles, steps: ['Pull', 'Draft Replies', 'Send'],
      command: 'Pull recent reviews across platforms, draft on-brand replies, and queue them for my approval' },
  ],
  personal_assistant: [
    { id: 'daily-brief', label: 'Daily Brief',
      description: 'Brief on today’s calendar, tasks, and priorities',
      icon: Briefcase, steps: ['Calendar', 'Tasks', 'Brief'],
      command: 'Brief me on today: calendar conflicts, top 3 priorities, and any messages awaiting my reply' },
    { id: 'inbox-zero', label: 'Inbox Triage',
      description: 'Triage messages and draft replies',
      icon: Phone, steps: ['Triage', 'Draft', 'Approve'],
      command: 'Triage my inbox: flag urgent items, draft suggested replies, and queue them for my approval' },
    { id: 'travel-coord', label: 'Travel / Booking Coord',
      description: 'Coordinate a trip or booking end to end',
      icon: Map, steps: ['Plan', 'Book', 'Confirm'],
      command: 'Plan my next trip: propose flights and lodging within budget, draft the booking, and confirm on approval' },
  ],
};

/** Resolve up to 3 industry-tailored field-ops workflow chains. */
export function getFieldOpsWorkflows(pack: IndustryPack): WorkflowChain[] {
  const chains = OVERRIDES[pack.industry_id] ?? CLUSTER[pack.cluster] ?? CLUSTER.trades;
  return chains.map((c) => ({ ...c, targetRoute: c.targetRoute ?? resolveTargetRoute(c.id) }));
}

/**
 * Map a workflow chain id to its most relevant working-surface route.
 * Returns undefined when no obvious destination exists — the card will then
 * only show "Run with Aura" without an "Open Page" button.
 */
function resolveTargetRoute(id: string): string | undefined {
  // Quotes / estimates / surveys
  if (id === 'bid-walk' || id === 'intake-quote' || id === 'site-survey' ||
      id === 'inspection-quote' || id === 'seasonal-quote' || id === 'water-heater' ||
      id === 'green-pool' || id === 'panel-upgrade' || id === 'incentive-calc') {
    return '/dashboard/quotes';
  }
  // Jobs / repair orders / change orders
  if (id === 'change-order' || id === 'parts-repair' || id === 'intake-diagnose' ||
      id === 'equipment-repair' || id === 'drain-clog' || id === 'service-call' ||
      id === 'warranty-check' || id === 'permit-check' || id === 'insurance-claim') {
    return '/dashboard/dispatch-field-ops';
  }
  // Field ops dispatch surface
  if (id === 'punch-list' || id === 'dispatch-complete' || id.startsWith('emergency') ||
      id === 'leak-emergency' || id === 'outage-emergency' || id === 'urgent-infestation' ||
      id === 'no-cool-emergency' || id === 'route-service' || id === 'recurring-route' ||
      id === 'weather-reshuffle' || id === 'install-day' || id === 'route-day' ||
      id === 'end-of-day' || id === 'storm-cleanup' || id === 'storm-canvass') {
    return '/dashboard/dispatch-field-ops';
  }
  // Lead pipeline
  if (id === 'lead-to-booking' || id === 'lead-to-showing' || id === 'no-show-recovery' ||
      id === 'rebook-loop') {
    return '/dashboard/leads';
  }
  // Appointments / daily prep
  if (id === 'daily-prep' || id === 'daily-brief' || id === 'reservations-prep') {
    return '/dashboard/appointments';
  }
  // Messaging
  if (id === 'status-update' || id === 'monitoring-check' || id === 'inbox-zero') {
    return '/dashboard/messages';
  }
  // Reputation
  if (id === 'review-pulse') return '/dashboard/ai-consoles/social-media';
  // Social
  if (id === 'listing-launch') return '/dashboard/ai-consoles/social-media';
  // Customers / recurring plans
  if (id === 'maintenance-renewal' || id === 'recurring-clean' || id === 'inspection-plan') {
    return '/dashboard/customers';
  }
  // Calendar / travel
  if (id === 'travel-coord') return '/dashboard/appointments';
  return undefined;
}

export type { LucideIcon };