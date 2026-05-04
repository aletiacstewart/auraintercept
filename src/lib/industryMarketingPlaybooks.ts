import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface MarketingPlaybook {
  /** Short tagline shown in the console badge / header. */
  tagline: string;
  /** Primary description shown under the page title. */
  description: string;
  /** 3 named campaign playbooks Aura can suggest as starters. */
  campaigns: { title: string; description: string; command: string }[];
}

const CLUSTER: Record<IndustryPack['cluster'], MarketingPlaybook> = {
  trades: {
    tagline: '2-3x lead conversion improvement',
    description: 'AI-powered marketing automation and sales intelligence for service trades',
    campaigns: [
      { title: 'Seasonal Tune-Up Drive', description: 'Hit recurring customers before peak season',
        command: 'Build a seasonal tune-up campaign: segment recurring customers, draft an SMS + email offer, and queue for approval' },
      { title: 'Storm-Response Blast', description: 'Reach impacted customers after weather events',
        command: 'Build a storm-response campaign: target customers in affected ZIPs, draft an SMS offer, and queue for approval' },
      { title: 'Review Recovery', description: 'Turn satisfied closes into 5-star reviews',
        command: 'Find recently completed jobs without a review, draft a personalized review request for each, and queue for approval' },
    ],
  },
  outdoor: {
    tagline: 'More repeat visits per route mile',
    description: 'AI-powered marketing for recurring outdoor and property services',
    campaigns: [
      { title: 'Seasonal Service Push', description: 'Promote the next season’s recurring service',
        command: 'Build a seasonal service campaign: segment recurring customers due for the next visit, draft the offer, and queue for approval' },
      { title: 'Neighbor-Discount Outreach', description: 'Win adjacent properties on existing routes',
        command: 'For my recurring routes, draft a neighbor-discount outreach campaign for adjacent addresses and queue for approval' },
      { title: 'Storm Cleanup Sweep', description: 'Reach impacted properties after storms',
        command: 'After recent storm activity, target impacted properties with a cleanup outreach campaign and queue for approval' },
    ],
  },
  repair: {
    tagline: 'Faster ticket-to-quote conversion',
    description: 'AI-powered marketing for repair shops and ticket-based services',
    campaigns: [
      { title: 'Repair-Tip Content Series', description: 'Drive trust with how-to content',
        command: 'Build a repair-tip content series: 4 weekly posts and a paired email, and queue for approval' },
      { title: 'Stalled Quote Follow-Up', description: 'Re-engage quotes that went cold',
        command: 'Find quotes that have gone cold, draft a friendly follow-up offer for each, and queue for approval' },
      { title: 'Brand-Specific Promo', description: 'Promo for a specific brand or model line',
        command: 'Pick the most common brand in my history and draft a promo campaign for owners of that brand' },
    ],
  },
  booking: {
    tagline: 'More bookings, fewer no-shows',
    description: 'AI-powered marketing automation for booking-driven businesses',
    campaigns: [
      { title: 'New-Client Welcome', description: 'Convert first inquiries into booked clients',
        command: 'Build a new-client welcome campaign: drip 3 messages from inquiry to first booking, and queue for approval' },
      { title: 'Refer-a-Friend', description: 'Reward referrals from happy clients',
        command: 'Build a refer-a-friend campaign for my top happy clients with a clear reward, and queue for approval' },
      { title: 'Slow-Day Fill', description: 'Fill quiet windows on the calendar',
        command: 'Find this week’s slow windows and draft a flash-offer campaign to fill them, and queue for approval' },
    ],
  },
};

const OVERRIDES: Record<string, Partial<MarketingPlaybook>> = {
  hvac: { tagline: 'Capture more cooling & heating peaks',
    campaigns: [
      { title: 'Spring AC Tune-Up', description: 'Promote spring tune-ups before peak heat',
        command: 'Build a spring AC tune-up campaign: segment maintenance customers, draft SMS + email, and queue for approval' },
      { title: 'Filter Replacement Reminder', description: 'Recurring filter swap revenue',
        command: 'Build a filter replacement reminder campaign for customers due in the next 30 days and queue for approval' },
      { title: 'Heat-Wave Emergency Push', description: 'Surface 24/7 emergency availability',
        command: 'During the next forecast heat wave, push an emergency-availability campaign to my service area and queue for approval' },
    ] },
  plumbing: { tagline: 'Win more emergency calls before competitors',
    campaigns: [
      { title: 'Winter Pipe-Burst Prep', description: 'Pre-season pipe insulation outreach',
        command: 'Build a winter pipe-burst prep campaign for past customers and queue for approval' },
      { title: 'Drain Special', description: 'Recurring drain-clearing offer',
        command: 'Build a flat-rate drain-clearing special and queue for approval' },
      { title: 'Water Heater Trade-In', description: 'Promote replacement before failure',
        command: 'Target customers with water heaters older than 8 years and draft a trade-in campaign' },
    ] },
  electrical: { tagline: 'Higher-ticket panel & EV opportunities',
    campaigns: [
      { title: 'EV Charger Install', description: 'Promote home EV charger installs',
        command: 'Build an EV charger install campaign targeting EV owners in my service area and queue for approval' },
      { title: 'Panel Upgrade Awareness', description: 'Surface aging panel risks',
        command: 'Build a panel upgrade awareness campaign for older homes and queue for approval' },
      { title: 'Storm Outage Response', description: 'Generator and surge protection push',
        command: 'After the next outage event, push a generator + surge protection campaign and queue for approval' },
    ] },
  appliance_repair: { tagline: 'Win the repair-vs-replace decision',
    campaigns: [
      { title: 'Repair Tip of the Week', description: 'Build trust with brand-specific tips',
        command: 'Build a 4-week repair-tip content series and queue for approval' },
      { title: 'Brand Owner Promo', description: 'Promo for top brand in my book',
        command: 'Identify the top brand in my customer base and draft a brand-owner promo campaign' },
      { title: 'Warranty Expiry Outreach', description: 'Reach owners as warranties lapse',
        command: 'Find appliances with warranties lapsing in 60 days and draft a service-plan campaign' },
    ] },
  landscape: { tagline: 'More properties per route, more spring sign-ups',
    campaigns: [
      { title: 'Spring Sign-Up Drive', description: 'Lock in seasonal contracts early',
        command: 'Build a spring sign-up drive for recurring landscape contracts and queue for approval' },
      { title: 'Neighbor-Discount Push', description: 'Add stops on existing routes',
        command: 'Target adjacent addresses on my routes with a neighbor-discount campaign and queue for approval' },
      { title: 'Storm Cleanup Outreach', description: 'Cleanup after wind/storm events',
        command: 'After the next storm, target impacted properties with a cleanup campaign and queue for approval' },
    ] },
  pest_control: { tagline: 'Recurring plans drive predictable revenue',
    campaigns: [
      { title: 'Quarterly Plan Push', description: 'Convert one-time visits into plans',
        command: 'Find one-time pest customers and draft a quarterly plan upgrade campaign' },
      { title: 'Mosquito Season Drive', description: 'Pre-season seasonal treatment',
        command: 'Build a mosquito season campaign for residential customers and queue for approval' },
      { title: 'Termite Inspection Drive', description: 'Annual inspection reminders',
        command: 'Build a termite inspection reminder campaign for customers due this year' },
    ] },
  pool_spa: { tagline: 'Open-and-close season revenue',
    campaigns: [
      { title: 'Pool Open / Close Drive', description: 'Pre-season open/close bookings',
        command: 'Build a pool open/close season drive and queue for approval' },
      { title: 'Equipment Upgrade', description: 'Promote pump/heater upgrades',
        command: 'Target customers with aging pool equipment and draft an upgrade campaign' },
      { title: 'Chemistry Subscription', description: 'Recurring chemical delivery',
        command: 'Build a chemistry subscription campaign for self-service pool owners' },
    ] },
  roofing: { tagline: 'Storm-driven leads, organized',
    campaigns: [
      { title: 'Storm Canvass', description: 'Door-hanger + SMS for storm zones',
        command: 'Pull recent storm tracks, target impacted neighborhoods, and draft a canvass campaign' },
      { title: 'Free Inspection Drive', description: 'Promote free roof inspections',
        command: 'Build a free roof inspection drive in target ZIPs and queue for approval' },
      { title: 'Insurance Claim Assist', description: 'Educate on claim assistance',
        command: 'Build an insurance claim assist content series and queue for approval' },
    ] },
  solar: { tagline: 'Higher-intent solar leads, faster',
    campaigns: [
      { title: 'Bill-Savings Calculator', description: 'Lead magnet for solar curious',
        command: 'Build a bill-savings calculator lead magnet campaign and queue for approval' },
      { title: 'Incentive Deadline Push', description: 'Surface expiring rebates',
        command: 'Build a campaign around upcoming local rebate or tax credit deadlines' },
      { title: 'Referral Program', description: 'Solar owners refer neighbors',
        command: 'Launch a solar referral program for installed customers and queue for approval' },
    ] },
  fencing: { tagline: 'Spring season fence demand',
    campaigns: [
      { title: 'Spring Install Drive', description: 'Pre-season install promo',
        command: 'Build a spring fence install drive and queue for approval' },
      { title: 'Neighbor-Match Discount', description: 'Match the neighbor’s install',
        command: 'For each completed install, target adjacent addresses with a neighbor-match discount' },
      { title: 'HOA-Friendly Designs', description: 'Educate buyers in HOA neighborhoods',
        command: 'Build an HOA-friendly fence design content series and queue for approval' },
    ] },
  auto_care: { tagline: 'More repeat visits per active vehicle',
    campaigns: [
      { title: 'Service Reminder', description: 'Mileage and time-based reminders',
        command: 'Build a mileage/time-based service reminder campaign and queue for approval' },
      { title: 'Tire Season Push', description: 'Seasonal tire promo',
        command: 'Build a seasonal tire promo campaign and queue for approval' },
      { title: 'Inspection Drive', description: 'Annual safety/emissions reminders',
        command: 'Build an inspection reminder campaign for customers due this year' },
    ] },
  construction: { tagline: 'Bigger pipeline, cleaner bids',
    campaigns: [
      { title: 'Project Showcase', description: 'Photo-driven case studies',
        command: 'Build a project showcase content series from my completed jobs and queue for approval' },
      { title: 'Architect / GC Outreach', description: 'B2B partner pipeline',
        command: 'Draft an architect/GC partner outreach campaign and queue for approval' },
      { title: 'Design-Build Webinar', description: 'Educational webinar funnel',
        command: 'Plan a design-build educational webinar funnel and queue for approval' },
    ] },
  handyman: { tagline: 'Recurring small-job revenue',
    campaigns: [
      { title: 'Honey-Do Bundle', description: 'Bundle small jobs into one visit',
        command: 'Build a honey-do bundle campaign promoting multi-job visits and queue for approval' },
      { title: 'Recurring Clean Plan', description: 'Convert one-offs to recurring',
        command: 'Target one-time cleaning customers with a recurring plan upgrade campaign' },
      { title: 'Seasonal Checklist', description: 'Prep checklist + offer',
        command: 'Build a seasonal home-prep checklist with a paired service offer and queue for approval' },
    ] },
  security_systems: { tagline: 'Higher monitoring attach rates',
    campaigns: [
      { title: 'Monitoring Attach', description: 'Attach monitoring to recent installs',
        command: 'Find recent installs without monitoring and draft an attach campaign' },
      { title: 'Smart-Home Upsell', description: 'Promote smart device add-ons',
        command: 'Build a smart-home upsell campaign for existing customers and queue for approval' },
      { title: 'Neighborhood Watch', description: 'Neighborhood-level outreach',
        command: 'Target neighborhoods around recent installs with a watch-program campaign' },
    ] },
  real_estate: { tagline: 'More booked showings and faster offers',
    campaigns: [
      { title: 'New Listing Launch', description: 'Social + email + open house',
        command: 'For my newest listing, build a launch campaign across social and email and schedule the open house' },
      { title: 'Just-Sold Postcard', description: 'Win neighbors with proof',
        command: 'For my latest just-sold address, draft a just-sold postcard and digital ad targeting the surrounding blocks' },
      { title: 'Past-Client Touch', description: 'Annual home-value check-in',
        command: 'Build an annual home-value check-in campaign for past clients and queue for approval' },
    ] },
  beauty_wellness: { tagline: 'Fuller chairs, fewer no-shows',
    campaigns: [
      { title: 'Style Showcase', description: 'Before/after photo content',
        command: 'Build a before/after style showcase content series and queue for approval' },
      { title: 'Refer-a-Friend', description: 'Reward referrals from regulars',
        command: 'Build a refer-a-friend campaign for my regular clients and queue for approval' },
      { title: 'Slow-Day Fill', description: 'Flash offers for quiet windows',
        command: 'Find this week’s slow windows and draft a flash-offer campaign to fill them' },
    ] },
  restaurants: { tagline: 'More covers, better reviews',
    campaigns: [
      { title: 'Reservation Drive', description: 'Promote prime-time reservations',
        command: 'Build a reservation drive campaign for upcoming weekends and queue for approval' },
      { title: 'Special Event Promo', description: 'Holidays and seasonal events',
        command: 'Build a special event promo campaign for the upcoming holiday and queue for approval' },
      { title: 'Review Pulse', description: 'Lift recent review averages',
        command: 'Pull recent reviews, draft on-brand replies, and queue thank-you incentives for top reviewers' },
    ] },
  personal_assistant: { tagline: 'Higher-trust client communications',
    campaigns: [
      { title: 'Client Touchpoint', description: 'Periodic client check-ins',
        command: 'Build a periodic client touchpoint campaign for active clients and queue for approval' },
      { title: 'New-Client Onboard', description: 'Onboarding drip for new clients',
        command: 'Build a new-client onboarding drip campaign and queue for approval' },
      { title: 'Holiday Card', description: 'Holiday outreach to all clients',
        command: 'Build a holiday outreach campaign for all active clients and queue for approval' },
    ] },
  salon: { tagline: 'Fuller chairs, more rebookings',
    campaigns: [
      { title: 'Color Refresh Reminder', description: 'Recurring color/highlight reminders',
        command: 'Find clients due for a color refresh and draft a personalized SMS reminder campaign' },
      { title: 'Stylist Spotlight', description: 'Highlight a stylist with a promo',
        command: 'Build a stylist spotlight campaign featuring a stylist plus a first-time client offer and queue for approval' },
      { title: 'Refer-a-Friend', description: 'Reward referrals from regulars',
        command: 'Build a refer-a-friend campaign for my regular clients with a clear reward, and queue for approval' },
    ] },
  fitness: { tagline: 'Fewer cancellations, more retention',
    campaigns: [
      { title: 'New Member Onboarding', description: 'First-30-days drip',
        command: 'Build a new-member onboarding drip across SMS + email for the first 30 days and queue for approval' },
      { title: 'Lapsed Member Win-Back', description: 'Bring back paused/cancelled members',
        command: 'Find members who lapsed in the last 60 days and draft a win-back campaign with a returning offer' },
      { title: 'Class Fill-Up', description: 'Fill under-booked class slots',
        command: 'Find this week’s under-booked classes and draft a flash fill-up campaign for active members' },
    ] },
  professional: { tagline: 'Higher-trust client communications',
    campaigns: [
      { title: 'Quarterly Check-In', description: 'Periodic client touchpoints',
        command: 'Build a quarterly check-in campaign for active clients with one helpful tip per quarter and queue for approval' },
      { title: 'Referral Ask', description: 'Request referrals from happy clients',
        command: 'Pick clients with strong recent engagement and draft a personalized referral-ask campaign' },
      { title: 'Service Expansion', description: 'Cross-sell related services',
        command: 'Identify clients on a single service and draft a related-service expansion campaign and queue for approval' },
    ] },
  saas_platform: { tagline: 'Better activation, lower churn',
    campaigns: [
      { title: 'Trial-to-Paid Drip', description: 'Convert trials before they expire',
        command: 'Build a trial-to-paid conversion drip across email and in-app for accounts on day 3, 7, and 12' },
      { title: 'Feature Adoption', description: 'Drive usage of underused features',
        command: 'Find accounts not using key features and draft a targeted feature-adoption campaign' },
      { title: 'At-Risk Win-Back', description: 'Re-engage accounts with falling usage',
        command: 'Identify accounts with falling 30-day usage and draft a win-back outreach campaign' },
    ] },
};

export function getMarketingPlaybook(pack: IndustryPack): MarketingPlaybook {
  const base = CLUSTER[pack.cluster] ?? CLUSTER.trades;
  const ov = OVERRIDES[pack.industry_id];
  if (!ov) return base;
  return {
    tagline: ov.tagline ?? base.tagline,
    description: ov.description ?? base.description,
    campaigns: ov.campaigns ?? base.campaigns,
  };
}