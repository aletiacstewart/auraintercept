export interface IndustryContent {
  id: string;
  label: string;
  emoji: string;
  hero: { headline: string; subheadline: string };
  painPoints: { title: string; description: string }[];
  sampleCalls: string[];
  sampleServices: string[];
}

export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  hvac: {
    id: 'hvac',
    label: 'HVAC',
    emoji: '🔥',
    hero: {
      headline: 'Your AC fails at 11 PM. Aura books the job.',
      subheadline: 'Aura answers every HVAC call 24/7, books emergency service, dispatches the right tech, and follows up — without you ever picking up the phone.',
    },
    painPoints: [
      { title: 'Never miss an after-hours emergency', description: 'Aura answers calls at 2 AM, qualifies the urgency, and books or escalates instantly.' },
      { title: 'Auto-route by zip code', description: 'Calls and chats route to the closest available tech based on your service area.' },
      { title: 'Maintenance plan reminders', description: 'Spring tune-ups and winter check-ups go out automatically — no spreadsheet needed.' },
    ],
    sampleCalls: [
      'My furnace just stopped working and it\'s 20°F outside.',
      'I need someone to look at my AC — it\'s blowing warm air.',
      'Can I get a quote for a new heat pump install?',
    ],
    sampleServices: ['AC Repair', 'Furnace Install', 'Duct Cleaning', 'Maintenance Plan', 'Emergency Service'],
  },
  plumbing: {
    id: 'plumbing',
    label: 'Plumbing',
    emoji: '🔧',
    hero: {
      headline: 'Burst pipe at midnight? Aura\'s already on it.',
      subheadline: 'Aura intercepts every plumbing call, books emergencies first, sends quotes for routine work, and texts customers ETAs automatically.',
    },
    painPoints: [
      { title: 'Triage emergencies in seconds', description: 'Burst pipes get top priority. Slow drains get scheduled for tomorrow.' },
      { title: 'Instant quotes for common jobs', description: 'Drain cleaning, water heater swaps, fixture installs — quoted on the call.' },
      { title: 'No more missed leads', description: 'Every voicemail gets a callback. Every chat gets booked.' },
    ],
    sampleCalls: [
      'My basement is flooding — I need someone now!',
      'How much for a tankless water heater install?',
      'My toilet won\'t stop running. Can you come tomorrow?',
    ],
    sampleServices: ['Drain Cleaning', 'Water Heater', 'Pipe Repair', 'Fixture Install', 'Emergency Service'],
  },
  electrical: {
    id: 'electrical',
    label: 'Electrical',
    emoji: '⚡',
    hero: {
      headline: 'Power\'s out. Aura books the call.',
      subheadline: 'From panel upgrades to outlet installs, Aura qualifies leads, books safely, and keeps your techs loaded with the right work.',
    },
    painPoints: [
      { title: 'Filter the small jobs from the big ones', description: 'Panel upgrades and EV charger installs get prioritized over outlet replacements.' },
      { title: 'Safety-first triage', description: 'Aura recognizes "burning smell" or "sparks" and routes immediately.' },
      { title: 'Permit and inspection tracking', description: 'Customer reminders for inspections go out automatically.' },
    ],
    sampleCalls: [
      'Half my house has no power. Breakers won\'t reset.',
      'I need a quote for an EV charger install in my garage.',
      'Can someone install three new outlets in my office?',
    ],
    sampleServices: ['Panel Upgrade', 'Wiring', 'Outlet Install', 'Lighting', 'Safety Inspection'],
  },
  general_contractor: {
    id: 'general_contractor',
    label: 'General Contractor',
    emoji: '🏗️',
    hero: {
      headline: 'Stop chasing leads. Start closing them.',
      subheadline: 'Aura qualifies remodel and renovation leads, schedules walk-throughs, and follows up until the contract is signed.',
    },
    painPoints: [
      { title: 'Qualify projects before you visit', description: 'Aura asks budget, scope, and timeline so you only drive to real opportunities.' },
      { title: 'Multi-touch follow-up', description: 'Estimates that don\'t close get nudged automatically over weeks, not days.' },
      { title: 'Project status updates', description: 'Customers get text updates at every milestone — no "what\'s the status?" calls.' },
    ],
    sampleCalls: [
      'I\'m looking to remodel my kitchen — about 200 sq ft.',
      'Can you put an addition on the back of my house?',
      'Need a quote on a new deck, around 16x20.',
    ],
    sampleServices: ['Remodeling', 'Additions', 'Roofing', 'Siding', 'Deck Building'],
  },
  landscaping: {
    id: 'landscaping',
    label: 'Landscaping',
    emoji: '🌳',
    hero: {
      headline: 'Mow more lawns. Field fewer calls.',
      subheadline: 'Aura books recurring service, quotes seasonal cleanups, and reminds customers about snow contracts before the first storm.',
    },
    painPoints: [
      { title: 'Auto-book recurring service', description: 'Weekly mows, monthly tree trimming, seasonal contracts — all scheduled automatically.' },
      { title: 'Quote on the spot', description: 'Standard cleanups, mulch jobs, and fall leaf removal priced right on the call.' },
      { title: 'Snow alert outreach', description: 'Aura texts your snow customers before every storm to confirm service.' },
    ],
    sampleCalls: [
      'I need someone to mow my lawn weekly starting next week.',
      'How much for a fall cleanup on a half-acre lot?',
      'Do you offer snow plowing contracts?',
    ],
    sampleServices: ['Lawn Mowing', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Snow Removal'],
  },
  other: {
    id: 'other',
    label: 'Other',
    emoji: '🏢',
    hero: {
      headline: 'Smart agents. Automated service.',
      subheadline: 'Aura answers your phones, books your jobs, and follows up with customers — 24/7, regardless of your trade.',
    },
    painPoints: [
      { title: 'Never miss a call again', description: '24/7 AI answering with smart booking and dispatch.' },
      { title: 'Quote and book in one call', description: 'Aura captures all the details and gets the job on the calendar.' },
      { title: 'Follow up automatically', description: 'Estimates, reviews, and re-engagement campaigns — all hands-free.' },
    ],
    sampleCalls: [
      'I\'d like to schedule service.',
      'Can I get a quote for some work?',
      'I need someone out as soon as possible.',
    ],
    sampleServices: ['Service Calls', 'Estimates', 'Recurring Maintenance', 'Emergency Service'],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRY_CONTENT);

export function getIndustryContent(id: string | null | undefined): IndustryContent {
  if (!id) return INDUSTRY_CONTENT.other;
  return INDUSTRY_CONTENT[id] || INDUSTRY_CONTENT.other;
}
