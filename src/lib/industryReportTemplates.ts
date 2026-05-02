import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Industry-aware labels for the analytics export report.
 * Maps the existing report-type ids (appointments, invoices, jobs, customers,
 * revenue, feedback, reminders, social) to vertical-correct headings, plus
 * a top-level report title. Resolution: industry_id → cluster → generic.
 */

export type ReportSectionId =
  | 'appointments'
  | 'invoices'
  | 'jobs'
  | 'customers'
  | 'revenue'
  | 'feedback'
  | 'reminders'
  | 'social';

export interface IndustryReportTemplate {
  /** Top-of-PDF title. */
  reportTitle: string;
  /** Per-section heading override (omit a key to fall back to defaults). */
  sections: Partial<Record<ReportSectionId, string>>;
}

const GENERIC: IndustryReportTemplate = {
  reportTitle: 'Analytics Report',
  sections: {
    appointments: 'Appointments',
    invoices: 'Invoices',
    jobs: 'Job Assignments',
    customers: 'Customer List',
    revenue: 'Revenue Summary',
    feedback: 'Customer Feedback',
    reminders: 'Reminder Logs',
    social: 'Social Media',
  },
};

const BY_CLUSTER: Partial<Record<IndustryPack['cluster'], IndustryReportTemplate>> = {
  trades: {
    reportTitle: 'Field Operations Report',
    sections: {
      appointments: 'Service Calls',
      jobs: 'Dispatch Assignments',
      customers: 'Customer List',
      revenue: 'Revenue & Collections',
    },
  },
  outdoor: {
    reportTitle: 'Route & Visit Report',
    sections: {
      appointments: 'Visits Scheduled',
      jobs: 'Route Assignments',
      revenue: 'Revenue & Collections',
    },
  },
  repair: {
    reportTitle: 'Shop Performance Report',
    sections: {
      appointments: 'Tickets Booked',
      jobs: 'Bay Assignments',
      revenue: 'Revenue & Collections',
    },
  },
  booking: {
    reportTitle: 'Booking Performance Report',
    sections: {
      appointments: 'Bookings',
      jobs: 'Staff Assignments',
      revenue: 'Revenue Summary',
    },
  },
};

const BY_INDUSTRY: Record<string, IndustryReportTemplate> = {
  real_estate: {
    reportTitle: 'Listings & Showings Report',
    sections: {
      appointments: 'Showings',
      jobs: 'Agent Assignments',
      customers: 'Buyer & Seller Pipeline',
      revenue: 'Commissions',
      feedback: 'Showing Feedback',
    },
  },
  salon: {
    reportTitle: 'Salon Performance Report',
    sections: {
      appointments: 'Chair Bookings',
      jobs: 'Stylist Assignments',
      customers: 'Client List',
      revenue: 'Service Revenue',
      feedback: 'Client Feedback',
    },
  },
  beauty_wellness: {
    reportTitle: 'Wellness Performance Report',
    sections: {
      appointments: 'Bookings',
      jobs: 'Provider Assignments',
      revenue: 'Service Revenue',
    },
  },
  fitness: {
    reportTitle: 'Fitness Performance Report',
    sections: {
      appointments: 'Class Bookings',
      jobs: 'Trainer Assignments',
      customers: 'Member List',
      revenue: 'Membership & Class Revenue',
    },
  },
  restaurants: {
    reportTitle: 'Restaurant Performance Report',
    sections: {
      appointments: 'Reservations',
      jobs: 'Server / Host Assignments',
      customers: 'Guest List',
      revenue: 'Covers & Ticket Revenue',
      feedback: 'Guest Feedback',
    },
  },
  auto_care: {
    reportTitle: 'Auto Service Report',
    sections: {
      appointments: 'Repair Orders',
      jobs: 'Bay Assignments',
      revenue: 'Repair Revenue',
    },
  },
  professional: {
    reportTitle: 'Client Engagement Report',
    sections: {
      appointments: 'Meetings',
      jobs: 'Consultant Assignments',
      customers: 'Client List',
    },
  },
};

export function getIndustryReportTemplate(
  pack: IndustryPack | null | undefined,
): IndustryReportTemplate {
  if (!pack) return GENERIC;
  const industry = BY_INDUSTRY[pack.industry_id];
  const cluster = BY_CLUSTER[pack.cluster];
  return {
    reportTitle: industry?.reportTitle ?? cluster?.reportTitle ?? GENERIC.reportTitle,
    sections: {
      ...GENERIC.sections,
      ...(cluster?.sections ?? {}),
      ...(industry?.sections ?? {}),
    },
  };
}

export function getSectionLabel(
  pack: IndustryPack | null | undefined,
  id: ReportSectionId,
): string {
  const template = getIndustryReportTemplate(pack);
  return template.sections[id] ?? GENERIC.sections[id] ?? id;
}