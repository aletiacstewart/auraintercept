import {
  AlertCircle,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  Car,
  CheckCircle,
  CheckSquare,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Home,
  LucideIcon,
  Map as MapIcon,
  MessageSquare,
  Navigation,
  Phone,
  Play,
  Receipt,
  Scissors,
  Send,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { IndustryPack } from '@/hooks/useIndustryPack';
import { hasFieldTechnicians } from '@/lib/industryCapabilities';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';

export type ServiceActionId =
  | 'accept'
  | 'decline'
  | 'directions'
  | 'enroute'
  | 'eta'
  | 'arrive_start'
  | 'complete'
  | 'reschedule'
  | 'quote'
  | 'invoice'
  | 'dispatch';

export type ServiceTabId = 'chat' | ServiceActionId;

export interface ServiceQuickAction {
  id: ServiceActionId;
  label: string;
  icon: LucideIcon;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  featureColor?: string;
  fieldOnly?: boolean;
}

export interface ServiceTab {
  id: ServiceTabId;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  featureColor?: string;
  fieldOnly?: boolean;
}

export interface ServiceOperativeCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  hsl: string;
  status: 'active' | 'standby' | 'idle';
  metric1Label: string;
  metric2Label: string;
}

export interface SelectorText {
  title: string;
  emptyMessage: string;
}

export interface IndustryServiceConsoleConfig {
  industryId: string;
  consoleTitle: string;
  consoleDescription: string;
  consoleBadge: string;
  consoleSubtitle: string;
  workerConsoleTitle: string;
  workerConsoleDescription: string;
  workerLayoutTitle: string;
  installAppLabel: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  inputPlaceholder: string;
  jobNoun: string;
  jobNounPlural: string;
  customerNoun: string;
  teamMemberNoun: string;
  locationNoun: string;
  serviceNoun: string;
  assignmentAgentName: string;
  assignmentAgentDescription: string;
  routingAgentName: string;
  routingAgentDescription: string;
  defaultOperative: string;
  contactTeamLabel: string;
  contactTeamDescription: string;
  noAddressLabel: string;
  notifyAudience: string;
  quickActions: ServiceQuickAction[];
  tabs: ServiceTab[];
  operatives: ServiceOperativeCard[];
  statusLabels: Record<string, string>;
  selectorText: Partial<Record<ServiceActionId, SelectorText>>;
  fieldRouting: boolean;
  appointmentBoardTitle: string;
  appointmentBoardDescription: string;
  providerNoun: string;
  roomNoun: string;
  specialistShow: IndustrySpecialistOperative[];
  specialistTitle: string;
  specialistSubtitle: string;
  todayLabel: string;
  openWorkLabel: string;
  openWorkHint: string;
  openWorkRoute: string;
  /** Sidebar group label for the Field Ops nav section (e.g. "Field Ops",
   * "Project Ops", "Salon Floor"). Derived per industry pack. */
  fieldOpsSectionLabel: string;
  /** Optional sidebar label for the worker/technician sub-item under the
   * Field Ops group. Defaults to "Technician View" when unset. */
  workerSubItemLabel?: string;
  /** Optional sidebar label for the dispatch/admin sub-item under the
   * Field Ops group. Defaults to "Dispatch View" when unset. */
  dispatchSubItemLabel?: string;
}

type PartialConfig = Partial<Omit<IndustryServiceConsoleConfig, 'quickActions' | 'tabs' | 'operatives' | 'statusLabels' | 'selectorText' | 'specialistShow'>> & {
  quickActions?: ServiceQuickAction[];
  tabs?: ServiceTab[];
  operatives?: ServiceOperativeCard[];
  statusLabels?: Record<string, string>;
  selectorText?: Partial<Record<ServiceActionId, SelectorText>>;
  specialistShow?: IndustrySpecialistOperative[];
};

const pluralize = (noun: string): string => {
  if (!noun) return 'Items';
  if (/s$/i.test(noun)) return noun;
  if (/(ch|sh|x|z)$/i.test(noun)) return `${noun}es`;
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}s`;
};

const quick = (
  id: ServiceActionId,
  label: string,
  icon: LucideIcon,
  message: string,
  extras: Partial<ServiceQuickAction> = {},
): ServiceQuickAction => ({ id, label, icon, message, featureColor: 'text-feature-fieldops', ...extras });

const tab = (
  id: ServiceTabId,
  label: string,
  icon: LucideIcon,
  extras: Partial<ServiceTab> = {},
): ServiceTab => ({ id, label, icon, featureColor: 'text-feature-fieldops', ...extras });

const BASE_TABS: ServiceTab[] = [
  tab('chat', 'Home', MessageSquare),
  tab('accept', 'Accept', UserCheck),
  tab('decline', 'Decline', XCircle, { featureColor: 'text-destructive' }),
  tab('directions', 'Directions', Navigation, { fieldOnly: true }),
  tab('enroute', 'En Route', Truck, { fieldOnly: true }),
  tab('eta', 'ETA', Clock, { featureColor: 'text-feature-appointments', fieldOnly: true }),
  tab('arrive_start', 'Arrive', Play),
  tab('complete', 'Complete', CheckCircle, { variant: 'destructive' }),
  tab('reschedule', 'Reschedule', CalendarClock, { featureColor: 'text-feature-appointments' }),
  tab('quote', 'Quote', FileText, { featureColor: 'text-feature-quotes' }),
  tab('invoice', 'Invoice', Receipt, { featureColor: 'text-feature-invoices' }),
  tab('dispatch', 'Help', Phone),
];

const TRADES_ACTIONS: ServiceQuickAction[] = [
  quick('accept', 'Accept Job', UserCheck, 'I want to accept my next assigned job.'),
  quick('decline', 'Decline Job', XCircle, 'I want to decline a job.', { featureColor: 'text-destructive' }),
  quick('directions', 'Get Directions', Navigation, 'Get directions to my next job', { fieldOnly: true }),
  quick('enroute', 'Mark En Route', Truck, "I'm ready to head out. Mark me as en route to my next job and notify the customer.", { fieldOnly: true }),
  quick('eta', 'Update ETA', Clock, 'I need to update my ETA for my current job.', { featureColor: 'text-feature-appointments', fieldOnly: true }),
  quick('arrive_start', 'Arrive & Start', Play, "I have arrived at the customer's location and I'm ready to start the job."),
  quick('complete', 'Complete Job', CheckCircle, 'I have finished the job. Please mark it as completed and notify the customer.', { variant: 'destructive' }),
  quick('reschedule', 'Reschedule', CalendarClock, 'I need to reschedule an appointment.', { featureColor: 'text-feature-appointments' }),
  quick('quote', 'Generate Quote', FileText, 'I need to create a quote for this job.', { featureColor: 'text-feature-quotes' }),
  quick('invoice', 'Generate Invoice', Receipt, 'I need to create an invoice for this completed job.', { featureColor: 'text-feature-invoices' }),
  quick('dispatch', 'Contact Dispatch', Phone, 'Contact dispatch'),
];

const BOOKING_ACTIONS: ServiceQuickAction[] = [
  quick('accept', 'Confirm Visit', UserCheck, 'Confirm my next assigned appointment and review prep notes.'),
  quick('decline', 'Flag Conflict', XCircle, 'I need to flag a scheduling conflict for an appointment.', { featureColor: 'text-destructive' }),
  quick('arrive_start', 'Check In / Start', Play, 'Check in the client and start this appointment.'),
  quick('complete', 'Complete Visit', CheckCircle, 'Mark this visit complete and prepare follow-up.', { variant: 'destructive' }),
  quick('reschedule', 'Reschedule', CalendarClock, 'I need to reschedule an appointment.', { featureColor: 'text-feature-appointments' }),
  quick('quote', 'Create Estimate', FileText, 'Create an estimate or recommended service plan for this appointment.', { featureColor: 'text-feature-quotes' }),
  quick('invoice', 'Send Invoice', Receipt, 'Create and send an invoice for this completed appointment.', { featureColor: 'text-feature-invoices' }),
  quick('dispatch', 'Contact Front Desk', Phone, 'Contact the front desk team'),
];

const REPAIR_ACTIONS: ServiceQuickAction[] = [
  quick('accept', 'Accept Ticket', UserCheck, 'I want to accept my next assigned repair ticket.'),
  quick('decline', 'Decline Ticket', XCircle, 'I need to decline a repair ticket.', { featureColor: 'text-destructive' }),
  quick('directions', 'Get Directions', Navigation, 'Get directions to my next repair order.', { fieldOnly: true }),
  quick('enroute', 'Mark On The Way', Truck, "I'm on the way for my next repair order. Notify the customer.", { fieldOnly: true }),
  quick('eta', 'Update ETA', Clock, 'Update ETA for my active repair order.', { featureColor: 'text-feature-appointments', fieldOnly: true }),
  quick('arrive_start', 'Start Repair', Play, 'Start work on this repair order.'),
  quick('complete', 'Complete Repair', CheckCircle, 'Mark this repair complete and prepare closeout.', { variant: 'destructive' }),
  quick('reschedule', 'Reschedule', CalendarClock, 'I need to reschedule a repair order.', { featureColor: 'text-feature-appointments' }),
  quick('quote', 'Create Estimate', FileText, 'Create a repair estimate.', { featureColor: 'text-feature-quotes' }),
  quick('invoice', 'Create Invoice', Receipt, 'Create an invoice for this repair order.', { featureColor: 'text-feature-invoices' }),
  quick('dispatch', 'Contact Service Desk', Phone, 'Contact the service desk'),
];

const STATUS_FIELD = {
  pending_acceptance: 'Pending',
  accepted: 'Accepted',
  en_route: 'En Route',
  arrived: 'On Site',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const STATUS_BOOKING = {
  pending_acceptance: 'Pending',
  accepted: 'Confirmed',
  en_route: 'Ready',
  arrived: 'Checked In',
  in_progress: 'In Service',
  completed: 'Completed',
  declined: 'Conflict',
  cancelled: 'Cancelled',
};

const FIELD_SELECTOR: Partial<Record<ServiceActionId, SelectorText>> = {
  accept: { title: 'Select job to accept', emptyMessage: 'No pending jobs to accept' },
  decline: { title: 'Select job to decline', emptyMessage: 'No pending jobs to decline' },
  directions: { title: 'Select appointment for directions', emptyMessage: 'No appointments assigned to you' },
  enroute: { title: 'Select appointment to mark as en route', emptyMessage: 'No accepted appointments to mark as en route' },
  eta: { title: 'Select appointment to update ETA', emptyMessage: 'No active appointments to update ETA' },
  arrive_start: { title: 'Select job to arrive & start', emptyMessage: 'No en route jobs available' },
  complete: { title: 'Select job to mark as completed', emptyMessage: 'No active jobs to complete' },
  reschedule: { title: 'Select appointment to reschedule', emptyMessage: 'No active appointments to reschedule' },
};

const BOOKING_SELECTOR: Partial<Record<ServiceActionId, SelectorText>> = {
  accept: { title: 'Select appointment to confirm', emptyMessage: 'No appointments waiting for confirmation' },
  decline: { title: 'Select appointment with a conflict', emptyMessage: 'No appointments waiting for response' },
  arrive_start: { title: 'Select appointment to check in / start', emptyMessage: 'No appointments ready to start' },
  complete: { title: 'Select appointment to complete', emptyMessage: 'No active appointments to complete' },
  reschedule: { title: 'Select appointment to reschedule', emptyMessage: 'No active appointments to reschedule' },
};

const fieldOperatives = (jobNoun: string, teamMemberNoun: string): ServiceOperativeCard[] => [
  {
    id: 'dispatch',
    name: 'Assignment Agent',
    description: `Assigns ${teamMemberNoun.toLowerCase()}s to ${jobNoun.toLowerCase()}s and balances workload`,
    icon: Truck,
    hsl: '189,100%,65%',
    status: 'active',
    metric1Label: 'Active',
    metric2Label: 'Assigned',
  },
  {
    id: 'field_navigation',
    name: 'Routing Agent',
    description: 'Routes, ETAs, check-ins, and completion handoff',
    icon: Navigation,
    hsl: '142,72%,55%',
    status: 'standby',
    metric1Label: 'Pending',
    metric2Label: 'In Progress',
  },
];

const bookingOperatives = (jobNoun: string): ServiceOperativeCard[] => [
  {
    id: 'customer_journey',
    name: 'Front Desk Agent',
    description: `Prepares, confirms, and follows up on ${jobNoun.toLowerCase()}s`,
    icon: CalendarCheck,
    hsl: '189,100%,65%',
    status: 'active',
    metric1Label: 'Active',
    metric2Label: 'Checked In',
  },
  {
    id: 'business_finance',
    name: 'Billing Agent',
    description: 'Creates estimates, invoices, deposits, and payment follow-up',
    icon: Receipt,
    hsl: '142,72%,55%',
    status: 'standby',
    metric1Label: 'Pending',
    metric2Label: 'In Progress',
  },
];

const baseConfig = (pack: IndustryPack, fieldRouting: boolean): IndustryServiceConsoleConfig => {
  const term = pack.terminology || {};
  const jobNoun = term.job || term.appointment || (fieldRouting ? 'Job' : 'Appointment');
  const customerNoun = term.customer || (fieldRouting ? 'Customer' : 'Client');
  const teamMemberNoun = term.technician || term.employee || (fieldRouting ? 'Technician' : 'Team Member');
  return {
    industryId: pack.industry_id,
    consoleTitle: fieldRouting ? 'Service Management Console' : 'Appointment Console',
    consoleDescription: fieldRouting
      ? `Live ${jobNoun.toLowerCase()} assignment, routing, and completion workflows`
      : `Today's ${jobNoun.toLowerCase()}s, check-ins, provider flow, and follow-up`,
    consoleBadge: fieldRouting ? 'Built for mobile service teams' : 'Built for booking-based teams',
    consoleSubtitle: fieldRouting ? 'Service Management — Cyber-Sentry Edition' : 'Appointment Operations — Cyber-Sentry Edition',
    workerConsoleTitle: fieldRouting ? 'Service Management Console' : 'Team Console',
    workerConsoleDescription: fieldRouting
      ? `Manage ${jobNoun.toLowerCase()}s, routes, ETAs, and completion`
      : `Manage ${jobNoun.toLowerCase()}s, check-ins, service notes, and follow-up`,
    workerLayoutTitle: fieldRouting ? 'Service Management' : 'Team Workspace',
    installAppLabel: fieldRouting ? 'Install Service App' : 'Install Team App',
    welcomeTitle: fieldRouting ? 'Service Management Ready' : `${jobNoun} Flow Ready`,
    welcomeSubtitle: fieldRouting
      ? `Manage your ${jobNoun.toLowerCase()}s — accept, navigate, update ETAs, and complete assignments`
      : `Manage your ${jobNoun.toLowerCase()}s — confirm, check in, complete, and follow up`,
    inputPlaceholder: fieldRouting ? `Ask about ${jobNoun.toLowerCase()}s, routes, ETAs...` : `Ask about ${jobNoun.toLowerCase()}s, check-ins, follow-up...`,
    jobNoun,
    jobNounPlural: pluralize(jobNoun),
    customerNoun,
    teamMemberNoun,
    locationNoun: fieldRouting ? 'customer location' : 'business location',
    serviceNoun: term.service || 'Service',
    assignmentAgentName: fieldRouting ? 'Assignment Agent' : 'Schedule Agent',
    assignmentAgentDescription: fieldRouting
      ? `Assigns ${teamMemberNoun.toLowerCase()}s by skills, availability, distance, and workload`
      : `Coordinates ${jobNoun.toLowerCase()} flow by availability, provider, room, and status`,
    routingAgentName: fieldRouting ? 'Routing Agent' : 'Flow Agent',
    routingAgentDescription: fieldRouting
      ? `Traffic-aware routing, ETA updates, and check-ins for ${teamMemberNoun.toLowerCase()}s`
      : `Check-in, room/provider handoff, completion, and follow-up for ${jobNoun.toLowerCase()}s`,
    defaultOperative: fieldRouting ? 'field_navigation' : 'customer_journey',
    contactTeamLabel: fieldRouting ? 'Contact Dispatch' : 'Contact Front Desk',
    contactTeamDescription: fieldRouting ? 'Reach out to your dispatch team for assistance' : 'Reach out to the front desk team for assistance',
    noAddressLabel: fieldRouting ? 'No address available' : 'No location needed',
    notifyAudience: customerNoun,
    quickActions: fieldRouting ? TRADES_ACTIONS : BOOKING_ACTIONS,
    tabs: (fieldRouting ? BASE_TABS : BASE_TABS.filter((t) => !t.fieldOnly)).map((t) =>
      t.id === 'arrive_start' ? { ...t, label: fieldRouting ? 'Arrive' : 'Check In' } : t,
    ),
    operatives: fieldRouting ? fieldOperatives(jobNoun, teamMemberNoun) : bookingOperatives(jobNoun),
    statusLabels: fieldRouting ? STATUS_FIELD : STATUS_BOOKING,
    selectorText: fieldRouting ? FIELD_SELECTOR : BOOKING_SELECTOR,
    fieldRouting,
    appointmentBoardTitle: fieldRouting ? 'Service Board' : 'Appointment Board',
    appointmentBoardDescription: fieldRouting ? `Active ${jobNoun.toLowerCase()}s by status and assignee` : `Today’s ${jobNoun.toLowerCase()}s by provider, room, and status`,
    providerNoun: teamMemberNoun,
    roomNoun: 'Room',
    specialistShow: fieldRouting ? ['permit_code', 'site_survey', 'diagnostic'] : ['review_responder' as IndustrySpecialistOperative],
    specialistTitle: 'Need a Specialist?',
    specialistSubtitle: fieldRouting ? 'Field-side specialists for permits, surveys, and diagnostics.' : 'Booking-side specialists for prep, rebook outreach, and review responses.',
    todayLabel: fieldRouting ? `Today's ${pluralize(jobNoun)}` : `Today's ${pluralize(jobNoun)}`,
    openWorkLabel: fieldRouting ? `Open ${pluralize(jobNoun)}` : `Open ${pluralize(jobNoun)}`,
    openWorkHint: fieldRouting ? 'In progress + upcoming' : 'Checked in + upcoming',
    openWorkRoute: fieldRouting ? '/dashboard/dispatch-field-ops' : '/dashboard/appointments',
    fieldOpsSectionLabel: fieldRouting ? 'Field Ops' : 'Operations',
  };
};

const CLUSTER_OVERRIDES: Record<IndustryPack['cluster'], PartialConfig> = {
  trades: {},
  outdoor: {
    consoleTitle: 'Route Operations Console',
    consoleBadge: 'Built for recurring outdoor routes',
    workerConsoleTitle: 'Crew Console',
    workerLayoutTitle: 'Route Operations',
    installAppLabel: 'Install Crew App',
    assignmentAgentName: 'Crew Assignment Agent',
    routingAgentName: 'Route Agent',
    specialistShow: ['site_survey'],
    fieldOpsSectionLabel: 'Crew Ops',
  },
  repair: {
    consoleTitle: 'Repair Operations Console',
    consoleBadge: 'Built for tickets, bays, parts, and repair orders',
    workerConsoleTitle: 'Repair Console',
    workerLayoutTitle: 'Repair Operations',
    quickActions: REPAIR_ACTIONS,
    specialistShow: ['diagnostic'],
    fieldOpsSectionLabel: 'Service Ops',
  },
  booking: {},
  home_health: {
    consoleTitle: 'Visit Operations Console',
    consoleBadge: 'Built for in-home patient visits and routes',
    workerConsoleTitle: 'Therapist Console',
    workerLayoutTitle: 'Visit Operations',
    installAppLabel: 'Install Therapist App',
    assignmentAgentName: 'Visit Assignment Agent',
    routingAgentName: 'Route Agent',
    fieldOpsSectionLabel: 'Visit Ops',
  },
};

const salonLike: PartialConfig = {
  consoleTitle: 'Chair Schedule Console',
  workerConsoleTitle: 'Stylist Console',
  workerLayoutTitle: 'Stylist Workspace',
  teamMemberNoun: 'Stylist',
  providerNoun: 'Stylist',
  roomNoun: 'Chair',
  customerNoun: 'Client',
  jobNoun: 'Appointment',
  assignmentAgentName: 'Booking Agent',
  routingAgentName: 'Chair Flow Agent',
  contactTeamLabel: 'Contact Front Desk',
  contactTeamDescription: 'Reach out to reception for scheduling help',
  fieldOpsSectionLabel: 'Salon Floor',
  quickActions: BOOKING_ACTIONS.map((a) => a.id === 'arrive_start' ? { ...a, label: 'Check In Client', message: 'Check in the client and start this service.' } : a.id === 'complete' ? { ...a, label: 'Complete Service', message: 'Complete this service, suggest rebooking, and prepare payment.' } : a),
  operatives: [
    { id: 'customer_journey', name: 'Reception Agent', description: 'Confirms appointments, captures preferences, and manages rebooking', icon: Scissors, hsl: '189,100%,65%', status: 'active', metric1Label: 'Appointments', metric2Label: 'Checked In' },
    { id: 'business_finance', name: 'Checkout Agent', description: 'Handles deposits, invoices, add-ons, and rebooking prompts', icon: CreditCard, hsl: '142,72%,55%', status: 'standby', metric1Label: 'Pending', metric2Label: 'Done Today' },
  ],
};

const INDUSTRY_OVERRIDES: Record<string, PartialConfig> = {
  hvac: { consoleTitle: 'HVAC Dispatch/GPS Console', workerConsoleTitle: 'HVAC Tech Ops Console', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'HVAC Tech Ops Console' },
  plumbing: { consoleTitle: 'Plumbing Dispatch/GPS Console', workerConsoleTitle: 'Plumber Ops Console', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Plumber Ops Console' },
  electrical: { consoleTitle: 'Electrical Dispatch/GPS Console', workerConsoleTitle: 'Electrician Ops Console', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Electrician Ops Console' },
  appliance_repair: { consoleTitle: 'Appliance Repair Dispatch/GPS Console', workerConsoleTitle: 'Repair Tech Ops Console', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Repair Tech Ops Console' },
  landscape: { consoleTitle: 'Landscape Dispatch/GPS Console', workerConsoleTitle: 'Crew Ops Console', teamMemberNoun: 'Crew Member', jobNoun: 'Visit', assignmentAgentName: 'Crew Assignment Agent', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Crew Ops Console' },
  pest_control: { consoleTitle: 'Pest Control Dispatch/GPS Console', workerConsoleTitle: 'Pest Tech Ops Console', teamMemberNoun: 'Pest Tech', jobNoun: 'Treatment Visit', assignmentAgentName: 'Route Assignment Agent', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Pest Tech Ops Console' },
  pool_spa: { consoleTitle: 'Pool & Spa Dispatch/GPS Console', workerConsoleTitle: 'Pool Tech Ops Console', teamMemberNoun: 'Pool Tech', jobNoun: 'Service Visit', assignmentAgentName: 'Route Assignment Agent', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Pool Tech Ops Console' },
  roofing: { consoleTitle: 'Roofing Dispatch/GPS Console', workerConsoleTitle: 'Roofing Crew Ops Console', teamMemberNoun: 'Crew Member', jobNoun: 'Inspection / Job', specialistShow: ['insurance_claim', 'site_survey'], fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Roofing Crew Ops Console' },
  solar: { consoleTitle: 'Solar Dispatch/GPS Console', workerConsoleTitle: 'Solar Crew Ops Console', teamMemberNoun: 'Crew Member', jobNoun: 'Install', specialistShow: ['site_survey', 'permit_code'], fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Solar Crew Ops Console' },
  fencing: { consoleTitle: 'Fencing Dispatch/GPS Console', workerConsoleTitle: 'Fencing Crew Ops Console', teamMemberNoun: 'Crew Member', jobNoun: 'Install', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Fencing Crew Ops Console' },
  construction: { consoleTitle: 'Construction Dispatch/GPS Console', workerConsoleTitle: 'Project Crew Ops Console', teamMemberNoun: 'Crew Member', jobNoun: 'Project', specialistShow: ['site_survey', 'permit_code'], fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Project Crew Ops Console' },
  handyman: { consoleTitle: 'Handyman Dispatch/GPS Console', workerConsoleTitle: 'Service Pro Ops Console', teamMemberNoun: 'Service Pro', jobNoun: 'Task', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Service Pro Ops Console' },
  security_systems: { consoleTitle: 'Security Dispatch/GPS Console', workerConsoleTitle: 'Security Tech Ops Console', teamMemberNoun: 'Security Tech', jobNoun: 'Install', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Security Tech Ops Console' },
  mobile_mechanic: { consoleTitle: 'Mobile Mechanic Dispatch/GPS Console', workerConsoleTitle: 'Mechanic Ops Console', teamMemberNoun: 'Mechanic', jobNoun: 'Service Call', fieldOpsSectionLabel: 'Dispatch/GPS', dispatchSubItemLabel: 'Dispatch/GPS Console', workerSubItemLabel: 'Mechanic Ops Console' },
  auto_care: {
    consoleTitle: 'Bay Queue Console',
    consoleBadge: 'Built for bays, repair orders, parts, and customer status loops',
    workerConsoleTitle: 'Bay Technician Console',
    workerLayoutTitle: 'Bay Operations',
    fieldOpsSectionLabel: 'Shop Ops',
    jobNoun: 'Repair Order',
    teamMemberNoun: 'Technician',
    locationNoun: 'bay',
    assignmentAgentName: 'Bay Assignment Agent',
    routingAgentName: 'Repair Flow Agent',
    fieldRouting: false,
    quickActions: REPAIR_ACTIONS.filter((a) => !a.fieldOnly).map((a) => a.id === 'arrive_start' ? { ...a, label: 'Start RO', message: 'Start this repair order in the bay.' } : a.id === 'complete' ? { ...a, label: 'Complete RO', message: 'Complete this repair order, run QC, and prepare invoice.' } : a),
    tabs: BASE_TABS.filter((t) => !t.fieldOnly),
    defaultOperative: 'customer_journey',
    openWorkRoute: '/dashboard/appointments',
    operatives: [
      { id: 'customer_journey', name: 'Service Advisor Agent', description: 'Manages RO intake, bay status, approvals, and customer updates', icon: Car, hsl: '189,100%,65%', status: 'active', metric1Label: 'ROs', metric2Label: 'In Bay' },
      { id: 'business_finance', name: 'Estimate & Invoice Agent', description: 'Builds repair estimates, approvals, and invoices', icon: Receipt, hsl: '142,72%,55%', status: 'standby', metric1Label: 'Pending', metric2Label: 'Done Today' },
    ],
  },
  beauty_wellness: salonLike,
  salon: salonLike,
  fitness: { consoleTitle: 'Class & Session Console', workerConsoleTitle: 'Trainer Console', workerLayoutTitle: 'Trainer Workspace', teamMemberNoun: 'Trainer', providerNoun: 'Trainer', customerNoun: 'Member', jobNoun: 'Session', roomNoun: 'Studio', fieldOpsSectionLabel: 'Studio Ops' },
  restaurants: {
    consoleTitle: 'Guest Flow Console',
    consoleBadge: 'Built for inbound calls, Smart Links, and follow-up',
    workerConsoleTitle: 'Host Console',
    workerLayoutTitle: 'Guest Operations',
    fieldOpsSectionLabel: 'Service Floor',
    teamMemberNoun: 'Staff Member',
    providerNoun: 'Host',
    customerNoun: 'Guest',
    jobNoun: 'Reservation',
    roomNoun: 'Table',
    assignmentAgentName: 'Host Agent',
    routingAgentName: 'Guest Flow Agent',
    contactTeamLabel: 'Contact Host Stand',
    operatives: [
      { id: 'customer_journey', name: 'Host Agent', description: 'Handles reservations, guest inquiries, Smart Links, and private event follow-up', icon: Users, hsl: '189,100%,65%', status: 'active', metric1Label: 'Reservations', metric2Label: 'Seated' },
      { id: 'business_finance', name: 'Events Billing Agent', description: 'Prepares catering quotes, deposits, and event invoices', icon: Receipt, hsl: '142,72%,55%', status: 'standby', metric1Label: 'Pending', metric2Label: 'Done Today' },
    ],
  },
  real_estate: {
    consoleTitle: 'Showing Console',
    consoleBadge: 'Built for showings, listings, and client follow-up',
    workerConsoleTitle: 'Agent Console',
    workerLayoutTitle: 'Agent Workspace',
    fieldOpsSectionLabel: 'Showings',
    teamMemberNoun: 'Agent',
    providerNoun: 'Agent',
    customerNoun: 'Client',
    jobNoun: 'Showing',
    roomNoun: 'Property',
    assignmentAgentName: 'Showing Agent',
    routingAgentName: 'Client Flow Agent',
    contactTeamLabel: 'Contact Office',
    quickActions: BOOKING_ACTIONS.map((a) => a.id === 'arrive_start' ? { ...a, label: 'Start Showing', message: 'Start this showing and review buyer notes.' } : a.id === 'complete' ? { ...a, label: 'Complete Showing', message: 'Complete this showing and prepare follow-up.' } : a),
    operatives: [
      { id: 'customer_journey', name: 'Buyer/Seller Concierge', description: 'Manages inquiries, showings, listing follow-up, and offer next steps', icon: Home, hsl: '189,100%,65%', status: 'active', metric1Label: 'Showings', metric2Label: 'Follow-ups' },
      { id: 'outreach', name: 'Listing Outreach Agent', description: 'Drafts listing promotions, open house reminders, and stale-lead recovery', icon: Sparkles, hsl: '142,72%,55%', status: 'standby', metric1Label: 'Leads', metric2Label: 'Done Today' },
    ],
    specialistShow: ['review_responder' as IndustrySpecialistOperative],
  },
  professional: { consoleTitle: 'Client Meeting Console', workerConsoleTitle: 'Consultant Console', workerLayoutTitle: 'Consultant Workspace', teamMemberNoun: 'Consultant', providerNoun: 'Consultant', customerNoun: 'Client', jobNoun: 'Meeting', roomNoun: 'Meeting Room', fieldOpsSectionLabel: 'Client Ops' },
  personal_assistant: { consoleTitle: 'Concierge Task Console', workerConsoleTitle: 'Concierge Console', workerLayoutTitle: 'Concierge Workspace', teamMemberNoun: 'Concierge', providerNoun: 'Concierge', customerNoun: 'Client', jobNoun: 'Task', roomNoun: 'Calendar Block', assignmentAgentName: 'Concierge Agent', routingAgentName: 'Task Flow Agent', fieldOpsSectionLabel: 'Concierge Ops' },
  saas_platform: {
    consoleTitle: 'Operations Console',
    consoleBadge: 'Built for SaaS teams — engagements, onboarding, and support',
    workerConsoleTitle: 'Team Console',
    workerLayoutTitle: 'Team Workspace',
    fieldOpsSectionLabel: 'Operations',
    dispatchSubItemLabel: 'Operations Map',
    workerSubItemLabel: 'Team',
    teamMemberNoun: 'Solutions Engineer',
    providerNoun: 'Solutions Engineer',
    customerNoun: 'Customer Company',
    jobNoun: 'Engagement',
    roomNoun: 'Session',
    assignmentAgentName: 'Solutions Assignment Agent',
    routingAgentName: 'Engagement Flow Agent',
    contactTeamLabel: 'Contact Solutions Team',
    fieldRouting: false,
    installAppLabel: 'Install Team App',
  },
  veterinary: {
    consoleTitle: 'Exam Schedule Console',
    consoleBadge: 'Built for exam scheduling, recalls, and patient follow-up',
    workerConsoleTitle: 'Veterinary Team Console',
    workerLayoutTitle: 'Exam Operations',
    teamMemberNoun: 'Veterinarian',
    providerNoun: 'Veterinarian',
    customerNoun: 'Pet Owner',
    jobNoun: 'Exam',
    roomNoun: 'Exam Room',
    assignmentAgentName: 'Booking Agent',
    routingAgentName: 'Exam Flow Agent',
    contactTeamLabel: 'Contact Front Desk',
    fieldOpsSectionLabel: 'Exam Ops',
    fieldRouting: false,
  },
  medical_practice: {
    consoleTitle: 'Visit Schedule Console',
    consoleBadge: 'Built for visit scheduling, patient intake, and follow-up',
    workerConsoleTitle: 'Provider Console',
    workerLayoutTitle: 'Visit Operations',
    teamMemberNoun: 'Provider',
    providerNoun: 'Provider',
    customerNoun: 'Patient',
    jobNoun: 'Visit',
    roomNoun: 'Exam Room',
    assignmentAgentName: 'Booking Agent',
    routingAgentName: 'Visit Flow Agent',
    contactTeamLabel: 'Contact Office',
    fieldOpsSectionLabel: 'Visit Ops',
    fieldRouting: false,
  },
};

function applyOverride(base: IndustryServiceConsoleConfig, override?: PartialConfig): IndustryServiceConsoleConfig {
  if (!override) return base;
  return {
    ...base,
    ...override,
    statusLabels: { ...base.statusLabels, ...(override.statusLabels || {}) },
    selectorText: { ...base.selectorText, ...(override.selectorText || {}) },
    quickActions: override.quickActions || base.quickActions,
    tabs: override.tabs || base.tabs,
    operatives: override.operatives || base.operatives,
    specialistShow: override.specialistShow || base.specialistShow,
  } as IndustryServiceConsoleConfig;
}

function normalizeDerived(config: IndustryServiceConsoleConfig, pack: IndustryPack): IndustryServiceConsoleConfig {
  const term = pack.terminology || {};
  const jobNoun = config.jobNoun || term.job || term.appointment || 'Job';
  const customerNoun = config.customerNoun || term.customer || 'Customer';
  const teamMemberNoun = config.teamMemberNoun || term.technician || term.employee || 'Team Member';
  const fieldRouting = config.fieldRouting;
  const jobNounPlural = pluralize(jobNoun);
  const openWorkRoute = fieldRouting ? '/dashboard/dispatch-field-ops' : '/dashboard/appointments';
  return {
    ...config,
    jobNoun,
    jobNounPlural,
    customerNoun,
    teamMemberNoun,
    providerNoun: config.providerNoun || teamMemberNoun,
    todayLabel: config.todayLabel || `Today's ${jobNounPlural}`,
    openWorkLabel: config.openWorkLabel || `Open ${jobNounPlural}`,
    openWorkHint: config.openWorkHint || (fieldRouting ? 'In progress + upcoming' : 'Checked in + upcoming'),
    openWorkRoute: config.openWorkRoute || openWorkRoute,
    tabs: (config.tabs || BASE_TABS).filter((t) => fieldRouting || !t.fieldOnly),
    quickActions: (config.quickActions || TRADES_ACTIONS).filter((a) => fieldRouting || !a.fieldOnly),
  };
}

export function getIndustryServiceConsoleConfig(pack: IndustryPack | null | undefined): IndustryServiceConsoleConfig {
  const safePack = pack || ({ industry_id: 'generic', cluster: 'trades', terminology: {}, console_visibility: { field_ops: 'full' } } as IndustryPack);
  const fieldRouting = hasFieldTechnicians(safePack) && safePack.console_visibility?.field_ops !== 'booking_mode' && safePack.console_visibility?.field_ops !== 'hidden';
  const base = baseConfig(safePack, fieldRouting);
  const clustered = applyOverride(base, CLUSTER_OVERRIDES[safePack.cluster]);
  const industry = applyOverride(clustered, INDUSTRY_OVERRIDES[safePack.industry_id]);
  return normalizeDerived(industry, safePack);
}

export const SERVICE_CONSOLE_INDUSTRY_IDS = Object.keys(INDUSTRY_OVERRIDES);
