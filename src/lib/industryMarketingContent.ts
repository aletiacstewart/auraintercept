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
    'default', 'Aura Intercept', '✨', 'Default',
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
      subheadline: 'Aura captures make/model, symptom, and warranty status so your tech rolls with the right part on the truck.',
    },
    [
      { title: 'Capture make + model up front', description: 'No more wasted trips — parts are already in the van.' },
      { title: 'Warranty triage', description: 'Aura asks for warranty status and routes warranty work to your manufacturer queue.' },
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

export const INDUSTRY_LIST = Object.values(INDUSTRY_CONTENT);

export const INDUSTRY_GROUPS: { group: string; emoji: string; ids: string[] }[] = [
  { group: 'Essential Trades', emoji: '⚡', ids: ['hvac', 'plumbing', 'electrical', 'solar_energy'] },
  { group: 'Exterior & Structural', emoji: '🏠', ids: ['roofing', 'fencing_decking'] },
  { group: 'Property & Estate', emoji: '🌿', ids: ['landscape_trees', 'pool_spa', 'pest_control'] },
  { group: 'Specialized Home', emoji: '🛠', ids: ['appliance_repair', 'handyman_cleaning', 'construction'] },
  { group: 'Mobile & Commercial', emoji: '🚗', ids: ['auto_care', 'security_systems', 'real_estate'] },
  { group: 'Wellness & Personal', emoji: '💆', ids: ['beauty_wellness', 'restaurants', 'personal_assistant'] },
];

export function getIndustryContent(id: string | null | undefined): IndustryContent {
  if (!id) return INDUSTRY_CONTENT.other;
  return INDUSTRY_CONTENT[id] || INDUSTRY_CONTENT.other;
}