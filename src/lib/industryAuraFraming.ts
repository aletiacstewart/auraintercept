import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Industry-aware framing copy for Aura's chat surfaces. Replaces generic
 * phrasing like "Aura is analyzing..." or "Trend Analysis" with vertical-aware
 * variants that pick up the active pack's nouns.
 *
 * Resolution: BY_INDUSTRY[id] -> BY_CLUSTER[cluster] -> GENERIC.
 */

export interface AuraFraming {
  /** Loading bubble text inside <AuraSummary>. */
  analyzingLabel: string;
  /** Default chart title when none is provided. */
  trendChartTitle: string;
  /** Header for "your jobs" lists. */
  jobsHeader: string;
  /** Header for "your appointments" lists. */
  appointmentsHeader: string;
  /** Empty-state line for jobs. */
  emptyJobs: string;
  /** Empty-state line for appointments. */
  emptyAppointments: string;
}

const GENERIC: AuraFraming = {
  analyzingLabel: 'Aura is analyzing...',
  trendChartTitle: 'Trend Analysis',
  jobsHeader: 'Your Jobs',
  appointmentsHeader: 'Your Appointments',
  emptyJobs: 'No jobs to show right now.',
  emptyAppointments: 'No appointments scheduled.',
};

const BY_CLUSTER: Record<IndustryPack['cluster'], Partial<AuraFraming>> = {
  trades: {
    jobsHeader: 'Your Service Jobs',
    emptyJobs: 'No active service jobs right now.',
  },
  outdoor: {
    jobsHeader: 'Your Service Visits',
    emptyJobs: 'No service visits scheduled today.',
    appointmentsHeader: 'Upcoming Visits',
    emptyAppointments: 'No upcoming visits.',
  },
  repair: {
    jobsHeader: 'Open Repair Tickets',
    emptyJobs: 'No open repair tickets.',
  },
  booking: {
    jobsHeader: 'Today\u2019s Bookings',
    emptyJobs: 'No bookings yet today.',
    appointmentsHeader: 'Upcoming Bookings',
    emptyAppointments: 'No bookings on the calendar.',
  },
  home_health: {
    jobsHeader: 'Today\u2019s Visits',
    emptyJobs: 'No patient visits scheduled today.',
    appointmentsHeader: 'Upcoming Visits',
    emptyAppointments: 'No upcoming patient visits.',
  },
};

const BY_INDUSTRY: Record<string, Partial<AuraFraming>> = {
  real_estate: {
    jobsHeader: 'Today\u2019s Showings',
    emptyJobs: 'No showings scheduled today.',
    appointmentsHeader: 'Upcoming Showings',
    emptyAppointments: 'No upcoming showings.',
    trendChartTitle: 'Listing Performance',
  },
  beauty_wellness: {
    jobsHeader: 'Today\u2019s Appointments',
    emptyJobs: 'No appointments today.',
    appointmentsHeader: 'Upcoming Appointments',
    emptyAppointments: 'No appointments booked.',
  },
  restaurants: {
    jobsHeader: 'Tonight\u2019s Reservations',
    emptyJobs: 'No reservations tonight.',
    appointmentsHeader: 'Upcoming Reservations',
    emptyAppointments: 'No reservations on the books.',
    trendChartTitle: 'Cover Trends',
  },
  auto_care: {
    jobsHeader: 'Repair Orders',
    emptyJobs: 'No open repair orders.',
  },
  personal_assistant: {
    jobsHeader: 'Open Tasks',
    emptyJobs: 'No open tasks.',
    appointmentsHeader: 'Scheduled Time Blocks',
  },
};

export function getAuraFraming(pack: IndustryPack): AuraFraming {
  return {
    ...GENERIC,
    ...(BY_CLUSTER[pack.cluster] ?? {}),
    ...(BY_INDUSTRY[pack.industry_id] ?? {}),
  };
}