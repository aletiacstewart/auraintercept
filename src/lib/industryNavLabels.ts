import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface IndustryNavLabels {
  /** Label for the field-tech / front-line worker view in the sidebar. */
  techView: string;
  /** Label for the dispatch / scheduling map view in the sidebar. */
  dispatchView: string;
  /** Singular noun for a front-line team member (e.g. Technician, Stylist, Agent). */
  teamMemberNoun: string;
  /** Singular noun for the unit of work (e.g. Job, Appointment, Reservation). */
  jobNoun: string;
}

const CLUSTER_DEFAULTS: Record<IndustryPack['cluster'], IndustryNavLabels> = {
  trades:  { techView: 'Technician View', dispatchView: 'Dispatch View', teamMemberNoun: 'Technician', jobNoun: 'Job' },
  outdoor: { techView: 'Crew View',       dispatchView: 'Route View',    teamMemberNoun: 'Crew Member', jobNoun: 'Stop' },
  repair:  { techView: 'Technician View', dispatchView: 'Shop Queue',    teamMemberNoun: 'Technician', jobNoun: 'Ticket' },
  booking: { techView: 'Agent View',      dispatchView: 'Schedule View', teamMemberNoun: 'Team Member', jobNoun: 'Appointment' },
};

const INDUSTRY_OVERRIDES: Record<string, IndustryNavLabels> = {
  real_estate:      { techView: 'Agent View',      dispatchView: 'Listings Map',   teamMemberNoun: 'Agent',      jobNoun: 'Showing' },
  beauty_wellness:  { techView: 'Stylist View',    dispatchView: 'Chair Schedule', teamMemberNoun: 'Stylist',    jobNoun: 'Appointment' },
  salon:            { techView: 'Stylist View',    dispatchView: 'Chair Schedule', teamMemberNoun: 'Stylist',    jobNoun: 'Appointment' },
  fitness:          { techView: 'Trainer View',    dispatchView: 'Class Schedule', teamMemberNoun: 'Trainer',    jobNoun: 'Class' },
  professional:     { techView: 'Consultant View', dispatchView: 'Schedule View',  teamMemberNoun: 'Consultant', jobNoun: 'Meeting' },
  personal_assistant:{techView: 'Concierge View',  dispatchView: 'Schedule View',  teamMemberNoun: 'Concierge',  jobNoun: 'Errand' },
  restaurants:      { techView: 'Server View',     dispatchView: 'Floor Plan',     teamMemberNoun: 'Server',     jobNoun: 'Reservation' },
  auto_care:        { techView: 'Technician View', dispatchView: 'Bay Queue',      teamMemberNoun: 'Technician', jobNoun: 'Repair Order' },
  appliance_repair: { techView: 'Technician View', dispatchView: 'Service Queue',  teamMemberNoun: 'Technician', jobNoun: 'Repair Ticket' },
  mobile_mechanic:  { techView: 'Mechanic View',   dispatchView: 'Route View',     teamMemberNoun: 'Mechanic',   jobNoun: 'Service Call' },
  landscape:        { techView: 'Crew View',       dispatchView: 'Route View',     teamMemberNoun: 'Crew Member',jobNoun: 'Visit' },
  pool_spa:         { techView: 'Tech View',       dispatchView: 'Route View',     teamMemberNoun: 'Pool Tech',  jobNoun: 'Service Visit' },
  pest_control:     { techView: 'Tech View',       dispatchView: 'Route View',     teamMemberNoun: 'Pest Tech',  jobNoun: 'Treatment Visit' },
};

export function getNavLabels(pack: IndustryPack): IndustryNavLabels {
  return INDUSTRY_OVERRIDES[pack.industry_id]
      ?? CLUSTER_DEFAULTS[pack.cluster]
      ?? CLUSTER_DEFAULTS.trades;
}