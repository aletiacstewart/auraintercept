/**
 * DIY ("Build It Yourself") cost breakdown vs Aura plan pricing.
 * Rendered at the bottom of the "See More Details" collapsible on the homepage.
 *
 * All numbers are monthly USD ranges sourced from publicly listed 2025 pricing
 * for comparable U.S. tools. They are estimates — see disclaimer in the component.
 */

export interface DiyLineItem {
  label: string;
  low: number;
  high: number;
  oneTime?: boolean;
}

export interface DiyTierBreakdown {
  tierId: 'core' | 'boost' | 'pro' | 'elite';
  tierName: string;
  auraMonthly: number;
  items: DiyLineItem[];
  monthlyLow: number;
  monthlyHigh: number;
  oneTimeLow: number;
  oneTimeHigh: number;
  /** Difference between DIY midpoint and Aura monthly, expressed as savings. */
  savingsLow: number;
  savingsHigh: number;
}

const sum = (items: DiyLineItem[], key: 'low' | 'high', recurring = true) =>
  items.filter((i) => !!i.oneTime !== recurring).reduce((acc, i) => acc + i[key], 0);

const build = (
  tierId: DiyTierBreakdown['tierId'],
  tierName: string,
  auraMonthly: number,
  items: DiyLineItem[],
): DiyTierBreakdown => {
  const monthlyLow = sum(items, 'low');
  const monthlyHigh = sum(items, 'high');
  const oneTimeLow = sum(items, 'low', false);
  const oneTimeHigh = sum(items, 'high', false);
  return {
    tierId,
    tierName,
    auraMonthly,
    items,
    monthlyLow,
    monthlyHigh,
    oneTimeLow,
    oneTimeHigh,
    savingsLow: Math.max(0, monthlyLow - auraMonthly),
    savingsHigh: Math.max(0, monthlyHigh - auraMonthly),
  };
};

export const DIY_BREAKDOWN: DiyTierBreakdown[] = [
  build('core', 'Aura Core', 697, [
    { label: 'AI receptionist service (Smith.ai / Ruby tier)', low: 300, high: 900 },
    { label: 'Web chat + SMS AI bot', low: 80, high: 300 },
    { label: 'Online scheduling tool', low: 20, high: 60 },
    { label: 'Website + landing page builder', low: 25, high: 75 },
    { label: 'Email marketing tool (Mailchimp/Klaviyo)', low: 30, high: 120 },
    { label: 'Basic social posting (Buffer/Hootsuite)', low: 15, high: 45 },
    { label: 'Basic analytics dashboard', low: 0, high: 70 },
    { label: 'Setup contractor (one-time)', low: 1500, high: 4000, oneTime: true },
  ]),
  build('boost', 'Aura Boost', 1097, [
    { label: 'Everything in Core stack', low: 470, high: 1570 },
    { label: 'Dispatch software (Housecall Pro / Jobber)', low: 99, high: 400 },
    { label: 'Route optimization (Onfleet / Routific)', low: 40, high: 150 },
    { label: 'Technician mobile + GPS (5 techs)', low: 125, high: 400 },
    { label: 'A2P 10DLC SMS upgrade', low: 20, high: 80 },
    { label: 'Zapier / Make integrations', low: 50, high: 150 },
    { label: 'Setup contractor (one-time)', low: 1500, high: 4000, oneTime: true },
  ]),
  build('pro', 'Aura Pro', 1997, [
    { label: 'Everything in Boost stack', low: 800, high: 2750 },
    { label: 'CRM (HubSpot Pro / Salesforce)', low: 450, high: 1200 },
    { label: 'Marketing automation (ActiveCampaign / Marketo Engage)', low: 200, high: 600 },
    { label: 'Review platform (Birdeye / Podium)', low: 300, high: 600 },
    { label: 'Content tools (Jasper / Copy.ai)', low: 50, high: 200 },
    { label: 'AI contractor retainer', low: 500, high: 1500 },
    { label: 'Setup + integration build (one-time)', low: 5000, high: 12000, oneTime: true },
  ]),
  build('elite', 'Aura Elite', 3497, [
    { label: 'Everything in Pro stack', low: 2300, high: 6850 },
    { label: 'Enterprise voice AI (custom build)', low: 400, high: 1500 },
    { label: 'Invoice + billing automation', low: 200, high: 500 },
    { label: 'BI suite (Tableau / Power BI)', low: 150, high: 500 },
    { label: 'Fractional AI engineer', low: 1500, high: 2500 },
    { label: 'White-label portal (amortized)', low: 300, high: 800 },
    { label: 'Enterprise integration project (one-time)', low: 15000, high: 40000, oneTime: true },
  ]),
];

export const DIY_DISCLAIMER =
  "Estimates based on publicly listed 2025 pricing for comparable tools and U.S. market rates. Actual costs vary by vendor, volume, region, and feature mix. Aura's per-tier price excludes 3rd-party usage fees (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC) — those are billed directly by each provider on either path.";