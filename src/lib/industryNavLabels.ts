import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface IndustryNavLabels {
  /** Label for the field-tech / front-line worker view in the sidebar. */
  techView: string;
  /** Label for the dispatch / scheduling map view in the sidebar. */
  dispatchView: string;
}

const CLUSTER_DEFAULTS: Record<IndustryPack['cluster'], IndustryNavLabels> = {
  trades:  { techView: 'Technician View', dispatchView: 'Dispatch View' },
  outdoor: { techView: 'Crew View',       dispatchView: 'Route View' },
  repair:  { techView: 'Technician View', dispatchView: 'Shop Queue' },
  booking: { techView: 'Agent View',      dispatchView: 'Schedule View' },
};

const INDUSTRY_OVERRIDES: Record<string, IndustryNavLabels> = {
  real_estate: { techView: 'Agent View',   dispatchView: 'Listings Map' },
  salon:       { techView: 'Stylist View', dispatchView: 'Chair Schedule' },
  fitness:     { techView: 'Trainer View', dispatchView: 'Class Schedule' },
  professional:{ techView: 'Consultant View', dispatchView: 'Schedule View' },
  auto_care:   { techView: 'Technician View', dispatchView: 'Bay Queue' },
  appliance_repair: { techView: 'Technician View', dispatchView: 'Service Queue' },
  mobile_mechanic:  { techView: 'Mechanic View',   dispatchView: 'Route View' },
  landscape:   { techView: 'Crew View',  dispatchView: 'Route View' },
  pool_spa:    { techView: 'Tech View',  dispatchView: 'Route View' },
  pest_control:{ techView: 'Tech View',  dispatchView: 'Route View' },
};

export function getNavLabels(pack: IndustryPack): IndustryNavLabels {
  return INDUSTRY_OVERRIDES[pack.industry_id]
      ?? CLUSTER_DEFAULTS[pack.cluster]
      ?? CLUSTER_DEFAULTS.trades;
}