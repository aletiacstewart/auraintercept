import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD = 'aidemo*!';

type TierKey = 'core' | 'boost' | 'pro' | 'elite';

interface IndustryDef {
  key: string;            // industry_id (matches industry_template_packs)
  label: string;          // human-readable
  tier: TierKey;
  internalTier: string;   // companies.subscription_tier value
  primary: string;
  secondary: string;
  services: string[];
  inventory: Array<{ name: string; sku: string; quantity: number; min_quantity: number; unit_cost: number; category: string }> | null;
  blog: Array<{ title: string; excerpt: string; content: string }>;
  campaigns: Array<{ name: string; promo_code: string; discount_value: number; message: string; subject: string }>;
}

// Tier agent sets — must match supabase/functions/initialize-company-agents
// and src/lib/subscriptionAgentConfig.ts TIER_AGENT_CONFIG. Consolidated
// operative IDs drive UI gating; legacy aliases are seeded so older code
// paths still find rows.
const CORE_OPERATIVES = ['triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence'];
const FIELD_OPERATIVES = ['dispatch', 'field_navigation'];
const BUSINESS_OPERATIVES = ['business_finance', 'analytics_intelligence', 'admin'];
const LEGACY_FOR_CORE = ['booking', 'followup', 'review', 'lead', 'marketing'];
const LEGACY_FOR_FIELD = ['route', 'eta', 'checkin'];
const LEGACY_FOR_BUSINESS = ['quoting', 'invoice', 'inventory', 'campaign', 'social_scheduler', 'social_analytics', 'insights', 'performance', 'revenue', 'forecast'];

const TIER_AGENTS: Record<TierKey, string[]> = {
  core:  [...CORE_OPERATIVES, ...LEGACY_FOR_CORE],
  boost: [...CORE_OPERATIVES, ...FIELD_OPERATIVES, ...LEGACY_FOR_CORE, ...LEGACY_FOR_FIELD],
  pro: [
    ...CORE_OPERATIVES, ...FIELD_OPERATIVES, ...BUSINESS_OPERATIVES,
    ...LEGACY_FOR_CORE, ...LEGACY_FOR_FIELD, ...LEGACY_FOR_BUSINESS,
  ],
  elite: [
    ...CORE_OPERATIVES, ...FIELD_OPERATIVES, ...BUSINESS_OPERATIVES,
    ...LEGACY_FOR_CORE, ...LEGACY_FOR_FIELD, ...LEGACY_FOR_BUSINESS,
  ],
};

const TIER_INTERNAL: Record<TierKey, string> = {
  core: 'starter', boost: 'connect', pro: 'performance', elite: 'command',
};

const TIER_COLORS: Record<TierKey, [string, string]> = {
  core:  ['#0EA5E9', '#22D3EE'],
  boost: ['#8B5CF6', '#A78BFA'],
  pro:   ['#F59E0B', '#FBBF24'],
  elite: ['#EF4444', '#F87171'],
};

// 21 industries — tier mapping curated so each demo showcases the correct console for its industry:
//   CORE  (7): beauty_wellness, restaurants, real_estate, personal_assistant, physical_therapy, occupational_therapy, hospice
//   BOOST (5): handyman, auto_care, appliance_repair, pest_control, fencing
//   PRO   (4): security_systems, pool_spa, landscape, solar
//   ELITE (5): hvac, electrical, plumbing, roofing, construction
const INDUSTRIES: IndustryDef[] = [
  // CORE (5)
  industry('hvac', 'HVAC', 'elite',
    ['AC Tune-Up','Furnace Repair','Heat Pump Install','Duct Cleaning','Thermostat Upgrade'],
    [
      { name: 'Air Filter 16x25x1', sku: 'AF-16251', quantity: 42, min_quantity: 20, unit_cost: 8.99, category: 'HVAC' },
      { name: 'R-410A Refrigerant (lb)', sku: 'R410A-LB', quantity: 8, min_quantity: 15, unit_cost: 12.0, category: 'HVAC' },
      { name: 'Smart Thermostat', sku: 'TH-SMART', quantity: 12, min_quantity: 5, unit_cost: 145.0, category: 'HVAC' },
    ],
    [
      { title: '5 Signs Your AC Needs Service Before Summer', excerpt: 'Catch issues early and beat the heat.', content: '## Signs to watch for\n\nWeak airflow, strange noises, rising bills, uneven cooling, frequent cycling.' },
      { title: 'How Smart Thermostats Save You Money', excerpt: 'Modern thermostats pay for themselves in under a year.', content: '## The math\n\nA programmable thermostat reduces HVAC energy use by 10-15%, saving $180+/year.' },
      { title: 'Furnace Maintenance Checklist for Winter', excerpt: 'A pre-season tune-up keeps you safe and warm.', content: '## Annual checklist\n\nReplace filter, inspect heat exchanger, test thermostat, check CO levels.' },
    ],
    [
      { name: 'Spring Tune-Up Promo', promo_code: 'SPRING15', discount_value: 15, message: 'Get 15% off your spring HVAC tune-up! Book today.', subject: 'Spring Savings: 15% Off Tune-Ups' },
      { name: 'Win-Back Past Customers', promo_code: 'COMEBACK50', discount_value: 50, message: 'We miss you! $50 off your next service.', subject: 'We Miss You — $50 Off' },
    ],
  ),
  industry('electrical', 'Electrical', 'elite',
    ['Panel Upgrade','Outlet Installation','EV Charger Install','Whole-Home Surge Protection','Lighting Retrofit'],
    [
      { name: '20A Circuit Breaker', sku: 'CB-20A', quantity: 35, min_quantity: 10, unit_cost: 14.5, category: 'Electrical' },
      { name: '14/2 Romex Wire (250ft)', sku: 'RX-142-250', quantity: 6, min_quantity: 5, unit_cost: 89.0, category: 'Electrical' },
      { name: 'GFCI Outlet', sku: 'GFCI-15A', quantity: 28, min_quantity: 12, unit_cost: 16.0, category: 'Electrical' },
    ],
    [
      { title: 'When to Upgrade Your Electrical Panel', excerpt: 'Older panels can be a fire hazard. Here are the signs.', content: '## Warning signs\n\nFlickering lights, warm breakers, frequent trips, knob-and-tube wiring.' },
      { title: 'EV Charger Installation: What to Expect', excerpt: 'Level-2 chargers cut charge time from 24h to 6h.', content: '## Process\n\nLoad calc, panel review, 240V circuit, smart charger commissioning.' },
      { title: 'Surge Protection 101', excerpt: 'One lightning strike can fry every electronic in your home.', content: '## Layered protection\n\nWhole-home surge at the panel + point-of-use strips for sensitive gear.' },
    ],
    [
      { name: 'EV Charger Install Promo', promo_code: 'EVCHARGE100', discount_value: 100, message: '$100 off Level-2 EV charger installation this month.', subject: 'Drive Electric — $100 Off Install' },
      { name: 'Safety Inspection Bundle', promo_code: 'SAFE25', discount_value: 25, message: 'Bundle a panel + outlet inspection and save 25%.', subject: 'Whole-Home Safety Inspection — 25% Off' },
    ],
  ),
  industry('handyman', 'Handyman & Cleaning', 'boost',
    ['Drywall Repair','TV Mounting','Furniture Assembly','Deep Clean','Gutter Cleaning'],
    [
      { name: 'Drywall Patch Kit', sku: 'DW-PATCH', quantity: 18, min_quantity: 6, unit_cost: 12.5, category: 'Repair' },
      { name: 'All-Purpose Cleaner (Gal)', sku: 'CLN-APC', quantity: 24, min_quantity: 8, unit_cost: 9.0, category: 'Cleaning' },
      { name: 'Microfiber Cloth (50pk)', sku: 'MF-50', quantity: 14, min_quantity: 5, unit_cost: 18.0, category: 'Cleaning' },
    ],
    [
      { title: 'Spring Cleaning Checklist for Busy Homes', excerpt: 'Knock out the whole house in one weekend.', content: '## Room by room\n\nKitchen first (deepest grime), then bathrooms, then living areas.' },
      { title: 'TV Mount Heights — Get It Right the First Time', excerpt: 'Eye level when seated, not standing.', content: '## The 42" rule\n\nCenter of TV at 42" from the floor for most living rooms.' },
      { title: 'When to Hire a Pro vs DIY', excerpt: 'Some jobs are worth the call. Others aren\'t.', content: '## Quick rule\n\nIf it touches plumbing, electrical, or load-bearing — call us.' },
    ],
    [
      { name: 'Spring Deep Clean Special', promo_code: 'CLEAN20', discount_value: 20, message: 'Spring deep-clean — 20% off your first booking.', subject: 'Spring Refresh — 20% Off Deep Cleans' },
      { name: 'Bundle & Save', promo_code: 'BUNDLE15', discount_value: 15, message: 'Book 3 small jobs in one visit — save 15%.', subject: 'Save 15% With a Multi-Task Visit' },
    ],
  ),
  industry('auto_care', 'Auto Care', 'boost',
    ['Oil Change','Brake Service','Tire Rotation','Battery Replacement','State Inspection'],
    [
      { name: '5W-30 Synthetic Oil (qt)', sku: 'OIL-5W30', quantity: 60, min_quantity: 24, unit_cost: 6.5, category: 'Fluids' },
      { name: 'Brake Pads (Front Set)', sku: 'BP-FR', quantity: 16, min_quantity: 6, unit_cost: 38.0, category: 'Brakes' },
      { name: '12V Battery Group 35', sku: 'BAT-G35', quantity: 9, min_quantity: 3, unit_cost: 119.0, category: 'Electrical' },
    ],
    [
      { title: 'How Often Should You Really Change Your Oil?', excerpt: 'The 3,000-mile rule is dead. Here\'s the truth.', content: '## Modern intervals\n\nFull synthetic: 7,500–10,000 miles. Conventional: 5,000.' },
      { title: 'Brake Warning Signs You Shouldn\'t Ignore', excerpt: 'Squealing is just the start.', content: '## Five signs\n\nSqueal, grind, pull, soft pedal, dashboard light.' },
      { title: 'Why Tire Rotation Matters', excerpt: 'Skip it and replace tires twice as often.', content: '## Every 5,000 miles\n\nRotation evens wear and adds 10–15k miles to tire life.' },
    ],
    [
      { name: 'Oil Change + Inspection Combo', promo_code: 'OIL10', discount_value: 10, message: 'Oil change + 27-point inspection — $10 off this week.', subject: '$10 Off Oil + Inspection' },
      { name: 'Brake Special', promo_code: 'BRAKE40', discount_value: 40, message: 'Front brake pads + rotor turn — $40 off.', subject: 'Brake Service — $40 Off' },
    ],
  ),
  industry('appliance_repair', 'Appliance Repair', 'boost',
    ['Refrigerator Repair','Washer Repair','Dryer Repair','Oven Repair','Dishwasher Repair'],
    [
      { name: 'Universal Drain Pump', sku: 'AP-DP-U', quantity: 14, min_quantity: 5, unit_cost: 42.0, category: 'Parts' },
      { name: 'Heating Element (Dryer)', sku: 'AP-HE-D', quantity: 8, min_quantity: 3, unit_cost: 58.0, category: 'Parts' },
      { name: 'Door Gasket (Fridge)', sku: 'AP-DG-F', quantity: 6, min_quantity: 2, unit_cost: 95.0, category: 'Parts' },
    ],
    [
      { title: 'Repair vs Replace: The 50% Rule', excerpt: 'When repair makes sense — and when it doesn\'t.', content: '## The math\n\nIf repair is >50% of replacement and unit is >half its lifespan, replace.' },
      { title: 'Top 5 Reasons Your Dishwasher Isn\'t Cleaning', excerpt: 'Usually a 10-minute fix.', content: '## Quick checks\n\nSpray arm clogged, filter dirty, water inlet, detergent hardness, rinse aid.' },
      { title: 'Why Your Dryer Takes 2 Cycles to Dry', excerpt: 'It\'s almost always one of three things.', content: '## Diagnostic\n\nVent blockage, heating element, moisture sensor.' },
    ],
    [
      { name: 'Diagnostic Fee Waived', promo_code: 'DIAG0', discount_value: 89, message: 'Book any repair this month and we waive the $89 diagnostic.', subject: 'Free Diagnostic With Any Repair' },
      { name: 'Same-Day Service Push', promo_code: 'SAMEDAY', discount_value: 25, message: 'Same-day appointments — $25 off this week only.', subject: 'Same-Day Repair — $25 Off' },
    ],
  ),
  // BOOST (5)
  industry('plumbing', 'Plumbing', 'elite',
    ['Leak Repair','Drain Cleaning','Water Heater Install','Toilet Replacement','Sewer Line Inspection'],
    [
      { name: '1" Copper Pipe (10ft)', sku: 'CP-1-10', quantity: 24, min_quantity: 10, unit_cost: 18.5, category: 'Plumbing' },
      { name: 'PVC Elbow 90°', sku: 'PVC-E90', quantity: 156, min_quantity: 50, unit_cost: 1.25, category: 'Plumbing' },
      { name: 'Drain Snake 25ft', sku: 'DS-25', quantity: 4, min_quantity: 2, unit_cost: 65.0, category: 'Plumbing' },
    ],
    [
      { title: 'Plumbing Emergencies: What to Do First', excerpt: 'A quick playbook before the plumber arrives.', content: '## Step 1: Shut off water\n\nKnow where your main valve is. Then call us.' },
      { title: 'Tankless vs Tank Water Heaters', excerpt: 'Pros, cons, and ROI.', content: '## Quick take\n\nTankless: 20+ year life, infinite hot water, 30% energy savings, 2x install cost.' },
      { title: '5 Signs You Need a Sewer Line Inspection', excerpt: 'A camera scope today saves a backyard excavation tomorrow.', content: '## Red flags\n\nMultiple slow drains, gurgling toilets, soggy yard spots, sewer smell.' },
    ],
    [
      { name: 'Drain Special', promo_code: 'DRAIN49', discount_value: 30, message: '$30 off any drain cleaning service this month.', subject: '$30 Off Drain Cleaning' },
      { name: 'Water Heater Replacement Promo', promo_code: 'WH200', discount_value: 200, message: '$200 off tankless water heater installation.', subject: 'Tankless Upgrade — $200 Off' },
    ],
  ),
  industry('pool_spa', 'Pool & Spa', 'pro',
    ['Weekly Pool Cleaning','Equipment Repair','Acid Wash','Spa Tune-Up','Liner Replacement'],
    [
      { name: 'Chlorine Tabs (50lb)', sku: 'CHL-50', quantity: 12, min_quantity: 4, unit_cost: 165.0, category: 'Chemicals' },
      { name: 'Pool Filter Cartridge', sku: 'PF-C100', quantity: 8, min_quantity: 3, unit_cost: 78.0, category: 'Equipment' },
      { name: 'pH Reducer (Gal)', sku: 'PH-RED', quantity: 18, min_quantity: 6, unit_cost: 14.0, category: 'Chemicals' },
    ],
    [
      { title: 'Opening Your Pool: Spring Checklist', excerpt: 'Hit the water clean and clear in one weekend.', content: '## 7-step opening\n\nRemove cover, clean, fill, prime pump, shock, balance, vacuum.' },
      { title: 'Why Your Pool Keeps Going Cloudy', excerpt: 'It\'s usually one of three culprits.', content: '## Common causes\n\nLow chlorine, bad filtration, high pH/calcium.' },
      { title: 'Spa Maintenance: Weekly Routine', excerpt: '15 minutes a week saves a $400 service call.', content: '## Weekly\n\nCheck pH/sanitizer, rinse filter, wipe waterline, drain quarterly.' },
    ],
    [
      { name: 'Pool Opening Special', promo_code: 'OPEN50', discount_value: 50, message: 'Pool opening — $50 off this month.', subject: 'Pool Season Is Here — $50 Off Opening' },
      { name: 'Annual Service Plan', promo_code: 'PLAN10', discount_value: 10, message: 'Annual pool service plan — 10% off when you sign up before May.', subject: 'Save 10% on Annual Pool Care' },
    ],
  ),
  industry('pest_control', 'Pest Control', 'boost',
    ['General Pest Treatment','Termite Inspection','Rodent Exclusion','Mosquito Treatment','Bed Bug Treatment'],
    [
      { name: 'Bifen IT Concentrate (qt)', sku: 'BIF-QT', quantity: 10, min_quantity: 4, unit_cost: 48.0, category: 'Chemicals' },
      { name: 'Glue Boards (24pk)', sku: 'GB-24', quantity: 22, min_quantity: 8, unit_cost: 18.0, category: 'Traps' },
      { name: 'Bait Stations', sku: 'BS-T1', quantity: 40, min_quantity: 15, unit_cost: 9.5, category: 'Traps' },
    ],
    [
      { title: 'Spring Pest Prep: 5 Things to Do Now', excerpt: 'Stop infestations before they start.', content: '## Prep checklist\n\nSeal cracks, trim shrubs from house, dehumidify crawl spaces.' },
      { title: 'Termite Warning Signs', excerpt: 'A termite colony can cause $3,000+ in damage before you see it.', content: '## What to look for\n\nMud tubes, hollow wood, swarmer wings near windowsills.' },
      { title: 'Mosquito Control That Actually Works', excerpt: 'Why one fogging beats 10 candles.', content: '## The science\n\nResidual barrier sprays cut mosquito populations 80%+ for 21 days.' },
    ],
    [
      { name: 'Quarterly Plan Promo', promo_code: 'QTR99', discount_value: 30, message: 'Sign up for quarterly pest service — first treatment $99.', subject: 'Quarterly Pest Plan — First Visit $99' },
      { name: 'Mosquito Season Special', promo_code: 'SKEET25', discount_value: 25, message: '25% off your first mosquito treatment.', subject: 'Take Back the Backyard — 25% Off' },
    ],
  ),
  industry('landscape', 'Landscape & Trees', 'pro',
    ['Lawn Maintenance','Tree Pruning','Mulch Install','Irrigation Repair','Fall Cleanup'],
    [
      { name: 'Premium Mulch (yd)', sku: 'MLCH-PR', quantity: 30, min_quantity: 10, unit_cost: 42.0, category: 'Materials' },
      { name: 'Fertilizer 16-4-8 (50lb)', sku: 'FERT-16', quantity: 14, min_quantity: 5, unit_cost: 36.0, category: 'Chemicals' },
      { name: 'Drip Tubing (500ft)', sku: 'DRIP-500', quantity: 6, min_quantity: 2, unit_cost: 95.0, category: 'Irrigation' },
    ],
    [
      { title: 'When to Prune What — A Seasonal Guide', excerpt: 'Prune at the wrong time and you\'ll lose next year\'s blooms.', content: '## Rule of thumb\n\nSpring bloomers after flowering. Summer bloomers in late winter.' },
      { title: 'Mulch: How Much, How Deep, How Often', excerpt: 'More isn\'t better.', content: '## The 3-inch rule\n\nNever more than 3" deep. Never volcano-mulched against trunks.' },
      { title: 'Fall Cleanup: What\'s Worth Doing Yourself', excerpt: 'And what to leave to the pros.', content: '## DIY vs pro\n\nDIY: leaf blowing. Pro: gutter cleanout, deep aeration, tree pruning over 12ft.' },
    ],
    [
      { name: 'Spring Cleanup Special', promo_code: 'SPRING50', discount_value: 50, message: 'Spring cleanup — $50 off when booked before April 15.', subject: 'Spring Yard Cleanup — $50 Off' },
      { name: 'Mulch + Edging Bundle', promo_code: 'MULCH10', discount_value: 10, message: 'Bundle mulch install with bed edging — save 10%.', subject: 'Mulch & Edge Bundle — Save 10%' },
    ],
  ),
  industry('fencing', 'Fencing & Decking', 'boost',
    ['Wood Fence Install','Vinyl Fence Repair','Composite Deck Build','Deck Staining','Gate Replacement'],
    [
      { name: 'Cedar Picket 6ft', sku: 'CP-6', quantity: 280, min_quantity: 100, unit_cost: 4.5, category: 'Lumber' },
      { name: '4x4 Pressure Treated Post 8ft', sku: 'PT-44-8', quantity: 60, min_quantity: 20, unit_cost: 18.0, category: 'Lumber' },
      { name: 'Concrete Post Mix (50lb)', sku: 'CON-50', quantity: 45, min_quantity: 15, unit_cost: 6.5, category: 'Materials' },
    ],
    [
      { title: 'Wood vs Vinyl vs Composite Fencing', excerpt: 'Cost, lifespan, and maintenance compared.', content: '## 20-year cost\n\nWood: cheap upfront, $$ in stain. Vinyl: mid. Composite: highest, lowest maintenance.' },
      { title: 'How Long Should Your Deck Last?', excerpt: 'Material choice + sealing routine = lifespan.', content: '## Lifespans\n\nPressure-treated: 15y. Cedar: 20y. Composite: 30y+.' },
      { title: 'Permits 101: When You Need One', excerpt: 'Most cities require permits for fences over 6ft and any deck attached to the house.', content: '## We handle it\n\nWe pull permits as part of every install over 4ft.' },
    ],
    [
      { name: 'Spring Fence Build Promo', promo_code: 'FENCE5', discount_value: 5, message: '5% off any new fence install booked this spring.', subject: 'Save 5% on Spring Fence Builds' },
      { name: 'Deck Stain Bundle', promo_code: 'STAIN15', discount_value: 15, message: 'Power wash + stain combo — 15% off.', subject: 'Deck Refresh — 15% Off' },
    ],
  ),
  // PRO (4)
  industry('roofing', 'Roofing', 'elite',
    ['Shingle Repair','Full Roof Replacement','Gutter Install','Storm Damage Inspection','Skylight Install'],
    [
      { name: 'Architectural Shingles (sq)', sku: 'SH-ARCH', quantity: 80, min_quantity: 30, unit_cost: 95.0, category: 'Roofing' },
      { name: 'Synthetic Underlayment (roll)', sku: 'UL-SYN', quantity: 22, min_quantity: 8, unit_cost: 110.0, category: 'Roofing' },
      { name: 'Roofing Nails (50lb)', sku: 'NL-RF-50', quantity: 12, min_quantity: 4, unit_cost: 65.0, category: 'Fasteners' },
    ],
    [
      { title: 'After the Storm: 7 Things to Check', excerpt: 'Document damage today; insurers won\'t cover it next month.', content: '## Inspection list\n\nMissing shingles, dented gutters, vent damage, attic stains.' },
      { title: 'Insurance Claims: How a Roofer Helps', excerpt: 'A pro inspection doubles approval rate.', content: '## Process\n\nFree roof inspection → photo report → adjuster meeting → scope match.' },
      { title: 'Roof Lifespan by Material', excerpt: 'Asphalt 25y. Metal 50y. Tile 75y.', content: '## ROI math\n\nMetal costs 2x asphalt but lasts 2x — equal cost, fewer headaches.' },
    ],
    [
      { name: 'Storm Inspection Push', promo_code: 'STORM0', discount_value: 250, message: 'Free post-storm roof inspection + insurance documentation.', subject: 'Free Storm Damage Inspection' },
      { name: 'Full Replace Promo', promo_code: 'ROOF500', discount_value: 500, message: '$500 off complete roof replacement booked this quarter.', subject: 'New Roof — $500 Off' },
    ],
  ),
  industry('beauty_wellness', 'Beauty & Wellness', 'core',
    ['Hair Color & Cut','Balayage','Manicure & Pedicure','Facial Treatment','Massage Therapy'],
    [
      { name: 'Color Developer (qt)', sku: 'CD-QT', quantity: 18, min_quantity: 6, unit_cost: 22.0, category: 'Color' },
      { name: 'Gel Polish (12pk)', sku: 'GP-12', quantity: 14, min_quantity: 5, unit_cost: 96.0, category: 'Nails' },
      { name: 'Massage Oil (Gal)', sku: 'MO-GAL', quantity: 6, min_quantity: 2, unit_cost: 48.0, category: 'Spa' },
    ],
    [
      { title: '5 Hair Trends Booking Up Fast This Season', excerpt: 'What clients are asking for and why it works.', content: '## Trending\n\nButtery blonde, modern shag, copper, money piece, lived-in lobs.' },
      { title: 'Caring for Color-Treated Hair at Home', excerpt: 'Protect your investment between visits.', content: '## Routine\n\nSulfate-free shampoo, weekly mask, UV protection spray, cool rinse.' },
      { title: 'Why Monthly Facials Outperform At-Home Care', excerpt: 'Professional extractions and peels make the difference.', content: '## The science\n\nMonthly facials retrain skin cycle — visible smoother texture in 60 days.' },
    ],
    [
      { name: 'New Client Welcome', promo_code: 'NEW20', discount_value: 20, message: 'Welcome! 20% off your first visit.', subject: 'Your First Visit — 20% Off' },
      { name: 'Refer-a-Friend', promo_code: 'REFER15', discount_value: 15, message: 'Refer a friend and you both get 15% off.', subject: 'Bring a Friend, Save Together' },
    ],
  ),
  industry('restaurants', 'Restaurants', 'core',
    ['Reservation','Private Event Booking','Catering Inquiry','Tasting Menu','Wine Pairing'],
    null, // service-only — no parts inventory
    [
      { title: 'This Season\'s Tasting Menu — Inspired by the Coast', excerpt: '5 courses, locally sourced.', content: '## Featured\n\nOyster mignonette, halibut crudo, hand-cut pappardelle, dry-aged ribeye, citrus pavlova.' },
      { title: 'Hosting a Private Event With Us', excerpt: 'From rehearsal dinners to corporate gatherings.', content: '## What\'s included\n\nDedicated server team, custom menu design, full bar package, A/V on request.' },
      { title: 'Wine Club: Sommelier-Curated Quarterly Picks', excerpt: '6 bottles, 4x a year — 25% off retail.', content: '## How it works\n\nJoin online → pickup or local delivery → tasting note card with each shipment.' },
    ],
    [
      { name: 'Restaurant Week', promo_code: 'RW3COURSE', discount_value: 10, message: '3-course prix fixe — $45/guest all week.', subject: 'Restaurant Week — $45 Prix Fixe' },
      { name: 'Wine Club Launch', promo_code: 'WINE25', discount_value: 25, message: 'Join our Wine Club and save 25% on your first shipment.', subject: 'Wine Club — 25% Off First Shipment' },
    ],
  ),
  industry('security_systems', 'Security Systems', 'pro',
    ['Camera Install','Alarm System Install','Smart Lock Setup','Access Control','Monitoring Setup'],
    [
      { name: '4MP Bullet Camera', sku: 'CAM-4MP-B', quantity: 18, min_quantity: 6, unit_cost: 165.0, category: 'Cameras' },
      { name: '8-Channel NVR (4TB)', sku: 'NVR-8-4T', quantity: 5, min_quantity: 2, unit_cost: 480.0, category: 'Recording' },
      { name: 'Door Contact Sensor', sku: 'DC-WL', quantity: 40, min_quantity: 15, unit_cost: 22.0, category: 'Sensors' },
    ],
    [
      { title: 'Wired vs Wireless Cameras: Which Is Right?', excerpt: 'Reliability vs flexibility — and a hybrid path.', content: '## Quick take\n\nWired = best for permanent. Wireless = best for renters.' },
      { title: '5 Smart Lock Mistakes to Avoid', excerpt: 'And how to set yours up the right way.', content: '## Top errors\n\nWeak Wi-Fi, default codes, no auto-lock, single user, no battery alert.' },
      { title: 'Why 24/7 Monitoring Matters', excerpt: 'A self-monitored system is a missed-alert system.', content: '## The math\n\nProfessional monitoring cuts response time from 12 minutes to <60 seconds.' },
    ],
    [
      { name: 'Free Install With Monitoring', promo_code: 'INSTALL0', discount_value: 299, message: 'Free professional install with 24-month monitoring agreement.', subject: 'Free Install With Monitoring Plan' },
      { name: 'Smart Lock Bundle', promo_code: 'LOCK10', discount_value: 10, message: 'Smart lock + camera bundle — 10% off.', subject: 'Smart Lock + Camera — 10% Off' },
    ],
  ),
  // ELITE (4)
  industry('real_estate', 'Real Estate', 'core',
    ['Listing Consultation','Buyer Showing','Open House','Comparative Market Analysis','Closing Coordination'],
    null,
    [
      { title: '5 Updates That Add the Most to Resale Value', excerpt: 'Where to spend $5k for a $20k bump.', content: '## ROI winners\n\nKitchen lighting, paint, garage door, landscaping, minor bath refresh.' },
      { title: 'Pre-Approval vs Pre-Qualification', excerpt: 'One opens doors. The other just opens conversations.', content: '## The difference\n\nPre-approval = lender pulled credit + verified income. Pre-qual = vibes.' },
      { title: 'Staging That Actually Sells Homes', excerpt: 'Less is more — and lighter is faster.', content: '## Three rules\n\nDeclutter ruthlessly, light it bright, neutralize bold colors.' },
    ],
    [
      { name: 'Spring Listing Consult', promo_code: 'LIST0', discount_value: 0, message: 'Free in-home listing consult and comparative market analysis this month.', subject: 'Free CMA — Find Out What Your Home Is Worth' },
      { name: 'Buyer Workshop', promo_code: 'BUY1', discount_value: 0, message: 'Free first-time buyer workshop next Saturday — RSVP today.', subject: 'First-Time Buyer Workshop — Saturday' },
    ],
  ),
  industry('personal_assistant', 'Personal Assistant', 'core',
    ['Calendar Management','Travel Booking','Errand Running','Inbox Triage','Event Planning'],
    null,
    [
      { title: 'How to Outsource Your Inbox in 2 Weeks', excerpt: 'A handoff playbook that actually sticks.', content: '## Phase 1\n\nFilter rules, label conventions, then daily triage at 9am + 2pm.' },
      { title: 'Travel Booking: What Takes Us 20 Minutes vs You 2 Hours', excerpt: 'Tools, points, and patterns that compound.', content: '## Stack\n\nGoogle Flights, point-aware booking, lounge networks, mid-trip rebooking.' },
      { title: 'Top 10 Errands We Take Off Your Plate', excerpt: 'Reclaim 5+ hours a week.', content: '## Common asks\n\nDry cleaning, returns, prescriptions, gift sourcing, vehicle service.' },
    ],
    [
      { name: 'Onboarding Promo', promo_code: 'PA10', discount_value: 10, message: '10 hours of dedicated PA support — first month 10% off.', subject: 'Hand Off the Busywork — 10% Off' },
      { name: 'Event Planning Special', promo_code: 'EVENT250', discount_value: 250, message: 'Full-service event planning — $250 off events booked 60 days out.', subject: 'Plan Your Event — $250 Off' },
    ],
  ),
  industry('solar', 'Solar', 'pro',
    ['Solar Site Survey','PV System Install','Battery Backup Install','Panel Cleaning','Production Audit'],
    [
      { name: '400W Solar Panel', sku: 'PV-400', quantity: 60, min_quantity: 20, unit_cost: 220.0, category: 'PV' },
      { name: 'String Inverter 7.6kW', sku: 'INV-76', quantity: 8, min_quantity: 3, unit_cost: 1450.0, category: 'Inverters' },
      { name: 'Battery 10kWh', sku: 'BAT-10', quantity: 4, min_quantity: 2, unit_cost: 6800.0, category: 'Storage' },
    ],
    [
      { title: 'Solar ROI in 2026: What\'s Changed', excerpt: 'Federal credit, state rebates, net metering — the full picture.', content: '## Payback\n\nMost installs now break even in 6–8 years with 25-year panel warranties.' },
      { title: 'Battery Backup vs Generator', excerpt: 'Quiet, instant, fuel-free — but at a cost.', content: '## Tradeoffs\n\nBattery: silent, automatic, 10–20kWh. Generator: cheap upfront, fuel + noise.' },
      { title: 'Why Production Drops Year 5 — And What to Do', excerpt: 'Soiling, shading, and microinverter aging.', content: '## Tune-up\n\nAnnual cleaning + production audit recovers 8–12% on average.' },
    ],
    [
      { name: 'Free Solar Quote', promo_code: 'SOLAR0', discount_value: 0, message: 'Free in-home solar consultation + custom production estimate.', subject: 'See How Much You\'d Save With Solar' },
      { name: 'Battery Backup Promo', promo_code: 'BAT500', discount_value: 500, message: '$500 off battery backup install with any new solar system.', subject: 'Battery Backup — $500 Off' },
    ],
  ),
  industry('construction', 'Construction', 'elite',
    ['Project Estimate','Kitchen Remodel','Bathroom Remodel','Addition Build','Permit Coordination'],
    [
      { name: '2x4 SPF Stud 8ft', sku: '2X4-8', quantity: 320, min_quantity: 100, unit_cost: 4.25, category: 'Lumber' },
      { name: 'Drywall 1/2" 4x8', sku: 'DW-12-48', quantity: 80, min_quantity: 25, unit_cost: 14.5, category: 'Drywall' },
      { name: 'OSB Sheathing 7/16"', sku: 'OSB-716', quantity: 60, min_quantity: 20, unit_cost: 28.0, category: 'Sheathing' },
    ],
    [
      { title: 'Kitchen Remodel: What Drives Cost', excerpt: 'Cabinets first, layout changes second.', content: '## Big-ticket items\n\nCabinets 35%, labor 20%, countertops 12%, appliances 12%, flooring 8%.' },
      { title: 'Permits: Why They Save You Money Long-Term', excerpt: 'Unpermitted work tanks resale value 10%+.', content: '## Reality\n\nPermitted work passes inspection at sale; unpermitted creates buyer credits.' },
      { title: 'Additions: Set Realistic Timelines', excerpt: 'A 400 sqft addition takes 4–6 months from contract to keys.', content: '## Timeline\n\nDesign 4w, permits 6w, foundation 3w, frame 4w, MEP 4w, finish 6w.' },
    ],
    [
      { name: 'Free Design Consult', promo_code: 'DESIGN0', discount_value: 0, message: 'Free in-home remodel consult + 3D renderings.', subject: 'Dream It — Free Design Consult' },
      { name: 'Bathroom Remodel Special', promo_code: 'BATH1500', discount_value: 1500, message: '$1,500 off any full bathroom remodel signed this quarter.', subject: 'Bathroom Remodel — $1,500 Off' },
    ],
  ),
  industry('fitness', 'Fitness Studio', 'core',
    ['Personal Training','Group Class','Nutrition Consult','Body Composition Scan','Recovery Session'],
    null,
    [
      { title: 'Strength vs Cardio: How to Split Your Week', excerpt: 'A balanced template that actually fits real schedules.', content: '## Weekly split\n\n3 strength days, 2 conditioning days, 1 mobility, 1 rest.' },
      { title: 'Why Body Composition Beats the Scale', excerpt: 'Two clients, same weight, very different bodies.', content: '## What we measure\n\nLean mass, fat mass, hydration — tracked monthly.' },
      { title: 'Recovery: The Hidden Multiplier', excerpt: 'Sleep, mobility, and active recovery sessions.', content: '## Stack\n\n7+ hours sleep, weekly mobility, foam rolling, contrast therapy.' },
    ],
    [
      { name: 'New Member Special', promo_code: 'FIT0', discount_value: 0, message: 'First class free + free body comp scan when you join.', subject: 'Free Class + Body Scan — Welcome' },
      { name: 'Refer a Friend', promo_code: 'FIT25', discount_value: 25, message: 'Refer a friend, both get 25% off next month.', subject: 'Train Together — 25% Off' },
    ],
  ),
  industry('salon', 'Salon & Spa', 'core',
    ['Haircut & Style','Color & Highlights','Blowout','Manicure & Pedicure','Spa Facial'],
    [
      { name: 'Color Developer (qt)', sku: 'SAL-CD-QT', quantity: 16, min_quantity: 6, unit_cost: 22.0, category: 'Color' },
      { name: 'Foils 5"x11" (500pk)', sku: 'SAL-FOIL', quantity: 12, min_quantity: 4, unit_cost: 28.0, category: 'Color' },
      { name: 'Gel Polish (12pk)', sku: 'SAL-GP-12', quantity: 10, min_quantity: 4, unit_cost: 96.0, category: 'Nails' },
    ],
    [
      { title: 'Balayage vs Highlights — Which Lasts Longer?', excerpt: 'Lower maintenance, softer grow-out.', content: '## Quick take\n\nBalayage = 3–4 month touch-ups. Foils = 6–8 weeks.' },
      { title: 'Bridal Hair: When to Book Your Trial', excerpt: 'Two months out is the sweet spot.', content: '## Timeline\n\nTrial 8 weeks before, color refresh 1 week before, day-of styling.' },
      { title: 'Glow-Up Facial Plan for the Season', excerpt: 'Three facials, visible results.', content: '## Plan\n\nDeep clean → enzyme peel → hydration boost over 6 weeks.' },
    ],
    [
      { name: 'New Guest 20% Off', promo_code: 'SALON20', discount_value: 20, message: 'Welcome! Enjoy 20% off your first service.', subject: 'Your First Visit — 20% Off' },
      { name: 'Refer a Friend', promo_code: 'SALONREF', discount_value: 15, message: 'Refer a friend — both get 15% off.', subject: 'Bring a Friend, Save Together' },
    ],
  ),
  industry('professional', 'Professional Services', 'boost',
    ['Discovery Call','Strategy Session','Project Engagement','Monthly Retainer','Workshop'],
    null,
    [
      { title: 'How to Scope a 4-Week Engagement', excerpt: 'Outcomes, not deliverables, drive momentum.', content: '## Template\n\nDiscovery → strategy → execution sprint → handoff doc.' },
      { title: 'Retainers vs Project Work', excerpt: 'When to switch and how to price both.', content: '## Rule of thumb\n\nRetainer when work is recurring monthly; project when scoped and finite.' },
      { title: 'Running a Workshop That Sells', excerpt: 'Teach value, then offer a clear next step.', content: '## Format\n\n45 min teach → 15 min Q&A → 1:1 strategy call offer.' },
    ],
    [
      { name: 'Free Discovery Call', promo_code: 'PROCALL', discount_value: 0, message: 'Book a free 30-min discovery call this week.', subject: 'Free 30-Min Discovery Call' },
      { name: 'Q1 Strategy Special', promo_code: 'PRO250', discount_value: 250, message: '$250 off any strategy engagement booked this quarter.', subject: 'Strategy Sessions — $250 Off' },
    ],
  ),
  industry('saas_platform', 'SaaS Platform', 'pro',
    ['Product Demo','Onboarding','Implementation','Customer Success Review','Technical Support'],
    null,
    [
      { title: 'Cutting Time-to-Value in Half', excerpt: 'Onboarding is product, not support.', content: '## Playbook\n\nDay 0 setup, day 3 first win, day 14 expansion conversation.' },
      { title: 'PLG vs Sales-Led: Pick Your Lane', excerpt: 'Hybrid is fine, but be intentional.', content: '## Quick take\n\nPLG = self-serve, $-low. Sales-led = high ACV. Hybrid = clear ICP gates.' },
      { title: 'Reducing Churn With Health Scores', excerpt: 'Three signals, one weekly review.', content: '## Signals\n\nProduct usage, support sentiment, exec sponsor engagement.' },
    ],
    [
      { name: 'Free 14-Day Trial', promo_code: 'SAAS14', discount_value: 0, message: 'Start a free 14-day trial — no card required.', subject: 'Try It Free for 14 Days' },
      { name: 'Annual Plan Discount', promo_code: 'SAASYEAR', discount_value: 20, message: 'Save 20% when you upgrade to an annual plan.', subject: 'Annual Plans — 20% Off' },
    ],
  ),
  // HOME HEALTH CARE (3) — Core tier
  industry('physical_therapy', 'Physical Therapy', 'core',
    ['Initial Evaluation','Follow-up Treatment','Post-Op Rehab','Gait & Balance Training','Re-Evaluation'],
    [
      { name: 'Nitrile Gloves (box)', sku: 'PPE-GLV', quantity: 24, min_quantity: 10, unit_cost: 12.0, category: 'PPE' },
      { name: 'Resistance Band Set', sku: 'PT-BAND', quantity: 18, min_quantity: 5, unit_cost: 22.0, category: 'Therapy Bands' },
      { name: 'Gait Belt', sku: 'PT-BELT', quantity: 12, min_quantity: 4, unit_cost: 18.0, category: 'Assistive Devices' },
    ],
    [
      { title: 'After Surgery: Why the First 30 Days of PT Matter', excerpt: 'Early movement protects long-term function.', content: '## Why early matters\n\nReduces scar tissue, prevents stiffness, restores range of motion before compensation patterns set in.' },
      { title: 'Fall Prevention at Home', excerpt: 'Five simple changes that lower fall risk.', content: '## Quick wins\n\nGrab bars in the bathroom, remove throw rugs, brighter night lighting, sturdy footwear, daily balance practice.' },
    ],
    [
      { name: 'Free Phone Screen', promo_code: 'PT0', discount_value: 0, message: 'Free 15-minute phone screen with a licensed PT — see if home PT is right for you.', subject: 'Free 15-min Phone Screen With a Physical Therapist' },
    ],
  ),
  industry('occupational_therapy', 'Occupational Therapy', 'core',
    ['Initial OT Evaluation','ADL Training','Home Safety Evaluation','Hand Therapy','Adaptive Equipment Training'],
    [
      { name: 'Nitrile Gloves (box)', sku: 'PPE-GLV', quantity: 24, min_quantity: 10, unit_cost: 12.0, category: 'PPE' },
      { name: 'Reacher / Grabber', sku: 'OT-REACH', quantity: 15, min_quantity: 5, unit_cost: 16.0, category: 'Adaptive Equipment' },
      { name: 'Sock Aid', sku: 'OT-SOCK', quantity: 12, min_quantity: 4, unit_cost: 9.5, category: 'Adaptive Equipment' },
    ],
    [
      { title: 'OT vs PT: What\'s the Difference?', excerpt: 'Both help you move — OT helps you do.', content: '## In plain English\n\nPT restores movement and strength. OT helps you perform daily tasks (bathing, dressing, cooking) safely and independently.' },
      { title: 'Home Safety in 10 Minutes', excerpt: 'A quick checklist any family can run.', content: '## Walkthrough\n\nLighting, clear paths, bathroom grab bars, kitchen reach, stair handrails, smoke / CO detectors.' },
    ],
    [
      { name: 'Free Home Safety Check', promo_code: 'OT0', discount_value: 0, message: 'Schedule a complimentary home-safety walkthrough with one of our OTs.', subject: 'Free In-Home Safety Walkthrough' },
    ],
  ),
  industry('hospice', 'Hospice Care', 'core',
    ['RN Case Manager Visit','Hospice Aide Visit','Social Work Visit','Chaplain Visit','Bereavement Follow-up'],
    [
      { name: 'Nitrile Gloves (box)', sku: 'PPE-GLV', quantity: 30, min_quantity: 10, unit_cost: 12.0, category: 'PPE' },
      { name: 'Wound Care Kit', sku: 'HOS-WND', quantity: 12, min_quantity: 4, unit_cost: 28.0, category: 'Wound Care' },
      { name: 'Comfort Care Pack', sku: 'HOS-CMF', quantity: 20, min_quantity: 6, unit_cost: 35.0, category: 'Personal Care' },
    ],
    [
      { title: 'What Hospice Is — And Isn\'t', excerpt: 'Comfort, dignity, and presence in the final chapter.', content: '## What hospice provides\n\nNursing, aide visits, social work, chaplain support, bereavement care, 24/7 phone access.' },
      { title: 'Bereavement Support After a Loss', excerpt: 'You are not alone — support continues for 13 months.', content: '## What\'s offered\n\nPhone check-ins, mailings, support groups, and individual counseling at no cost to the family.' },
    ],
    [
      { name: 'Family Information Visit', promo_code: 'HOS0', discount_value: 0, message: 'Schedule a no-cost family information visit to learn how hospice can help.', subject: 'Compassionate Care — Free Information Visit' },
    ],
  ),
];

function industry(
  key: string,
  label: string,
  tier: TierKey,
  services: string[],
  inventory: IndustryDef['inventory'],
  blog: IndustryDef['blog'],
  campaigns: IndustryDef['campaigns'],
): IndustryDef {
  const [primary, secondary] = TIER_COLORS[tier];
  return {
    key, label, tier,
    internalTier: TIER_INTERNAL[tier],
    primary, secondary,
    services, inventory, blog, campaigns,
  };
}

const SAMPLE_FIRST = ['Sarah','James','Maria','David','Emma','Michael','Linda','Robert','Jessica','William'];
const SAMPLE_LAST = ['Johnson','Smith','Garcia','Brown','Davis','Miller','Wilson','Anderson','Taylor','Thomas'];
const SAMPLE_STREETS = ['Main St','Oak Ave','Pine Rd','Maple Dr','Elm St','Cedar Ln','Park Blvd','Lake Rd'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(): string {
  const n = () => Math.floor(Math.random() * 9000 + 1000);
  return `+1555${n()}${String(n()).slice(0, 3)}`;
}
function daysAgo(d: number): string { return new Date(Date.now() - d * 86400000).toISOString(); }
function daysFromNow(d: number): string { return new Date(Date.now() + d * 86400000).toISOString(); }

interface CreateUserResult {
  userId: string;
  created: boolean;
  email: string;
}

async function ensureUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
): Promise<CreateUserResult> {
  // Page through to find existing
  let existing: { id: string } | undefined;
  for (let page = 1; page <= 10; page++) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) { existing = { id: found.id }; break; }
    if (!list?.users || list.users.length < 200) break;
  }
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    return { userId: existing.id, created: false, email };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data?.user) throw new Error(`createUser ${email}: ${error?.message ?? 'unknown'}`);
  return { userId: data.user.id, created: true, email };
}

async function deleteStaleDemoUsers(admin: ReturnType<typeof createClient>) {
  // Old tier-based demo emails: {tier}company@demo.com / {tier}employee@demo.com / {tier}customer@demo.com
  const stale: string[] = [];
  for (const t of ['core','boost','pro','elite']) {
    stale.push(`${t}company@demo.com`, `${t}employee@demo.com`, `${t}customer@demo.com`);
  }
  for (let page = 1; page <= 10; page++) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (!list?.users) break;
    for (const u of list.users) {
      if (u.email && stale.includes(u.email.toLowerCase())) {
        try { await admin.auth.admin.deleteUser(u.id); } catch (_) { /* ignore */ }
      }
    }
    if (list.users.length < 200) break;
  }
}

async function seedIndustry(admin: ReturnType<typeof createClient>, ind: IndustryDef) {
  const slug = `demo-${ind.key.replace(/_/g, '-')}`;
  const log: string[] = [];
  const agents = TIER_AGENTS[ind.tier];

  // 1. Company (upsert by slug) — setting industry_vertical fires trg_seed_industry_pack_kb
  const { data: existingCompany } = await admin
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  const companyPayload = {
    name: `Demo ${ind.label}`,
    slug,
    subscription_tier: ind.internalTier,
    industry_vertical: ind.key,
    is_demo: true,
    primary_color: ind.primary,
    secondary_color: ind.secondary,
    contact_email: `${ind.key.replace(/_/g, '')}admin@demo.com`,
    contact_phone: randPhone(),
    business_phone: randPhone(),
    address: `${100 + Math.floor(Math.random() * 900)} ${rand(SAMPLE_STREETS)}, Austin, TX 78701`,
    service_area_cities: ['Austin','Round Rock','Cedar Park'],
    service_area_zip_codes: ['78701','78702','78703'],
    service_categories: [ind.label],
  };

  let companyId: string;
  if (existingCompany) {
    companyId = existingCompany.id;
    await admin.from('companies').update(companyPayload).eq('id', companyId);
    log.push(`updated`);
  } else {
    const { data: c, error } = await admin.from('companies').insert(companyPayload).select('id').single();
    if (error) throw new Error(`company ${slug}: ${error.message}`);
    companyId = c.id;
    log.push(`created`);
  }

  // 2. Three users — emails use industry key (underscores stripped)
  const ek = ind.key.replace(/_/g, '');
  const adminUser = await ensureUser(admin, `${ek}admin@demo.com`, `Demo ${ind.label} Admin`);
  const employeeUser = await ensureUser(admin, `${ek}employee@demo.com`, `Demo ${ind.label} Employee`);
  const customerUser = await ensureUser(admin, `${ek}customer@demo.com`, `Demo ${ind.label} Customer`);

  // 3. Profiles
  await admin.from('profiles').update({ company_id: companyId, full_name: `Demo ${ind.label} Admin` }).eq('id', adminUser.userId);
  await admin.from('profiles').update({ company_id: companyId, full_name: `Demo ${ind.label} Employee` }).eq('id', employeeUser.userId);
  await admin.from('profiles').update({ full_name: `Demo ${ind.label} Customer` }).eq('id', customerUser.userId);

  // 4. Roles
  await admin.from('user_roles').upsert({ user_id: adminUser.userId, role: 'company_admin' }, { onConflict: 'user_id,role' });
  await admin.from('user_roles').upsert({ user_id: employeeUser.userId, role: 'employee' }, { onConflict: 'user_id,role' });
  await admin.from('user_roles').upsert({ user_id: customerUser.userId, role: 'customer' }, { onConflict: 'user_id,role' });

  // 5. Employee job assignment
  await admin.from('employee_job_assignments').upsert({
    employee_id: employeeUser.userId,
    company_id: companyId,
    job_type: 'technician',
  }, { onConflict: 'company_id,employee_id,job_type' });

  // 6. Customer association
  await admin.from('customer_company_associations').upsert({
    customer_user_id: customerUser.userId,
    company_id: companyId,
  }, { onConflict: 'customer_user_id,company_id' });

  // 7. Business hours
  for (let d = 0; d < 7; d++) {
    const closed = d === 0 || d === 6;
    await admin.from('business_hours').upsert({
      company_id: companyId,
      day_of_week: d,
      hour_type: 'office',
      open_time: closed ? null : '08:00:00',
      close_time: closed ? null : '17:00:00',
      is_closed: closed,
    }, { onConflict: 'company_id,day_of_week,hour_type' });
  }

  // 8. Activate AI agents for the tier + industry-specific extra operatives.
  // Without this, demo admins see an empty AI Operatives Hub even though the
  // tier (e.g. Aura Core) is supposed to ship 8 agents.
  const { data: packRow } = await admin
    .from('industry_template_packs')
    .select('extra_operatives')
    .eq('industry_id', ind.key)
    .eq('is_active', true)
    .maybeSingle();
  const extraOperatives: string[] = Array.isArray(packRow?.extra_operatives)
    ? (packRow!.extra_operatives as string[])
    : [];
  const allAgents = Array.from(new Set([...agents, ...extraOperatives]));
  // Wipe + reinsert so re-seeding always reflects the current tier mapping.
  await admin.from('ai_agent_configs').delete().eq('company_id', companyId);
  if (allAgents.length > 0) {
    await admin.from('ai_agent_configs').insert(
      allAgents.map(agent_type => ({
        company_id: companyId,
        agent_type,
        is_enabled: true,
        settings: {},
      })),
    );
  }

  // ========= DEMO DATA =========
  const has = (a: string) => agents.includes(a);

  // Wipe prior demo data scoped to this company
  await admin.from('appointments').delete().eq('company_id', companyId);
  await admin.from('leads').delete().eq('company_id', companyId);
  await admin.from('marketing_campaigns').delete().eq('company_id', companyId);
  await admin.from('quotes').delete().eq('company_id', companyId);
  await admin.from('invoices').delete().eq('company_id', companyId);
  await admin.from('inventory_items').delete().eq('company_id', companyId);
  await admin.from('blog_posts').delete().eq('author_id', adminUser.userId);

  // Customer profiles
  const customerProfiles = [
    { email: `${ek}customer@demo.com`, name: `Demo ${ind.label} Customer` },
    ...Array.from({ length: 4 }, (_, i) => ({
      email: `sample${i + 1}.${ek}@demo.com`,
      name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
    })),
  ];
  for (const cp of customerProfiles) {
    await admin.from('customer_profiles').upsert({
      company_id: companyId,
      email: cp.email,
      name: cp.name,
      phone: randPhone(),
      address: `${100 + Math.floor(Math.random() * 900)} ${rand(SAMPLE_STREETS)}, Austin, TX 78701`,
    }, { onConflict: 'company_id,email' });
  }

  // Appointments — industry-specific service types
  if (has('booking') || has('triage')) {
    const statuses = ['scheduled','scheduled','completed','completed','cancelled'];
    const apptRows = statuses.map((status, i) => ({
      company_id: companyId,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `customer${i}.${ek}@example.com`,
      customer_phone: randPhone(),
      customer_address: `${100 + i} ${rand(SAMPLE_STREETS)}, Austin, TX`,
      service_type: rand(ind.services),
      datetime: status === 'completed' ? daysAgo(10 + i * 3) : daysFromNow(2 + i * 2),
      duration_minutes: 60,
      status,
    }));
    await admin.from('appointments').insert(apptRows);
  }

  // Leads — industry-specific service interest
  if (has('lead')) {
    const priorities = ['hot','hot','high','high','normal','normal'];
    const leadRows = priorities.map((priority, i) => ({
      company_id: companyId,
      name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      phone: randPhone(),
      email: `lead${i}.${ek}@example.com`,
      address: `${200 + i} ${rand(SAMPLE_STREETS)}, Austin, TX`,
      source: rand(['voice','chat','widget','referral']),
      intent: rand(['booking','quote','inquiry','emergency']),
      service_interest: rand(ind.services),
      status: rand(['new','contacted','qualified']),
      priority,
      score: priority === 'hot' ? 85 : priority === 'high' ? 70 : 50,
      created_at: daysAgo(Math.floor(Math.random() * 30)),
    }));
    await admin.from('leads').insert(leadRows);
  }

  // Marketing campaigns — industry-tailored copy
  if (has('marketing') || has('campaign')) {
    const camps = ind.campaigns.slice(0, 2);
    await admin.from('marketing_campaigns').insert(camps.map((c, i) => ({
      company_id: companyId,
      name: c.name,
      campaign_type: i === 0 ? 'promotional' : 'reactivation',
      target_segment: i === 0 ? 'all_customers' : 'inactive_90_days',
      discount_type: c.discount_value > 100 ? 'fixed' : (c.discount_value > 0 ? 'percentage' : 'none'),
      discount_value: c.discount_value,
      promo_code: c.promo_code,
      message_template: c.message,
      email_subject: c.subject,
      channels: ['email','sms'],
      status: i === 0 ? 'active' : 'completed',
      start_date: i === 0 ? daysAgo(7) : daysAgo(45),
      end_date: i === 0 ? daysFromNow(30) : daysAgo(15),
      total_sent: 245 - i * 100,
      total_opened: 142 - i * 60,
      total_clicked: 38 - i * 15,
      total_converted: 12 - i * 5,
    })));
  }

  // Blog posts — industry-specific titles & content
  if (has('creative_content')) {
    await admin.from('blog_posts').insert(ind.blog.slice(0, 3).map((b, i) => ({
      author_id: adminUser.userId,
      title: b.title,
      slug: `${ind.key}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${i}`,
      excerpt: b.excerpt,
      content: b.content,
      published: i < 2,
      published_at: i < 2 ? daysAgo(7 + i * 7) : null,
    })));
  }

  // Quotes (Pro/Elite)
  if (has('quoting')) {
    await admin.from('quotes').insert(Array.from({ length: 3 }, (_, i) => ({
      company_id: companyId,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `quote${i}.${ek}@example.com`,
      customer_phone: randPhone(),
      status: rand(['sent','accepted','draft']),
      subtotal: 450 + i * 100,
      tax_rate: 8.25,
      tax_amount: (450 + i * 100) * 0.0825,
      total_amount: (450 + i * 100) * 1.0825,
      valid_until: daysFromNow(30),
      notes: `Estimate for ${rand(ind.services)}`,
    })));
  }

  // Invoices (Pro/Elite)
  if (has('invoice')) {
    await admin.from('invoices').insert(Array.from({ length: 3 }, (_, i) => ({
      company_id: companyId,
      invoice_number: `INV-${ind.key.toUpperCase().slice(0, 4)}-${1000 + i}`,
      customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
      customer_email: `invoice${i}.${ek}@example.com`,
      customer_phone: randPhone(),
      status: i === 0 ? 'paid' : i === 1 ? 'sent' : 'draft',
      subtotal: 350 + i * 75,
      tax_rate: 8.25,
      tax_amount: (350 + i * 75) * 0.0825,
      total: (350 + i * 75) * 1.0825,
      due_date: daysFromNow(15),
      paid_at: i === 0 ? daysAgo(2) : null,
    })));
  }

  // Inventory (Elite + any tier with inventory data)
  if (has('inventory') && ind.inventory) {
    await admin.from('inventory_items').insert(ind.inventory.map((it) => ({
      ...it,
      company_id: companyId,
      supplier: 'Demo Supplier Co.',
    })));
  }

  return {
    industry: ind.key,
    label: ind.label,
    tier: ind.tier,
    company_id: companyId,
    users: { admin: adminUser, employee: employeeUser, customer: customerUser },
    log,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'platform_admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden — platform_admin required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cleanup stale tier-based demo users from previous schema
    await deleteStaleDemoUsers(admin);

    // Seed all 18 industries
    const results = [];
    for (const ind of INDUSTRIES) {
      try {
        const r = await seedIndustry(admin, ind);
        results.push({ ok: true, ...r });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Industry ${ind.key} failed:`, msg);
        results.push({ ok: false, industry: ind.key, label: ind.label, tier: ind.tier, error: msg });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      password: PASSWORD,
      total: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('seed-demo-accounts-v2 error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
