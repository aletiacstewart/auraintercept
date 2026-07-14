import i18n from './i18n';
import { mergeEsOverride } from './industryMarketingContentEs';

export interface IndustrySampleAppointment {
  service: string;
  whenOffsetHours: number; // hours from now (positive = future, negative = past)
  notes: string;
}

export interface IndustrySampleLead {
  source: 'voice' | 'chat' | 'widget' | 'referral';
  intent: 'emergency' | 'quote' | 'booking' | 'inquiry';
  serviceInterest: string;
  priority: 'hot' | 'high' | 'normal';
  score: number;
}

export interface IndustryContent {
  id: string;
  label: string;
  emoji: string;
  group: string;
  hero: { headline: string; subheadline: string };
  painPoints: { title: string; description: string }[];
  sampleCalls: string[];
  sampleServices: string[];
  sampleAppointment: IndustrySampleAppointment;
  sampleLead: IndustrySampleLead;
  serviceArea: { cities: string[]; zips: string[]; address: string };
  colors: { primary: string; secondary: string };
}

const make = (
  id: string,
  label: string,
  emoji: string,
  group: string,
  hero: IndustryContent['hero'],
  painPoints: IndustryContent['painPoints'],
  sampleCalls: string[],
  sampleServices: string[],
  sampleAppointment: IndustrySampleAppointment,
  sampleLead: IndustrySampleLead,
  serviceArea: IndustryContent['serviceArea'],
  colors: IndustryContent['colors'],
): IndustryContent => ({
  id, label, emoji, group, hero, painPoints, sampleCalls, sampleServices,
  sampleAppointment, sampleLead, serviceArea, colors,
});

const AUSTIN = { cities: ['Austin', 'Round Rock', 'Cedar Park'], zips: ['78701', '78702', '78703'], address: '742 Evergreen Terrace, Austin, TX 78701' };
const DALLAS = { cities: ['Dallas', 'Plano', 'Frisco'], zips: ['75201', '75024', '75034'], address: '1820 Magnolia Ave, Dallas, TX 75201' };
const PHOENIX = { cities: ['Phoenix', 'Scottsdale', 'Tempe'], zips: ['85001', '85251', '85281'], address: '4500 Camelback Rd, Phoenix, AZ 85018' };
const HOUSTON = { cities: ['Houston', 'Katy', 'Sugar Land'], zips: ['77002', '77494', '77478'], address: '900 Bagby St, Houston, TX 77002' };
const ORLANDO = { cities: ['Orlando', 'Winter Park', 'Kissimmee'], zips: ['32801', '32789', '34741'], address: '210 Lake Eola Dr, Orlando, FL 32801' };

export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  // ─── Default (shown before user picks an industry) ───────────────
  default: make(
    'default', 'your business', '✨', 'Default',
    {
      headline: 'Smart agents. Automated service.',
      subheadline: 'Aura answers every call, text, and chat 24/7 — books jobs, dispatches the right person, and follows up with customers automatically. Pick your industry above to see a demo built for you.',
    },
    [
      { title: 'Never miss a lead', description: 'Aura answers every call, text, and chat instantly — even at 2 AM, on weekends, or when you\'re on a job.' },
      { title: 'Books jobs while you work', description: 'Quotes, schedules, and confirms appointments on the call — no back-and-forth required.' },
      { title: 'Built for your industry', description: 'Pick your trade above and Aura instantly tailors the demo, services, and conversations to match.' },
    ],
    [
      'Hi, I need to book a service appointment.',
      'Can you give me a quote for the work?',
      'What time can someone come out tomorrow?',
    ],
    ['Service Booking', 'Instant Quotes', '24/7 Answering', 'Follow-Ups', 'Customer Reminders'],
    { service: 'Service Call', whenOffsetHours: 24, notes: 'Aura captured the lead, qualified the need, and booked the appointment.' },
    { source: 'chat', intent: 'inquiry', serviceInterest: 'General Service', priority: 'normal', score: 70 },
    AUSTIN, { primary: '#00E5FF', secondary: '#46a2d3' },
  ),

  // ─── Essential Trades ─────────────────────────────────────────────
  hvac: make(
    'hvac', 'HVAC', '🔥', 'Essential Trades',
    {
      headline: 'Your AC fails at 11 PM. Aura books the job.',
      subheadline: 'Aura answers every HVAC call 24/7, books emergency service, dispatches the right tech, and follows up — without you ever picking up the phone.',
    },
    [
      { title: 'Never miss an after-hours emergency', description: 'Aura answers calls at 2 AM, qualifies the urgency, and books or escalates instantly.' },
      { title: 'Auto-route by zip code', description: 'Calls and chats route to the closest available tech based on your service area.' },
      { title: 'Maintenance plan reminders', description: 'Spring tune-ups and winter check-ups go out automatically — no spreadsheet needed.' },
    ],
    ['My furnace just stopped working and it\'s 20°F outside.', 'I need someone to look at my AC — it\'s blowing warm air.', 'Can I get a quote for a new heat pump install?'],
    ['AC Repair', 'Furnace Install', 'Duct Cleaning', 'Maintenance Plan', 'Emergency Service'],
    { service: 'AC Repair', whenOffsetHours: 22, notes: 'Customer reports warm air, unit running constantly. Bring R-410A.' },
    { source: 'voice', intent: 'emergency', serviceInterest: 'AC Repair', priority: 'hot', score: 92 },
    AUSTIN, { primary: '#0EA5E9', secondary: '#22D3EE' },
  ),
  plumbing: make(
    'plumbing', 'Plumbing', '🔧', 'Essential Trades',
    {
      headline: 'Burst pipe at midnight? Aura\'s already on it.',
      subheadline: 'Aura intercepts every plumbing call, books emergencies first, sends quotes for routine work, and texts customers ETAs automatically.',
    },
    [
      { title: 'Triage emergencies in seconds', description: 'Burst pipes get top priority. Slow drains get scheduled for tomorrow.' },
      { title: 'Instant quotes for common jobs', description: 'Drain cleaning, water heater swaps, fixture installs — quoted on the call.' },
      { title: 'No more missed leads', description: 'Every voicemail gets a callback. Every chat gets booked.' },
    ],
    ['My basement is flooding — I need someone now!', 'How much for a tankless water heater install?', 'My toilet won\'t stop running. Can you come tomorrow?'],
    ['Drain Cleaning', 'Water Heater', 'Pipe Repair', 'Fixture Install', 'Emergency Service'],
    { service: 'Water Heater', whenOffsetHours: 26, notes: '40-gal electric, no hot water since this morning. Garage install.' },
    { source: 'chat', intent: 'quote', serviceInterest: 'Tankless Water Heater', priority: 'high', score: 78 },
    HOUSTON, { primary: '#3B82F6', secondary: '#60A5FA' },
  ),
  electrical: make(
    'electrical', 'Electrical', '⚡', 'Essential Trades',
    {
      headline: 'Power\'s out. Aura books the call.',
      subheadline: 'From panel upgrades to outlet installs, Aura qualifies leads, books safely, and keeps your techs loaded with the right work.',
    },
    [
      { title: 'Filter the small jobs from the big ones', description: 'Panel upgrades and EV charger installs get prioritized over outlet replacements.' },
      { title: 'Safety-first triage', description: 'Aura recognizes "burning smell" or "sparks" and routes immediately.' },
      { title: 'Permit and inspection tracking', description: 'Customer reminders for inspections go out automatically.' },
    ],
    ['Half my house has no power. Breakers won\'t reset.', 'I need a quote for an EV charger install in my garage.', 'Can someone install three new outlets in my office?'],
    ['Panel Upgrade', 'Wiring', 'Outlet Install', 'Lighting', 'Safety Inspection'],
    { service: 'EV Charger Install', whenOffsetHours: 48, notes: 'Tesla Wall Connector, 60A circuit, garage panel has spare slots.' },
    { source: 'voice', intent: 'quote', serviceInterest: 'Panel Upgrade', priority: 'high', score: 75 },
    DALLAS, { primary: '#F59E0B', secondary: '#FBBF24' },
  ),
  solar: make('solar', 'Solar Energy', '☀️', 'Essential Trades',
    {
      headline: 'Sun\'s up. So is your lead pipeline.',
      subheadline: 'Aura qualifies solar prospects, schedules site assessments, and follows up through the long sales cycle so no homeowner slips away.',
    },
    [
      { title: 'Long-cycle nurturing on autopilot', description: 'Aura keeps prospects warm with educational follow-ups across weeks, not days.' },
      { title: 'Pre-qualify before site visits', description: 'Roof age, shading, electric bill, and ownership all confirmed before you drive out.' },
      { title: 'Permit & utility status updates', description: 'Customers get automatic milestones from contract through PTO.' },
    ],
    ['What does a 10kW system cost for a 2,000 sq ft home?', 'My electric bill is $400 — can solar help?', 'When can someone come do a roof assessment?'],
    ['Site Assessment', 'Solar Install', 'Battery Backup', 'Panel Cleaning', 'System Maintenance'],
    { service: 'Site Assessment', whenOffsetHours: 72, notes: '$380/mo bill, south-facing roof, 8 yrs old. Homeowner financing.' },
    { source: 'widget', intent: 'quote', serviceInterest: 'Solar Install', priority: 'high', score: 80 },
    PHOENIX, { primary: '#F59E0B', secondary: '#FCD34D' },
  ),
  // ─── Exterior & Structural ────────────────────────────────────────
  roofing: make(
    'roofing', 'Roofing', '🏠', 'Exterior & Structural',
    {
      headline: 'Storm hit. Aura already booked the inspections.',
      subheadline: 'After-storm surge? Aura answers every call, qualifies insurance vs cash, and fills your inspection calendar — fast.',
    },
    [
      { title: 'Storm-surge ready', description: 'Aura scales to 50+ calls an hour without dropping a single homeowner.' },
      { title: 'Insurance vs cash routing', description: 'Insurance leads route to your adjuster track; cash leads go straight to estimates.' },
      { title: 'Photo-first intake', description: 'Customers can text damage photos; Aura attaches them to the lead automatically.' },
    ],
    ['I have a leak in my ceiling after last night\'s storm.', 'Need an estimate for a full roof replacement.', 'Insurance asked for three quotes — can you come look?'],
    ['Roof Inspection', 'Storm Damage Repair', 'Full Replacement', 'Gutter Repair', 'Emergency Tarp'],
    { service: 'Roof Inspection', whenOffsetHours: 30, notes: 'Hail damage from Tuesday storm. Filed claim with State Farm.' },
    { source: 'voice', intent: 'emergency', serviceInterest: 'Storm Damage Repair', priority: 'hot', score: 90 },
    DALLAS, { primary: '#DC2626', secondary: '#F97316' },
  ),
  fencing: make('fencing', 'Fencing & Decking', '🪵', 'Exterior & Structural',
    {
      headline: 'Quote more fences. Build more decks.',
      subheadline: 'Aura qualifies linear footage, materials, and HOA constraints up front so your estimates close faster.',
    },
    [
      { title: 'Pre-qualify scope on the call', description: 'Linear feet, height, gate count, material — captured before you visit.' },
      { title: 'Seasonal booking flow', description: 'Spring rush handled with auto-scheduled walk-throughs and deposit reminders.' },
      { title: 'HOA & permit checks', description: 'Aura asks the right questions to avoid surprise rework.' },
    ],
    ['I need a quote for a 200 ft cedar privacy fence.', 'Can you build a 16x20 composite deck?', 'My fence blew down — how soon can someone look?'],
    ['Fence Install', 'Deck Build', 'Repair & Restain', 'Gate Install', 'Removal & Disposal'],
    { service: 'Site Estimate', whenOffsetHours: 30, notes: '180 lf cedar privacy, 6ft, 2 gates. HOA approval pending.' },
    { source: 'chat', intent: 'quote', serviceInterest: 'Deck Build', priority: 'high', score: 76 },
    AUSTIN, { primary: '#92400E', secondary: '#D97706' },
  ),
  // ─── Property & Estate ────────────────────────────────────────────
  landscape: make('landscape', 'Landscape & Trees', '🌳', 'Property & Estate',
    {
      headline: 'Mow more lawns. Field fewer calls.',
      subheadline: 'Aura books recurring service, quotes seasonal cleanups, and reminds customers about snow contracts before the first storm.',
    },
    [
      { title: 'Auto-book recurring service', description: 'Weekly mows, monthly tree trimming, seasonal contracts — all scheduled automatically.' },
      { title: 'Quote on the spot', description: 'Standard cleanups, mulch jobs, and fall leaf removal priced right on the call.' },
      { title: 'Storm-response outreach', description: 'Aura texts your customers before every storm to confirm service.' },
    ],
    ['I need someone to mow my lawn weekly starting next week.', 'How much for a fall cleanup on a half-acre lot?', 'Can you remove a dead oak in my front yard?'],
    ['Lawn Mowing', 'Tree Trimming', 'Landscape Design', 'Irrigation', 'Storm Cleanup'],
    { service: 'Weekly Mow', whenOffsetHours: 18, notes: 'Half-acre lot, gate code 4521. Recurring weekly Tuesdays.' },
    { source: 'widget', intent: 'booking', serviceInterest: 'Tree Removal', priority: 'high', score: 70 },
    ORLANDO, { primary: '#10B981', secondary: '#34D399' },
  ),
  pool_spa: make(
    'pool_spa', 'Pool & Spa', '🏊', 'Property & Estate',
    {
      headline: 'Crystal-clear pools. Crystal-clear calendar.',
      subheadline: 'Aura books weekly cleans, handles green-pool emergencies, and quotes equipment swaps automatically.',
    },
    [
      { title: 'Recurring service on autopilot', description: 'Weekly chemistry & cleanings book themselves and re-schedule on rainouts.' },
      { title: 'Green-pool triage', description: 'Aura recognizes algae bloom calls and prioritizes them ahead of routine.' },
      { title: 'Equipment quote in one call', description: 'Pump, filter, and heater swaps quoted with model details captured up front.' },
    ],
    ['My pool turned green overnight — help!', 'How much for a new variable-speed pump?', 'Can I switch to weekly cleaning starting next Monday?'],
    ['Weekly Cleaning', 'Chemistry Balance', 'Equipment Repair', 'Green Pool Recovery', 'Pool Opening'],
    { service: 'Green Pool Recovery', whenOffsetHours: 20, notes: '15k gal in-ground, algae bloom after storm. Customer has shock on hand.' },
    { source: 'voice', intent: 'emergency', serviceInterest: 'Green Pool Recovery', priority: 'hot', score: 88 },
    PHOENIX, { primary: '#06B6D4', secondary: '#67E8F9' },
  ),
  pest_control: make(
    'pest_control', 'Pest Control', '🐜', 'Property & Estate',
    {
      headline: 'Bugs out. Bookings in.',
      subheadline: 'Aura books one-time treatments, sells quarterly contracts, and handles "I just saw a roach" panic calls 24/7.',
    },
    [
      { title: 'Up-sell to recurring contracts', description: 'Aura offers quarterly plans on every one-time call — increase LTV automatically.' },
      { title: 'Identify the pest first', description: 'Wasps, termites, bed bugs, rodents — each routed to the right service & tech.' },
      { title: 'Re-treatment guarantees', description: 'Aura schedules guaranteed re-treats without a single phone call.' },
    ],
    ['I just saw a huge roach in my kitchen.', 'I think we have termites — there\'s sawdust by the baseboards.', 'Can I sign up for quarterly pest control?'],
    ['One-Time Treatment', 'Quarterly Plan', 'Termite Inspection', 'Bed Bug Treatment', 'Rodent Control'],
    { service: 'Quarterly Treatment', whenOffsetHours: 25, notes: '2,400 sq ft single-family. Indoor + perimeter. Pet-friendly products.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Quarterly Plan', priority: 'high', score: 73 },
    HOUSTON, { primary: '#65A30D', secondary: '#A3E635' },
  ),
  // ─── Specialized Home ─────────────────────────────────────────────
  appliance_repair: make(
    'appliance_repair', 'Appliance Repair', '🧊', 'Specialized Home',
    {
      headline: 'Fridge died. Aura dispatches.',
      subheadline: 'Aura captures make/model, symptom, and service coverage status so your technician rolls with the right part on the truck.',
    },
    [
      { title: 'Capture make + model up front', description: 'No more wasted trips — parts are already in the van.' },
      { title: 'Service coverage triage', description: 'Aura asks about active service plans or manufacturer coverage and routes covered work to your manufacturer queue.' },
      { title: 'Same-day diagnostic booking', description: 'Customers see real availability and book on the spot.' },
    ],
    ['My Whirlpool fridge stopped cooling last night.', 'Washer is making a loud banging noise.', 'My oven won\'t heat past 200°F.'],
    ['Diagnostic', 'Refrigerator Repair', 'Washer/Dryer Repair', 'Oven/Range Repair', 'Dishwasher Repair'],
    { service: 'Refrigerator Repair', whenOffsetHours: 22, notes: 'Whirlpool WRS325SDHZ, not cooling. Customer has receipts for warranty check.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Refrigerator Repair', priority: 'high', score: 76 },
    AUSTIN, { primary: '#0891B2', secondary: '#22D3EE' },
  ),
  handyman: make('handyman', 'Handyman & Cleaning', '🧹', 'Specialized Home',
    {
      headline: 'Small jobs, big calendar.',
      subheadline: 'Aura books one-off handyman tasks and recurring cleans without burying you in tiny phone calls.',
    },
    [
      { title: 'Bundle small tasks', description: 'Aura groups multiple small fixes into one efficient visit per customer.' },
      { title: 'Recurring cleaning sign-ups', description: 'Weekly, biweekly, monthly — all booked automatically with the right tech.' },
      { title: 'Photo intake for fixes', description: 'Customers text a photo; Aura attaches it to the visit so the right tools come along.' },
    ],
    ['Can someone hang three TVs and assemble a desk?', 'I need biweekly house cleaning starting this month.', 'My deep clean is for a move-out — is that ok?'],
    ['Handyman Visit', 'Recurring Cleaning', 'Deep Clean', 'Move-Out Clean', 'Furniture Assembly'],
    { service: 'Recurring Cleaning', whenOffsetHours: 20, notes: '3 bed / 2 bath, biweekly Wednesdays. Pet-friendly products. Key in lockbox.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Deep Clean', priority: 'normal', score: 65 },
    AUSTIN, { primary: '#7C3AED', secondary: '#A78BFA' },
  ),
  construction: make(
    'construction', 'Construction', '🏗️', 'Specialized Home',
    {
      headline: 'Stop chasing leads. Start closing them.',
      subheadline: 'Aura qualifies remodel and renovation leads, schedules walk-throughs, and follows up until the contract is signed.',
    },
    [
      { title: 'Qualify projects before you visit', description: 'Aura asks budget, scope, and timeline so you only drive to real opportunities.' },
      { title: 'Multi-touch follow-up', description: 'Estimates that don\'t close get nudged automatically over weeks, not days.' },
      { title: 'Project status updates', description: 'Customers get text updates at every milestone — no "what\'s the status?" calls.' },
    ],
    ['I\'m looking to remodel my kitchen — about 200 sq ft.', 'Can you put an addition on the back of my house?', 'I need painting and new flooring throughout.'],
    ['Remodeling', 'Additions', 'Painting', 'Flooring', 'Tile & Trim'],
    { service: 'Walk-Through Estimate', whenOffsetHours: 48, notes: 'Kitchen remodel ~200 sqft. Budget $40-60k. Wants quartz + soft-close.' },
    { source: 'referral', intent: 'quote', serviceInterest: 'Kitchen Remodel', priority: 'hot', score: 89 },
    DALLAS, { primary: '#8B5CF6', secondary: '#C4B5FD' },
  ),
  // ─── Mobile & Commercial ──────────────────────────────────────────
  auto_care: make(
    'auto_care', 'Auto Care', '🚗', 'Mobile & Commercial',
    {
      headline: 'Detail more cars. Answer fewer phones.',
      subheadline: 'Aura books mobile detailing, oil changes, and minor repairs around your route — and sends customers their ETA.',
    },
    [
      { title: 'Route-aware booking', description: 'Aura books new jobs near your current route so you minimize windshield time.' },
      { title: 'ETA texts on the way', description: 'Customers get a "tech is 15 min out" text — no more waiting calls.' },
      { title: 'Recurring detail packages', description: 'Monthly or quarterly detail subscriptions sold and scheduled automatically.' },
    ],
    ['Can you detail my SUV in my driveway tomorrow?', 'How much for a full ceramic coating?', 'My check-engine light just came on.'],
    ['Full Detail', 'Express Wash', 'Ceramic Coating', 'Oil Change', 'Diagnostic'],
    { service: 'Full Detail', whenOffsetHours: 24, notes: '2022 Tahoe. Interior + exterior, pet hair removal. Driveway, water access ok.' },
    { source: 'widget', intent: 'booking', serviceInterest: 'Ceramic Coating', priority: 'high', score: 74 },
    PHOENIX, { primary: '#1F2937', secondary: '#6B7280' },
  ),
  security_systems: make(
    'security_systems', 'Security Systems', '🎥', 'Mobile & Commercial',
    {
      headline: 'Cameras up. Bookings in.',
      subheadline: 'Aura quotes camera systems, alarm installs, and monitoring contracts — and re-engages window shoppers.',
    },
    [
      { title: 'Quote install + monitoring together', description: 'Aura bundles equipment + monthly monitoring on every quote.' },
      { title: 'Re-engage cold leads', description: 'Quote sent but not signed? Aura nudges automatically over 30/60/90 days.' },
      { title: 'After-break-in priority routing', description: 'Aura recognizes break-in language and routes to same-day install slots.' },
    ],
    ['Someone broke in last night — how soon can you install cameras?', 'How much for a 6-camera system with monitoring?', 'I need a quote for an alarm system on my new build.'],
    ['Camera Install', 'Alarm System', 'Monitoring', 'Smart Lock Install', 'System Upgrade'],
    { service: 'Camera Install', whenOffsetHours: 26, notes: '6 cameras + NVR + monitoring. Wired, prefer Reolink. Recent attempted break-in.' },
    { source: 'voice', intent: 'emergency', serviceInterest: 'Camera Install', priority: 'hot', score: 87 },
    HOUSTON, { primary: '#1E40AF', secondary: '#3B82F6' },
  ),
  real_estate: make(
    'real_estate', 'Real Estate', '🏢', 'Mobile & Commercial',
    {
      headline: 'Showings booked. Buyers nurtured.',
      subheadline: 'Aura qualifies buyers, books showings, and keeps your pipeline warm so you focus on closing.',
    },
    [
      { title: 'Pre-qualify before showings', description: 'Pre-approval, timeline, and price range all captured before you block your calendar.' },
      { title: 'Listing-specific intake', description: 'Aura answers questions on each property — beds, baths, HOA, taxes — pulled from your MLS.' },
      { title: 'Long-cycle nurturing', description: 'Buyers 6 months out stay engaged with neighborhood updates and saved-search alerts.' },
    ],
    ['Can I see the house on Maple Street this weekend?', 'I\'m pre-approved for $450k — what do you have?', 'Just want to know about the schools in that area.'],
    ['Showing Booking', 'Buyer Consult', 'Listing Inquiry', 'Open House RSVP', 'Market Update'],
    { service: 'Property Showing', whenOffsetHours: 30, notes: 'Buyer pre-approved $450k. Likes 4123 Maple St and 2 others nearby.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Property Showing', priority: 'high', score: 78 },
    AUSTIN, { primary: '#0F766E', secondary: '#2DD4BF' },
  ),
  // ─── Wellness & Personal ──────────────────────────────────────────
  beauty_wellness: make(
    'beauty_wellness', 'Beauty & Wellness', '💆', 'Wellness & Personal',
    {
      headline: 'Booked solid. Not on the phone.',
      subheadline: 'Aura books your salon and spa appointments by service & stylist, sends reminders, and fills last-minute cancellations.',
    },
    [
      { title: 'Service + stylist booking', description: 'Customers pick exactly the cut, color, or massage with the right professional.' },
      { title: 'Reminder texts cut no-shows', description: 'Automated 48h/24h/2h reminders reduce no-shows by half.' },
      { title: 'Fill cancellations instantly', description: 'A short-notice waitlist gets texted the second someone cancels.' },
    ],
    ['Can I book a 90-min deep tissue with Sarah next week?', 'Do you have any color appointments this Saturday?', 'How much for a balayage with cut?'],
    ['Haircut', 'Color & Highlights', 'Balayage', 'Massage', 'Facial'],
    { service: 'Color & Cut', whenOffsetHours: 28, notes: 'Balayage refresh + cut with Sarah. Has color history on file.' },
    { source: 'widget', intent: 'booking', serviceInterest: 'Color & Highlights', priority: 'high', score: 72 },
    AUSTIN, { primary: '#DB2777', secondary: '#F472B6' },
  ),
  restaurants: make(
    'restaurants', 'Restaurants', '🍽️', 'Wellness & Personal',
    {
      headline: 'Reservations & catering — handled.',
      subheadline: 'Aura takes reservations, answers menu & allergy questions, and qualifies catering & private-event leads.',
    },
    [
      { title: 'Reservation booking 24/7', description: 'Aura books tables anytime — no missed weekend bookings to voicemail.' },
      { title: 'Menu, allergen, and hours answers', description: 'Customers get instant answers without tying up your host.' },
      { title: 'Catering & event qualification', description: 'Aura captures headcount, date, dietary needs, and budget so events close faster.' },
    ],
    ['Can I reserve a table for 6 at 7:30 Saturday?', 'Do you have gluten-free options on the dinner menu?', 'Looking for catering for a 50-person office event.'],
    ['Reservation', 'Catering Quote', 'Private Event', 'Takeout Order', 'Gift Card'],
    { service: 'Reservation (party of 6)', whenOffsetHours: 26, notes: 'Birthday celebration, 1 vegetarian, 1 GF. Window booth requested.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Catering', priority: 'high', score: 75 },
    ORLANDO, { primary: '#B91C1C', secondary: '#F87171' },
  ),
  personal_assistant: make(
    'personal_assistant', 'Personal Assistant', '🤖', 'Wellness & Personal',
    {
      headline: 'A 24/7 assistant for your business.',
      subheadline: 'Aura answers, schedules, and follows up — for solo operators, consultants, and service pros who need an inbox concierge.',
    },
    [
      { title: 'Calendar-aware scheduling', description: 'Aura books meetings against your real calendar with buffers and prep time.' },
      { title: 'Inbox triage', description: 'Aura sorts, summarizes, and drafts replies to common requests.' },
      { title: 'Reminders & follow-throughs', description: 'Aura nudges you and your contacts so commitments don\'t slip.' },
    ],
    ['Can we set up a 30-min intro call next week?', 'Following up on the proposal I sent last Tuesday.', 'Need to reschedule our Thursday meeting.'],
    ['Discovery Call', 'Strategy Session', 'Follow-Up', 'Onboarding Call', 'Check-In'],
    { service: 'Discovery Call', whenOffsetHours: 26, notes: '30 min intro call. Topic: Q2 marketing strategy. Zoom link auto-sent.' },
    { source: 'referral', intent: 'booking', serviceInterest: 'Strategy Session', priority: 'high', score: 80 },
    AUSTIN, { primary: '#6366F1', secondary: '#A5B4FC' },
  ),
  // ─── Healthcare ───────────────────────────────────────────────────
  home_health: make(
    'home_health', 'Home Health Care', '🏠', 'Healthcare',
    {
      headline: 'Every referral answered. Every visit on the schedule.',
      subheadline: 'Aura intakes new patients, verifies insurance, and books skilled nursing and aide visits — 24/7, HIPAA-aware.',
    },
    [
      { title: 'Never miss a referral', description: 'Aura answers discharge planners, families, and physicians instantly — even after hours.' },
      { title: 'Insurance + intake in one call', description: 'Captures diagnosis, payer, physician orders, and emergency contact before the call ends.' },
      { title: 'Visit reminders that stick', description: 'Caregivers and patients get automatic SMS reminders the day before and morning of each visit.' },
    ],
    ['I need to set up home health for my mom after her hospital discharge.', 'Following up on the referral from Dr. Patel.', 'Can the nurse come tomorrow for wound care?'],
    ['Skilled Nursing Visit', 'Home Health Aide Visit', 'Medication Management', 'Wound Care', 'Vitals & Assessment'],
    { service: 'Skilled Nursing Visit', whenOffsetHours: 22, notes: 'New patient intake — post-discharge wound care, Medicare verified.' },
    { source: 'referral', intent: 'booking', serviceInterest: 'Skilled Nursing Visit', priority: 'hot', score: 92 },
    ORLANDO, { primary: '#0EA5E9', secondary: '#7DD3FC' },
  ),
  physical_therapy: make(
    'physical_therapy', 'Physical Therapy', '🦵', 'Healthcare',
    {
      headline: 'Keep the schedule full. Keep recovery on track.',
      subheadline: 'Aura books initial evals, runs insurance verification, and sends visit reminders so patients show up and progress stays on plan.',
    },
    [
      { title: 'Fill cancellations automatically', description: 'When a slot opens, Aura offers it to waitlisted patients by text within minutes.' },
      { title: 'Verify benefits before the first visit', description: 'Captures referral, diagnosis, and payer info — flags auth requirements upfront.' },
      { title: 'Reduce no-shows', description: 'Multi-touch reminders and easy reschedule links cut no-shows without front-desk overhead.' },
    ],
    ['I need to schedule a physical therapy evaluation for my knee.', 'Do you take Blue Cross? My doctor referred me.', 'I need to reschedule my Thursday appointment.'],
    ['Initial Evaluation', 'Follow-Up Visit', 'Re-Evaluation', 'Manual Therapy', 'Therapeutic Exercise'],
    { service: 'Initial Evaluation', whenOffsetHours: 26, notes: 'Post-op ACL — referring physician sent script, insurance verified.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Initial Evaluation', priority: 'high', score: 85 },
    DALLAS, { primary: '#0891B2', secondary: '#67E8F9' },
  ),
  occupational_therapy: make(
    'occupational_therapy', 'Occupational Therapy', '✋', 'Healthcare',
    {
      headline: 'More therapy hours. Less phone tag.',
      subheadline: 'Aura takes referrals, books evaluations, and keeps families informed — so therapists stay focused on patient care.',
    },
    [
      { title: 'Pediatric and adult intake', description: 'Aura adapts intake questions to age and diagnosis — sensory profiles, ADL goals, hand therapy.' },
      { title: 'Insurance verification on the call', description: 'Captures payer, plan, and authorization status before booking the first session.' },
      { title: 'Caregiver-friendly reminders', description: 'Parents and caregivers get clear SMS reminders with location, parking, and what to bring.' },
    ],
    ['I need to set up OT for my son — his school recommended it.', 'My hand surgeon referred me for therapy.', 'What\'s your earliest pediatric eval opening?'],
    ['Initial Evaluation', 'Pediatric OT Session', 'Hand Therapy', 'ADL Training', 'Sensory Integration'],
    { service: 'Pediatric OT Session', whenOffsetHours: 30, notes: 'Sensory processing eval — referring pediatrician, parents booked first 4 visits.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Pediatric Evaluation', priority: 'high', score: 82 },
    PHOENIX, { primary: '#14B8A6', secondary: '#5EEAD4' },
  ),
  hospice: make(
    'hospice', 'Hospice Care', '🕊', 'Healthcare',
    {
      headline: 'Compassionate intake. Coordinated care.',
      subheadline: 'Aura answers families and hospitals 24/7, captures election details, and dispatches nursing, aide, social work, and chaplain visits.',
    },
    [
      { title: 'Always available for families', description: 'Calls and texts to your hospice line are answered instantly — day, night, weekends, holidays.' },
      { title: 'Election + benefit capture', description: 'Aura gathers diagnosis, attending physician, medical director, and Medicare hospice benefit details.' },
      { title: 'Interdisciplinary scheduling', description: 'Books RN case manager, aide, social work, and chaplain visits with the right cadence per patient.' },
    ],
    ['We need to start hospice for my father — the hospital is discharging him today.', 'Following up on the referral from Sunrise Hospital.', 'Can the chaplain come this week?'],
    ['RN Case Manager Visit', 'Hospice Aide Visit', 'Social Work Visit', 'Chaplain Visit', 'Bereavement Follow-up'],
    { service: 'RN Case Manager Visit', whenOffsetHours: 18, notes: 'New admission — election signed, Medicare hospice benefit verified, family briefed.' },
    { source: 'referral', intent: 'booking', serviceInterest: 'RN Case Manager Visit', priority: 'hot', score: 95 },
    HOUSTON, { primary: '#6366F1', secondary: '#A5B4FC' },
  ),
  veterinary: make(
    'veterinary', 'Veterinary', '🐾', 'Healthcare',
    {
      headline: 'Every pet parent answered. Every exam on the books.',
      subheadline: 'Aura answers calls and texts 24/7, books wellness visits and sick exams, and sends reminders so the schedule stays full.',
    },
    [
      { title: 'Never miss a sick-pet call', description: 'Aura answers after-hours and overflow calls, triages urgency, and books or escalates instantly.' },
      { title: 'Vaccine + wellness reminders', description: 'Automatic SMS reminders for annual exams, vaccines, dentals, and refill pickups — no spreadsheet.' },
      { title: 'Fill cancellations fast', description: 'When a slot opens, Aura offers it to waitlisted patients by text within minutes.' },
    ],
    ['My dog is limping and I want to bring her in today.', 'Bella is due for her annual — what do you have this week?', 'Can I refill Max\'s heartworm prevention?'],
    ['Wellness Exam', 'Sick Visit', 'Vaccinations', 'Dental Cleaning', 'Prescription Refill'],
    { service: 'Wellness Exam', whenOffsetHours: 26, notes: 'Annual exam — Bella (Lab, 4y). Vaccines due: DHPP, Rabies.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Wellness Exam', priority: 'high', score: 82 },
    ORLANDO, { primary: '#14B8A6', secondary: '#5EEAD4' },
  ),
  medical_practice: make(
    'medical_practice', 'Private Medical Practice', '🩺', 'Healthcare',
    {
      headline: 'Patients booked. Front desk freed up.',
      subheadline: 'Aura answers patient calls 24/7, verifies insurance, books and reschedules visits, and sends reminders — so your front desk can focus on the people in the lobby.',
    },
    [
      { title: 'Never miss a new patient', description: 'Aura answers after-hours and overflow calls, captures intake, and books the first visit.' },
      { title: 'Insurance + intake on the call', description: 'Captures payer, plan, referring provider, and reason for visit before the call ends.' },
      { title: 'Cut no-shows', description: 'Multi-touch reminders and easy reschedule links keep the schedule tight without front-desk overhead.' },
    ],
    ['I\'m a new patient and need to schedule a physical.', 'Do you take Aetna? I was referred by Dr. Patel.', 'I need to reschedule my Tuesday appointment.'],
    ['New Patient Visit', 'Follow-Up Visit', 'Annual Physical', 'Telehealth Visit', 'Lab Review'],
    { service: 'New Patient Visit', whenOffsetHours: 30, notes: 'New patient intake — insurance verified, referring physician on file.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'New Patient Visit', priority: 'high', score: 84 },
    DALLAS, { primary: '#0EA5E9', secondary: '#7DD3FC' },
  ),
  // ─── Additional main-category packs (unique per MAIN_INDUSTRY_CATEGORIES) ───
  home_inspection: make(
    'home_inspection', 'Home Inspection & Safety', '🛡️', 'Specialized Home',
    { headline: 'Buyers need answers today. Aura books the inspection.', subheadline: 'Aura answers every inspection, chimney, alarm, and locksmith call 24/7 — quotes on the spot, books the walk-through, and syncs the report to the agent.' },
    [
      { title: 'Book while buyers are on the call', description: 'Aura quotes inspection tiers and locks the appointment before they call the next inspector.' },
      { title: 'Agent + buyer notifications', description: 'Auto-notify both the listing agent and buyer with time, address, and report ETA.' },
      { title: 'Radon, mold, chimney add-ons', description: 'Cross-sells the right add-ons based on property age and square footage.' },
    ],
    ['I need a home inspection before Friday closing.', 'Can you quote a chimney sweep and Level 2 inspection?', 'My alarm keeps false-triggering — can someone come look?'],
    ['Home Inspection', 'Chimney Inspection', 'Alarm Service', 'Locksmith', 'Radon Testing'],
    { service: 'Home Inspection', whenOffsetHours: 48, notes: '2,400 sqft 1998 build. Add radon + chimney Level 1. Buyer agent CC\'d.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Home Inspection', priority: 'high', score: 88 },
    DALLAS, { primary: '#0891B2', secondary: '#67E8F9' },
  ),
  pet_services: make(
    'pet_services', 'Pet & Animal Services', '🐾', 'Wellness & Personal',
    { headline: 'Every pet parent gets a real answer — instantly.', subheadline: 'Aura answers grooming, training, sitting, and mobile vet calls 24/7, books the right slot, and sends confirmations with pet notes.' },
    [
      { title: 'Full pet profile on booking', description: 'Captures breed, weight, temperament, and vaccinations before the appointment.' },
      { title: 'Recurring grooms auto-scheduled', description: 'Sets 4/6/8-week rebook cadence with reminders and easy reschedule links.' },
      { title: 'Vet triage after hours', description: 'Escalates urgent cases to the on-call vet; routine calls booked for the next day.' },
    ],
    ['I need a groom for my 45 lb goldendoodle this Saturday.', 'Can I book a training consult? He is pulling on leash.', 'My dog is limping — can I get a mobile vet visit today?'],
    ['Grooming', 'Bath & Tidy', 'Training Session', 'Pet Sitting', 'Mobile Vet Visit'],
    { service: 'Full Groom', whenOffsetHours: 30, notes: 'Goldendoodle, 45 lb, sensitive skin. Owner requests same groomer as last visit.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Grooming', priority: 'normal', score: 78 },
    ORLANDO, { primary: '#F59E0B', secondary: '#FCD34D' },
  ),
  health_wellness_inhome: make(
    'health_wellness_inhome', 'In-Home Health & Wellness', '💆', 'Wellness & Personal',
    { headline: 'Massage, PT, and wellness — booked to the doorstep.', subheadline: 'Aura books in-home massage, therapy, and wellness visits, verifies address + insurance if applicable, and dispatches the closest provider.' },
    [
      { title: 'Address + parking captured', description: 'Books with gate codes, apartment numbers, and parking notes so providers arrive ready.' },
      { title: 'Package + membership tracking', description: 'Applies remaining session credits automatically and re-sells when the pack runs low.' },
      { title: 'Insurance intake for therapy', description: 'For PT/OT visits, Aura verifies payer and referring provider before booking.' },
    ],
    ['I would like a 90-minute deep-tissue massage at my home Saturday.', 'Do you do in-home PT? I had knee surgery three weeks ago.', 'Can I use my remaining sessions for a couples massage?'],
    ['In-Home Massage', 'In-Home PT', 'Wellness Visit', 'Couples Massage', 'Recovery Session'],
    { service: '90-Minute In-Home Massage', whenOffsetHours: 36, notes: 'Deep tissue, focus on shoulders. Second-floor unit, elevator on left.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'In-Home Massage', priority: 'high', score: 85 },
    ORLANDO, { primary: '#EC4899', secondary: '#F9A8D4' },
  ),
  cleaning_restoration: make(
    'cleaning_restoration', 'Cleaning & Restoration', '🧹', 'Specialized Home',
    { headline: 'Water damage at 3 AM? Aura dispatches the crew.', subheadline: 'Aura handles house cleaning, carpet, and water/fire/mold restoration calls 24/7 — triages emergencies, quotes routine cleans, and books recurring service.' },
    [
      { title: 'Emergency water/fire triage', description: 'Escalates active-loss calls to the on-call crew and files insurance intake on the call.' },
      { title: 'Recurring cleans on autopilot', description: 'Weekly, bi-weekly, monthly clients auto-book with the same crew and preferences.' },
      { title: 'Photo-driven quotes', description: 'Texts a link so the customer can upload photos for accurate carpet / restoration quotes.' },
    ],
    ['Pipe burst in my basement — I need someone now.', 'Can I get a quote for a move-out clean, 3 bed 2 bath?', 'My carpet has red wine stains — what can you do?'],
    ['House Cleaning', 'Move-Out Clean', 'Carpet Cleaning', 'Water Mitigation', 'Mold Remediation'],
    { service: 'Emergency Water Mitigation', whenOffsetHours: 2, notes: 'Active leak, ~200 sqft affected. Bring extractor + dehumidifier. Insurance: State Farm.' },
    { source: 'voice', intent: 'emergency', serviceInterest: 'Water Mitigation', priority: 'hot', score: 96 },
    HOUSTON, { primary: '#14B8A6', secondary: '#5EEAD4' },
  ),
  moving_junk: make(
    'moving_junk', 'Moving & Junk Removal', '🚚', 'Specialized Home',
    { headline: 'Moving day is stressful. Booking it shouldn\'t be.', subheadline: 'Aura quotes moves, junk pickups, and tows on the spot using inventory + distance, then dispatches the closest crew.' },
    [
      { title: 'Instant volume-based quotes', description: 'Aura walks callers through rooms and items to produce a tight quote before hanging up.' },
      { title: 'Same-day junk + tow', description: 'Routes urgent pickups to the nearest available truck with live ETAs to the customer.' },
      { title: 'Deposit + confirmation', description: 'Sends a booking link that collects deposit and locks the crew — no ghosted jobs.' },
    ],
    ['I need movers for a 2 bed apartment on Saturday.', 'Can you haul away a couch and a fridge tomorrow?', 'My car broke down on I-35 — do you tow?'],
    ['Local Move', 'Long-Distance Move', 'Junk Removal', 'Furniture Haul-Away', 'Towing'],
    { service: 'Local Move — 2BR Apt', whenOffsetHours: 72, notes: '2BR, 3rd floor, elevator. Piano — needs 4-person crew. Deposit collected.' },
    { source: 'chat', intent: 'quote', serviceInterest: 'Local Move', priority: 'high', score: 82 },
    AUSTIN, { primary: '#F97316', secondary: '#FDBA74' },
  ),
  specialty_trades: make(
    'specialty_trades', 'Specialty Trades', '🔨', 'Specialized Home',
    { headline: 'Handyman, mason, carpenter, pool — all one number.', subheadline: 'Aura routes multi-trade calls to the right specialist, quotes small jobs on the spot, and schedules multi-visit projects with the correct trade sequence.' },
    [
      { title: 'Trade-aware dispatch', description: 'Aura identifies whether the job needs a handyman, mason, carpenter, or pool tech and routes accordingly.' },
      { title: 'Photo estimates', description: 'Texts a photo-upload link for anything more complex than a $150 fix.' },
      { title: 'Punch-list bundling', description: 'Combines several small tasks into one visit so techs stay productive.' },
    ],
    ['I need someone to hang three TVs and fix a squeaky stair.', 'Can you re-point the brick around my front porch?', 'My pool pump is making a grinding noise.'],
    ['Handyman Punch List', 'Carpentry', 'Masonry Repair', 'Pool Service', 'Custom Build'],
    { service: 'Handyman Punch List — 3 items', whenOffsetHours: 36, notes: '3 TV mounts + 1 stair repair. Homeowner has hardware; bring stud finder, drill, level.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Handyman', priority: 'normal', score: 74 },
    AUSTIN, { primary: '#8B5CF6', secondary: '#C4B5FD' },
  ),
  utility_infrastructure: make(
    'utility_infrastructure', 'Utility & Infrastructure', '🏗️', 'Essential Trades',
    { headline: 'Propane, water, utilities — dispatched 24/7.', subheadline: 'Aura answers utility contractor and delivery calls, prioritizes safety-critical issues, and schedules routine deliveries and installs.' },
    [
      { title: 'Safety-first triage', description: 'Aura recognizes gas smell, no-water, and no-power calls and escalates immediately.' },
      { title: 'Delivery auto-scheduling', description: 'Recurring propane and water customers auto-schedule based on tank telemetry or last fill.' },
      { title: 'Utility contractor dispatch', description: 'Routes commercial and municipal jobs with proper credentials and PO capture.' },
    ],
    ['I smell gas near my propane tank — please help.', 'I need a water delivery this week — 500 gallon tank.', 'Do you handle municipal utility hookups?'],
    ['Propane Delivery', 'Water Delivery', 'Utility Install', 'Commercial Service', 'Emergency Dispatch'],
    { service: 'Propane Delivery — 500 gal', whenOffsetHours: 24, notes: 'Route driver, gate code 4412, dog in yard on leash.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Propane Delivery', priority: 'high', score: 80 },
    HOUSTON, { primary: '#EAB308', secondary: '#FDE68A' },
  ),
  insurance_assessment: make(
    'insurance_assessment', 'Insurance & Assessment', '📋', 'Mobile & Commercial',
    { headline: 'Every claim call answered. Every assessment booked.', subheadline: 'Aura intakes claims, books adjuster and appraiser visits, and syncs everything to your policy or property system.' },
    [
      { title: 'Full claim intake on the call', description: 'Policy #, date of loss, cause, and photos captured before the assessment is booked.' },
      { title: 'Adjuster + appraiser routing', description: 'Dispatches the right licensed pro based on state, peril, and property type.' },
      { title: 'Carrier + insured notifications', description: 'Both carrier and insured get real-time status, ETAs, and report links.' },
    ],
    ['I need to file a wind-damage claim from Tuesday\'s storm.', 'Can you appraise my home for refinance?', 'Adjuster asked me to schedule a re-inspection.'],
    ['Claim Intake', 'Adjuster Visit', 'Home Appraisal', 'Auto Appraisal', 'Re-Inspection'],
    { service: 'Wind Damage Assessment', whenOffsetHours: 48, notes: 'Roof + fence. Policy on file, DOL 3 days ago. Adjuster credentialed for TX.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Claim Assessment', priority: 'high', score: 86 },
    DALLAS, { primary: '#4F46E5', secondary: '#A5B4FC' },
  ),
  senior_lifestyle: make(
    'senior_lifestyle', 'Senior & Lifestyle Services', '💗', 'Wellness & Personal',
    { headline: 'Compassionate answers for every senior services call.', subheadline: 'Aura books senior moves, home organizing, energy audits, and lifestyle services with patient, clear intake and family-member CCs.' },
    [
      { title: 'Patient, plain-language intake', description: 'Speaks slower, confirms details twice, and offers to loop in a family member.' },
      { title: 'Family + POA notifications', description: 'Ccs the designated family contact or POA on every confirmation.' },
      { title: 'Downsizing + move coordination', description: 'Coordinates estate sale, move, and setup as one project on the calendar.' },
    ],
    ['My mom is moving into assisted living — we need help downsizing.', 'Can you organize a 2-car garage before we list the house?', 'I would like a home energy audit for a fixed-income senior.'],
    ['Senior Move Coordination', 'Home Organizing', 'Estate Cleanout', 'Energy Audit', 'Lifestyle Concierge'],
    { service: 'Senior Move Consultation', whenOffsetHours: 48, notes: 'Downsizing 3BR to 1BR. Daughter (POA) requested to be on all comms.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Senior Move', priority: 'high', score: 83 },
    PHOENIX, { primary: '#DB2777', secondary: '#F9A8D4' },
  ),
  event_temporary: make(
    'event_temporary', 'Event & Temporary Services', '🎉', 'Wellness & Personal',
    { headline: 'Every event inquiry captured — before they call the next vendor.', subheadline: 'Aura quotes tents, party rentals, DJs, catering, and photo/video on the call, checks date availability, and locks the deposit.' },
    [
      { title: 'Instant date + package quotes', description: 'Aura checks the calendar and quotes the right package based on guest count.' },
      { title: 'Deposit-to-book flow', description: 'Sends a secure payment link on the call so the date is truly locked, not just penciled.' },
      { title: 'Vendor coordination', description: 'Loops in DJ, catering, and rentals so you deliver one turn-key experience.' },
    ],
    ['We need a 40x60 tent for a June 15 wedding — 200 guests.', 'Do you have a DJ available Saturday night?', 'Can you cater a corporate lunch for 80 next Thursday?'],
    ['Tent Rental', 'Party Rentals', 'DJ / Entertainment', 'Catering', 'Photo / Video'],
    { service: 'Tent Rental — 40x60', whenOffsetHours: 240, notes: 'Wedding 6/15, 200 guests, add lighting + dance floor. 50% deposit collected.' },
    { source: 'chat', intent: 'quote', serviceInterest: 'Tent Rental', priority: 'high', score: 87 },
    ORLANDO, { primary: '#A855F7', secondary: '#D8B4FE' },
  ),
  in_home_personal: make(
    'in_home_personal', 'In-Home Personal Services', '👥', 'Wellness & Personal',
    { headline: 'Trainer, tutor, nanny, chef — all booked in one place.', subheadline: 'Aura books in-home trainers, tutors, nannies, private chefs, and personal assistants with full intake and recurring schedules.' },
    [
      { title: 'Match by need + location', description: 'Aura matches families with the right provider based on need, schedule, and distance.' },
      { title: 'Recurring weekly schedules', description: 'Locks recurring sessions and handles reschedules/cancellations without staff overhead.' },
      { title: 'Background-check + credential capture', description: 'Verifies and stores certifications, insurance, and background checks on file.' },
    ],
    ['I need a math tutor for my 8th grader twice a week.', 'Can you find a nanny for two toddlers, MWF mornings?', 'I would like a personal chef for dinner three nights a week.'],
    ['Personal Training', 'Tutoring', 'Nanny / Sitter', 'Private Chef', 'Personal Assistant'],
    { service: 'Tutoring Session — Algebra 1', whenOffsetHours: 48, notes: '8th grader, Algebra 1 struggling. Prefers female tutor. Twice-weekly recurring.' },
    { source: 'chat', intent: 'booking', serviceInterest: 'Tutoring', priority: 'high', score: 84 },
    AUSTIN, { primary: '#0EA5E9', secondary: '#7DD3FC' },
  ),
  delivery_logistics: make(
    'delivery_logistics', 'Delivery & On-Site Logistics', '📦', 'Mobile & Commercial',
    { headline: 'Furniture, fuel, water — delivered on schedule.', subheadline: 'Aura books white-glove furniture, fuel, water, and same-day delivery jobs with instant ETAs and driver routing.' },
    [
      { title: 'Route-optimized dispatch', description: 'Aura routes drops to the nearest driver and gives the customer a live ETA.' },
      { title: 'White-glove intake', description: 'Captures stairs, elevator, hallway width, and assembly needs before dispatch.' },
      { title: 'Recurring fuel/water', description: 'Recurring customers auto-schedule based on last delivery cadence.' },
    ],
    ['I need a sectional delivered and assembled Saturday.', 'Can you top off my off-road diesel tank this week?', 'I need 300 gallons of water for a job site tomorrow.'],
    ['Furniture Delivery', 'Fuel Delivery', 'Water Delivery', 'Same-Day Courier', 'On-Site Restock'],
    { service: 'Sectional Delivery + Assembly', whenOffsetHours: 48, notes: '3rd floor, elevator OK. Assembly required, ~45 min. Text driver 15 min out.' },
    { source: 'voice', intent: 'booking', serviceInterest: 'Furniture Delivery', priority: 'normal', score: 76 },
    DALLAS, { primary: '#059669', secondary: '#6EE7B7' },
  ),
  b2b_pro_services: make(
    'b2b_pro_services', 'B2B Pro Services', '💼', 'Mobile & Commercial',
    { headline: 'Consultants + pro services — every inbound qualified.', subheadline: 'Aura qualifies B2B leads, captures scope + budget, books discovery calls on your calendar, and follows up until they respond.' },
    [
      { title: 'Discovery-call qualification', description: 'Aura asks scope, budget, timeline, and decision-maker questions before booking your time.' },
      { title: 'Calendar-native booking', description: 'Books directly on your Google/Outlook calendar with round-robin support for teams.' },
      { title: 'Multi-touch follow-up', description: 'Polite follow-ups over email + SMS until the prospect confirms or declines.' },
    ],
    ['I am looking for a consultant to help with GTM strategy.', 'We need a fractional CFO for a Series A raise.', 'Can we schedule a discovery call about a rebrand?'],
    ['Discovery Call', 'Strategy Session', 'Fractional Engagement', 'Advisory Retainer', 'Project Kickoff'],
    { service: 'Discovery Call — GTM Strategy', whenOffsetHours: 72, notes: 'Series A SaaS, $8M ARR. Qualified: budget $15k/mo, decision by month-end.' },
    { source: 'chat', intent: 'inquiry', serviceInterest: 'Consulting', priority: 'high', score: 89 },
    AUSTIN, { primary: '#4338CA', secondary: '#A5B4FC' },
  ),
  // ─── Catch-all ────────────────────────────────────────────────────
  other: make(
    'other', 'Other', '🏢', 'Other',
    {
      headline: 'Smart agents. Automated service.',
      subheadline: 'Aura answers your phones, books your jobs, and follows up with customers — 24/7, regardless of your trade.',
    },
    [
      { title: 'Never miss a call again', description: '24/7 AI answering with smart booking and dispatch.' },
      { title: 'Quote and book in one call', description: 'Aura captures all the details and gets the job on the calendar.' },
      { title: 'Follow up automatically', description: 'Estimates, reviews, and re-engagement campaigns — all hands-free.' },
    ],
    ['I\'d like to schedule service.', 'Can I get a quote for some work?', 'I need someone out as soon as possible.'],
    ['Service Calls', 'Estimates', 'Recurring Maintenance', 'Emergency Service'],
    { service: 'Service Call', whenOffsetHours: 24, notes: 'New customer intake — Aura captured contact details and need.' },
    { source: 'chat', intent: 'inquiry', serviceInterest: 'General Service', priority: 'normal', score: 60 },
    AUSTIN, { primary: '#6366F1', secondary: '#818CF8' },
  ),
};

import { filterVisibleIndustries, filterVisibleIds, isIndustryVisible } from './industryVisibility';

export const INDUSTRY_LIST = filterVisibleIndustries(Object.values(INDUSTRY_CONTENT));

const RAW_INDUSTRY_GROUPS: { group: string; emoji: string; ids: string[] }[] = [
  { group: 'Essential Trades', emoji: '⚡', ids: ['hvac', 'plumbing', 'electrical', 'solar'] },
  { group: 'Exterior & Structural', emoji: '🏠', ids: ['roofing', 'fencing'] },
  { group: 'Property & Estate', emoji: '🌿', ids: ['landscape', 'pool_spa', 'pest_control'] },
  { group: 'Specialized Home', emoji: '🛠', ids: ['appliance_repair', 'handyman', 'construction'] },
  { group: 'Mobile & Commercial', emoji: '🚗', ids: ['auto_care', 'security_systems', 'real_estate'] },
  { group: 'Wellness & Personal', emoji: '💆', ids: ['beauty_wellness', 'restaurants', 'personal_assistant'] },
  { group: 'Healthcare', emoji: '🩺', ids: ['home_health', 'physical_therapy', 'occupational_therapy', 'hospice', 'veterinary', 'medical_practice'] },
];

export const INDUSTRY_GROUPS = RAW_INDUSTRY_GROUPS
  .map((g) => ({ ...g, ids: filterVisibleIds(g.ids) }))
  .filter((g) => g.ids.length > 0);

export function getIndustryContent(id: string | null | undefined): IndustryContent {
  const base = (() => {
    if (!id) return INDUSTRY_CONTENT.other;
    if (!isIndustryVisible(id)) return INDUSTRY_CONTENT.other;
    return INDUSTRY_CONTENT[id] || INDUSTRY_CONTENT.other;
  })();

  try {
    // Read the singleton i18next language without pulling react-i18next hooks.
    if (i18n?.language?.startsWith('es')) {
      return mergeEsOverride(base, base.id);
    }
  } catch {
    /* i18n not initialized — fall back to English */
  }
  return base;
}