/**
 * Canonical industry profile registry.
 *
 * The platform supports 185+ business types. Rather than configuring each
 * one individually, every company is tagged with a PROFILE_KEY (A–J).
 * That profile drives which consoles, AI agents, dashboard widgets, and
 * receptionist intake script the tenant sees.
 *
 * Source of truth: `AuraIntercept_Lovable_ConsoleBuildPrompt` Section 3.
 *
 * Resolution order in `useCompanyProfile`:
 *   1. `companies.profile_key` (admin/onboarding override)
 *   2. `getProfileForBusinessType(industry_vertical)` from the 185-row map
 *   3. `PROFILE_D` (safe default — solo / appointment-only)
 */

export type ProfileKey =
  | 'PROFILE_A'
  | 'PROFILE_B'
  | 'PROFILE_C'
  | 'PROFILE_D'
  | 'PROFILE_E'
  | 'PROFILE_F'
  | 'PROFILE_G'
  | 'PROFILE_H'
  | 'PROFILE_I'
  | 'PROFILE_J';

export const ALL_PROFILE_KEYS: ProfileKey[] = [
  'PROFILE_A', 'PROFILE_B', 'PROFILE_C', 'PROFILE_D', 'PROFILE_E',
  'PROFILE_F', 'PROFILE_G', 'PROFILE_H', 'PROFILE_I', 'PROFILE_J',
];

/** Sidebar consoles — C1..C7 per spec. */
export type ConsoleId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7';

/** Canonical AI agent ids used by spec. Keep in sync with `industryAgentMap`. */
export type AgentId =
  | 'ai_receptionist'
  | 'booking_agent'
  | 'follow_up_agent'
  | 'review_agent'
  | 'dispatch_gps'
  | 'route_agent'
  | 'eta_agent'
  | 'check_in_agent'
  | 'admin_agent'
  | 'quoting_agent'
  | 'invoice_agent'
  | 'inventory_agent'
  | 'campaign_agent'
  | 'lead_agent'
  | 'marketing_agent'
  | 'social_media_agent'
  | 'social_media_scheduler'
  | 'social_media_analytics'
  | 'creative_agent'
  | 'web_presence_agent'
  | 'insights_agent'
  | 'performance_agent'
  | 'revenue_agent'
  | 'forecast_agent';

export interface ProfileLabelOverrides {
  technician?: string;
  job?: string;
  quote?: string;
  /** Hide dispatch UI in shared components (sidebar already handles consoles). */
  hideDispatch?: boolean;
  /** Hide route-planning UI in shared components. */
  hideRoute?: boolean;
}

export interface ProfileSpec {
  key: ProfileKey;
  label: string;
  /** Consoles visible in sidebar. Spec uses C1..C7. */
  consoles: ConsoleId[];
  /** Agents that must be on and cannot be turned off. */
  agentsAlwaysOn: AgentId[];
  /** Default-on agents the admin can disable. */
  agentsDefaultOn: AgentId[];
  /** Agents off by default; the admin can enable them. */
  agentsDefaultOff: AgentId[];
  /** Agents fully hidden from the AI Operatives Hub. */
  agentsHidden: AgentId[];
  /** "Optional" per spec — visible but defaults to off. Alias for defaultOff. */
  agentsOptional: AgentId[];
  /** Ordered list of priority dashboard widgets. */
  dashboardWidgets: string[];
  /** Receptionist intake script id (see receptionistScripts.ts in Phase 5). */
  receptionistScriptId: string;
  labelOverrides: ProfileLabelOverrides;
  /** Plain-English description used in onboarding previews. */
  description: string;
}

const A: AgentId[] = [
  'ai_receptionist','booking_agent','follow_up_agent','review_agent',
  'dispatch_gps','route_agent','eta_agent','check_in_agent','admin_agent',
  'quoting_agent','invoice_agent','inventory_agent','campaign_agent',
  'lead_agent','marketing_agent','social_media_agent','social_media_scheduler',
  'social_media_analytics','creative_agent','web_presence_agent',
  'insights_agent','performance_agent','revenue_agent','forecast_agent',
];

function diff(all: AgentId[], remove: AgentId[]): AgentId[] {
  const set = new Set(remove);
  return all.filter((a) => !set.has(a));
}

export const PROFILE_SPECS: Record<ProfileKey, ProfileSpec> = {
  PROFILE_A: {
    key: 'PROFILE_A',
    label: 'Emergency / Dispatch Trades',
    description: 'Plumbers, HVAC, electricians, restoration — 24/7 emergency dispatch with live truck tracking.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','dispatch_gps','eta_agent'],
    agentsDefaultOn: diff(A, ['ai_receptionist','booking_agent','dispatch_gps','eta_agent']),
    agentsDefaultOff: [],
    agentsHidden: [],
    agentsOptional: [],
    dashboardWidgets: [
      'live_map','incoming_call_queue','emergency_flag_counter',
      'todays_job_board','technician_utilization','revenue_today',
      'missed_call_recovery',
    ],
    receptionistScriptId: 'emergency_dispatch_intake',
    labelOverrides: { technician: 'Technician', job: 'Job', quote: 'Quote' },
  },

  PROFILE_B: {
    key: 'PROFILE_B',
    label: 'Recurring Route-Based Services',
    description: 'Lawn care, cleaning, pest, pool — recurring stops on optimized routes; subscription model.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','route_agent'],
    agentsDefaultOn: diff(A, ['ai_receptionist','booking_agent','route_agent','inventory_agent']),
    agentsDefaultOff: [],
    agentsHidden: ['inventory_agent'],
    agentsOptional: [],
    dashboardWidgets: [
      'todays_route_map','completed_vs_remaining','subscription_status',
      'upcoming_renewals','seasonal_campaign','review_score','winback_candidates',
    ],
    receptionistScriptId: 'recurring_route_intake',
    labelOverrides: { technician: 'Crew', job: 'Stop', quote: 'Rate' },
  },

  PROFILE_C: {
    key: 'PROFILE_C',
    label: 'Project-Based Contractors',
    description: 'Remodelers, roofers, solar, custom builds — multi-visit projects with detailed estimates.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','quoting_agent'],
    agentsDefaultOn: diff(A, ['ai_receptionist','booking_agent','quoting_agent']),
    agentsDefaultOff: [],
    agentsHidden: [],
    agentsOptional: [],
    dashboardWidgets: [
      'active_projects','pending_estimates','crew_assignments_map',
      'material_inventory','revenue_pipeline','completion_rate','before_after_gallery',
    ],
    receptionistScriptId: 'project_estimate_intake',
    labelOverrides: { technician: 'Crew', job: 'Project', quote: 'Estimate' },
  },

  PROFILE_D: {
    key: 'PROFILE_D',
    label: 'Solo / Appointment-Only Services',
    description: 'Coaches, tutors, in-home wellness — single provider with a calendar; no dispatch.',
    consoles: ['C1','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent'],
    agentsDefaultOn: [
      'follow_up_agent','review_agent','admin_agent','quoting_agent',
      'invoice_agent','campaign_agent','lead_agent','marketing_agent',
      'social_media_agent','social_media_scheduler','creative_agent',
      'web_presence_agent','insights_agent','revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: ['social_media_analytics'],
    agentsHidden: ['dispatch_gps','route_agent','eta_agent','check_in_agent','inventory_agent','performance_agent'],
    agentsOptional: ['social_media_analytics'],
    dashboardWidgets: [
      'todays_appointments','pending_bookings','followup_queue',
      'review_status','revenue_this_month','availability_gaps',
    ],
    receptionistScriptId: 'appointment_intake',
    labelOverrides: { technician: 'Provider', job: 'Appointment', quote: 'Rate', hideDispatch: true, hideRoute: true },
  },

  PROFILE_E: {
    key: 'PROFILE_E',
    label: 'Real Estate & Property Services',
    description: 'Agents, brokers, property managers — lead-pipeline driven with 24/7 capture.',
    consoles: ['C1','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','lead_agent','campaign_agent'],
    agentsDefaultOn: [
      'booking_agent','follow_up_agent','review_agent','admin_agent',
      'invoice_agent','marketing_agent','social_media_agent',
      'social_media_scheduler','social_media_analytics','creative_agent',
      'web_presence_agent','insights_agent','performance_agent',
      'revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: [],
    agentsHidden: ['dispatch_gps','route_agent','eta_agent','check_in_agent','quoting_agent','inventory_agent'],
    agentsOptional: [],
    dashboardWidgets: [
      'lead_pipeline','todays_showings','lead_response_time','listing_campaigns',
      'social_post_scheduler','review_referral_tracker','revenue_closed',
    ],
    receptionistScriptId: 'real_estate_lead_intake',
    labelOverrides: { technician: 'Agent', job: 'Showing', quote: 'Agreement', hideDispatch: true, hideRoute: true },
  },

  PROFILE_F: {
    key: 'PROFILE_F',
    label: 'Delivery & On-Site Logistics',
    description: 'Movers, delivery, hauling, fuel — time-window deliveries with ETA notifications.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','dispatch_gps','route_agent','eta_agent','check_in_agent'],
    agentsDefaultOn: [
      'follow_up_agent','review_agent','admin_agent','invoice_agent',
      'campaign_agent','lead_agent','social_media_agent','social_media_scheduler',
      'creative_agent','web_presence_agent','insights_agent',
      'revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: ['quoting_agent','marketing_agent','performance_agent'],
    agentsHidden: ['inventory_agent'],
    agentsOptional: ['quoting_agent','marketing_agent','performance_agent'],
    dashboardWidgets: [
      'todays_delivery_route','delivery_windows','driver_assignments',
      'in_transit_status','eta_notification_status','proof_of_delivery','revenue_today',
    ],
    receptionistScriptId: 'delivery_window_intake',
    labelOverrides: { technician: 'Driver', job: 'Delivery', quote: 'Delivery Fee' },
  },

  PROFILE_G: {
    key: 'PROFILE_G',
    label: 'Mobile Auto Services',
    description: 'Mobile detail, oil change, tint, glass — units travel to the vehicle; menu pricing.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','route_agent','eta_agent'],
    agentsDefaultOn: diff(A, ['ai_receptionist','booking_agent','route_agent','eta_agent','inventory_agent']),
    agentsDefaultOff: [],
    agentsHidden: ['inventory_agent'],
    agentsOptional: [],
    dashboardWidgets: [
      'mobile_unit_locations','todays_appointment_map','booking_queue',
      'repeat_customers_due','review_score','revenue_by_service',
    ],
    receptionistScriptId: 'mobile_auto_intake',
    labelOverrides: { technician: 'Mobile Unit', job: 'Service', quote: 'Menu Price' },
  },

  PROFILE_H: {
    key: 'PROFILE_H',
    label: 'Pet & Animal Services',
    description: 'Groomers, walkers, mobile vets — pet-profile booking and recurring care reminders.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','review_agent'],
    agentsDefaultOn: [
      'follow_up_agent','dispatch_gps','route_agent','eta_agent','admin_agent',
      'invoice_agent','campaign_agent','lead_agent','marketing_agent',
      'social_media_agent','social_media_scheduler','creative_agent',
      'web_presence_agent','insights_agent','revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: ['check_in_agent','quoting_agent','performance_agent'],
    agentsHidden: ['inventory_agent'],
    agentsOptional: ['check_in_agent','quoting_agent','performance_agent'],
    dashboardWidgets: [
      'todays_pet_appointments','pet_profiles','route_map',
      'recurring_appointment_status','review_requests','revenue_by_service',
    ],
    receptionistScriptId: 'pet_services_intake',
    labelOverrides: { technician: 'Groomer', job: 'Appointment', quote: 'Rate' },
  },

  PROFILE_I: {
    key: 'PROFILE_I',
    label: 'Event & Temporary Services',
    description: 'DJs, caterers, rentals, planners — date-hold calendars and custom event packages.',
    consoles: ['C1','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','quoting_agent'],
    agentsDefaultOn: [
      'follow_up_agent','review_agent','admin_agent','invoice_agent',
      'campaign_agent','lead_agent','marketing_agent','social_media_agent',
      'social_media_scheduler','creative_agent','web_presence_agent',
      'insights_agent','revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: [],
    agentsHidden: ['dispatch_gps','route_agent','eta_agent','check_in_agent','inventory_agent','performance_agent'],
    agentsOptional: [],
    dashboardWidgets: [
      'event_calendar','pending_quote_approvals','deposit_payment_status',
      'upcoming_events_30day','seasonal_booking_trend','post_event_review_requests',
    ],
    receptionistScriptId: 'event_intake',
    labelOverrides: { technician: 'Vendor', job: 'Event', quote: 'Package', hideDispatch: true, hideRoute: true },
  },

  PROFILE_J: {
    key: 'PROFILE_J',
    label: 'Senior & Specialty / Crew-Required Cleanup',
    description: 'Hoarding, biohazard, estate, mold — single-site jobs with crew dispatch and sensitive intake.',
    consoles: ['C1','C2','C3','C4','C5','C6'],
    agentsAlwaysOn: ['ai_receptionist','booking_agent','dispatch_gps','quoting_agent','check_in_agent'],
    agentsDefaultOn: [
      'follow_up_agent','review_agent','eta_agent','admin_agent','invoice_agent',
      'campaign_agent','lead_agent','social_media_agent','social_media_scheduler',
      'creative_agent','web_presence_agent','insights_agent',
      'revenue_agent','forecast_agent',
    ],
    agentsDefaultOff: ['marketing_agent','performance_agent'],
    agentsHidden: ['route_agent','inventory_agent'],
    agentsOptional: ['marketing_agent','performance_agent'],
    dashboardWidgets: [
      'sensitive_job_intake','crew_assignments','active_jobs',
      'before_after_documentation','quoted_vs_invoiced','revenue_this_month',
    ],
    receptionistScriptId: 'sensitive_specialty_intake',
    labelOverrides: { technician: 'Crew', job: 'Job', quote: 'Estimate', hideRoute: true },
  },
};

export function getProfileSpec(key: ProfileKey | null | undefined): ProfileSpec {
  if (key && PROFILE_SPECS[key]) return PROFILE_SPECS[key];
  return PROFILE_SPECS.PROFILE_D;
}

/** True if this console id is enabled for the given profile. */
export function profileHasConsole(key: ProfileKey | null | undefined, consoleId: ConsoleId): boolean {
  return getProfileSpec(key).consoles.includes(consoleId);
}

/** True if an agent should be visible at all for the profile. */
export function profileShowsAgent(key: ProfileKey | null | undefined, agentId: AgentId): boolean {
  return !getProfileSpec(key).agentsHidden.includes(agentId);
}