import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD = 'auratrial*!';
const TRIAL_HOURS = 48;
const PUBLIC_URL = 'https://auraintercept.ai';

function buildDemoEmailHtml(opts: {
  name: string;
  businessName: string;
  industryLabel: string;
  password: string;
  expiresAt: string;
  adminEmail: string;
  employeeEmail: string;
  customerEmail: string;
  shareUrl: string;
}) {
  const { name, businessName, industryLabel, password, expiresAt, adminEmail, employeeEmail, customerEmail, shareUrl } = opts;
  const ends = new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const row = (label: string, em: string, redirect: string) => `
    <tr>
      <td style="padding:14px 16px;border:1px solid #1f2937;border-radius:8px;background:#0b1220;">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#22d3ee;font-weight:700;">${label}</div>
        <div style="margin-top:6px;font-family:Menlo,monospace;color:#e5e7eb;font-size:14px;">${em}</div>
        <a href="${PUBLIC_URL}/auth?mode=customer&prefill=${encodeURIComponent(em)}"
           style="display:inline-block;margin-top:10px;padding:8px 14px;background:#06b6d4;color:#0b1220;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">
           Open ${label}
        </a>
      </td>
    </tr>
    <tr><td style="height:10px;"></td></tr>
  `;
  return `<!doctype html><html><body style="margin:0;background:#040a14;color:#e5e7eb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 20px;">
      <h1 style="color:#22d3ee;font-size:22px;margin:0 0 6px;">Your ${industryLabel} demo is live</h1>
      <p style="color:#9ca3af;margin:0 0 18px;font-size:14px;">
        Hey ${name}, your 48-hour Aura Intercept demo for <b style="color:#e5e7eb;">${businessName}</b> is ready. Open it on your laptop, then scan/forward this email to your phone to try the technician + customer mobile experience.
      </p>
      <div style="background:#0b1220;border:1px solid #22d3ee;border-radius:8px;padding:14px 16px;margin-bottom:14px;">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#22d3ee;font-weight:700;">One-tap demo link</div>
        <a href="${shareUrl}" style="display:block;margin-top:6px;color:#e5e7eb;font-family:Menlo,monospace;font-size:13px;word-break:break-all;text-decoration:none;">${shareUrl}</a>
        <div style="color:#9ca3af;margin-top:6px;font-size:12px;">Open this on your phone to launch any role with one tap.</div>
      </div>
      <div style="background:#0b1220;border:1px solid #1f2937;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:13px;">
        <div>Universal password: <code style="color:#22d3ee;font-weight:700;">${password}</code></div>
        <div style="color:#9ca3af;margin-top:4px;">Expires: ${ends}</div>
      </div>
      <table role="presentation" style="width:100%;border-collapse:separate;">
        ${row('Owner Dashboard', adminEmail, '/dashboard')}
        ${row('Technician App', employeeEmail, '/technician')}
        ${row('Customer Portal', customerEmail, '/customer-portal')}
      </table>
      <p style="color:#6b7280;font-size:11px;margin-top:18px;line-height:1.5;">
        After 48 hours your demo company is automatically deleted. Want to keep your data? Upgrade anytime from the demo banner.
      </p>
    </div>
  </body></html>`;
}

function buildDemoEmailText(opts: {
  name: string;
  businessName: string;
  industryLabel: string;
  password: string;
  expiresAt: string;
  adminEmail: string;
  employeeEmail: string;
  customerEmail: string;
  shareUrl: string;
}) {
  const { name, businessName, industryLabel, password, expiresAt, adminEmail, employeeEmail, customerEmail, shareUrl } = opts;
  const ends = new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return [
    `Hi ${name},`,
    ``,
    `Your 48-hour Aura Intercept ${industryLabel} demo for ${businessName} is ready.`,
    ``,
    `One-tap demo link (open on your phone):`,
    `${shareUrl}`,
    ``,
    `Universal password: ${password}`,
    `Expires: ${ends}`,
    ``,
    `Logins:`,
    `  Owner Dashboard:  ${adminEmail}`,
    `  Technician App:   ${employeeEmail}`,
    `  Customer Portal:  ${customerEmail}`,
    ``,
    `After 48 hours the demo company is automatically deleted.`,
    `— Aura Intercept`,
  ].join('\n');
}

interface IndustryDef {
  label: string;
  services: string[];
  categories: string[];
  primary: string;
  secondary: string;
  cities: string[];
  zips: string[];
  address: string;
  sampleAppointment: { service: string; whenOffsetHours: number; notes: string };
  sampleLead: { source: string; intent: string; serviceInterest: string; priority: string; score: number };
}

const A = (cities: string[], zips: string[], address: string) => ({ cities, zips, address });
const AUSTIN = A(['Austin','Round Rock','Cedar Park'], ['78701','78702','78703'], '742 Evergreen Terrace, Austin, TX 78701');
const DALLAS = A(['Dallas','Plano','Frisco'], ['75201','75024','75034'], '1820 Magnolia Ave, Dallas, TX 75201');
const PHOENIX = A(['Phoenix','Scottsdale','Tempe'], ['85001','85251','85281'], '4500 Camelback Rd, Phoenix, AZ 85018');
const HOUSTON = A(['Houston','Katy','Sugar Land'], ['77002','77494','77478'], '900 Bagby St, Houston, TX 77002');
const ORLANDO = A(['Orlando','Winter Park','Kissimmee'], ['32801','32789','34741'], '210 Lake Eola Dr, Orlando, FL 32801');
const DENVER = A(['Denver','Aurora','Lakewood'], ['80202','80012','80226'], '1144 15th St, Denver, CO 80202');

const INDUSTRY_DEFAULTS: Record<string, IndustryDef> = {
  hvac: { label: 'HVAC', services: ['AC Repair','Furnace Install','Duct Cleaning','Maintenance Plan','Emergency Service'], categories: ['HVAC'], primary: '#0EA5E9', secondary: '#22D3EE', ...AUSTIN, sampleAppointment: { service: 'AC Repair', whenOffsetHours: 22, notes: 'Customer reports warm air, unit running constantly. Bring R-410A.' }, sampleLead: { source: 'voice', intent: 'emergency', serviceInterest: 'AC Repair', priority: 'hot', score: 92 } },
  plumbing: { label: 'Plumbing', services: ['Drain Cleaning','Water Heater','Pipe Repair','Fixture Install','Emergency Service'], categories: ['Plumbing'], primary: '#3B82F6', secondary: '#60A5FA', ...HOUSTON, sampleAppointment: { service: 'Water Heater', whenOffsetHours: 26, notes: '40-gal electric, no hot water since this morning. Garage install.' }, sampleLead: { source: 'chat', intent: 'quote', serviceInterest: 'Tankless Water Heater', priority: 'high', score: 78 } },
  electrical: { label: 'Electrical', services: ['Panel Upgrade','Wiring','Outlet Install','Lighting','Safety Inspection'], categories: ['Electrical'], primary: '#F59E0B', secondary: '#FBBF24', ...DALLAS, sampleAppointment: { service: 'EV Charger Install', whenOffsetHours: 48, notes: 'Tesla Wall Connector, 60A circuit, garage panel has spare slots.' }, sampleLead: { source: 'voice', intent: 'quote', serviceInterest: 'Panel Upgrade', priority: 'high', score: 75 } },
  solar_energy: { label: 'Solar Energy', services: ['Site Assessment','Solar Install','Battery Backup','Panel Cleaning','System Maintenance'], categories: ['Solar'], primary: '#F59E0B', secondary: '#FCD34D', ...PHOENIX, sampleAppointment: { service: 'Site Assessment', whenOffsetHours: 72, notes: '$380/mo bill, south-facing roof, 8 yrs old. Homeowner financing.' }, sampleLead: { source: 'widget', intent: 'quote', serviceInterest: 'Solar Install', priority: 'high', score: 80 } },
  roofing: { label: 'Roofing', services: ['Roof Inspection','Storm Damage Repair','Full Replacement','Gutter Repair','Emergency Tarp'], categories: ['Roofing'], primary: '#DC2626', secondary: '#F97316', ...DALLAS, sampleAppointment: { service: 'Roof Inspection', whenOffsetHours: 30, notes: 'Hail damage from Tuesday storm. Filed claim with State Farm.' }, sampleLead: { source: 'voice', intent: 'emergency', serviceInterest: 'Storm Damage Repair', priority: 'hot', score: 90 } },
  fencing_decking: { label: 'Fencing & Decking', services: ['Fence Install','Deck Build','Repair & Restain','Gate Install','Removal'], categories: ['Fencing','Decking'], primary: '#92400E', secondary: '#D97706', ...AUSTIN, sampleAppointment: { service: 'Site Estimate', whenOffsetHours: 30, notes: '180 lf cedar privacy, 6ft, 2 gates. HOA approval pending.' }, sampleLead: { source: 'chat', intent: 'quote', serviceInterest: 'Deck Build', priority: 'high', score: 76 } },
  landscape_trees: { label: 'Landscape & Trees', services: ['Lawn Mowing','Tree Trimming','Landscape Design','Irrigation','Storm Cleanup'], categories: ['Landscaping'], primary: '#10B981', secondary: '#34D399', ...ORLANDO, sampleAppointment: { service: 'Weekly Mow', whenOffsetHours: 18, notes: 'Half-acre lot, gate code 4521. Recurring weekly Tuesdays.' }, sampleLead: { source: 'widget', intent: 'booking', serviceInterest: 'Tree Removal', priority: 'high', score: 70 } },
  pool_spa: { label: 'Pool & Spa', services: ['Weekly Cleaning','Chemistry Balance','Equipment Repair','Green Pool Recovery','Pool Opening'], categories: ['Pool & Spa'], primary: '#06B6D4', secondary: '#67E8F9', ...PHOENIX, sampleAppointment: { service: 'Green Pool Recovery', whenOffsetHours: 20, notes: '15k gal in-ground, algae bloom after storm. Customer has shock on hand.' }, sampleLead: { source: 'voice', intent: 'emergency', serviceInterest: 'Green Pool Recovery', priority: 'hot', score: 88 } },
  pest_control: { label: 'Pest Control', services: ['One-Time Treatment','Quarterly Plan','Termite Inspection','Bed Bug Treatment','Rodent Control'], categories: ['Pest Control'], primary: '#65A30D', secondary: '#A3E635', ...HOUSTON, sampleAppointment: { service: 'Quarterly Treatment', whenOffsetHours: 25, notes: '2,400 sq ft single-family. Indoor + perimeter. Pet-friendly products.' }, sampleLead: { source: 'chat', intent: 'booking', serviceInterest: 'Quarterly Plan', priority: 'high', score: 73 } },
  appliance_repair: { label: 'Appliance Repair', services: ['Diagnostic','Refrigerator Repair','Washer/Dryer Repair','Oven/Range Repair','Dishwasher Repair'], categories: ['Appliance Repair'], primary: '#0891B2', secondary: '#22D3EE', ...AUSTIN, sampleAppointment: { service: 'Refrigerator Repair', whenOffsetHours: 22, notes: 'Whirlpool WRS325SDHZ, not cooling. Customer has receipts for warranty check.' }, sampleLead: { source: 'voice', intent: 'booking', serviceInterest: 'Refrigerator Repair', priority: 'high', score: 76 } },
  handyman_cleaning: { label: 'Handyman & Cleaning', services: ['Handyman Visit','Recurring Cleaning','Deep Clean','Move-Out Clean','Furniture Assembly'], categories: ['Handyman','Cleaning'], primary: '#7C3AED', secondary: '#A78BFA', ...AUSTIN, sampleAppointment: { service: 'Recurring Cleaning', whenOffsetHours: 20, notes: '3 bed / 2 bath, biweekly Wednesdays. Pet-friendly products. Key in lockbox.' }, sampleLead: { source: 'chat', intent: 'booking', serviceInterest: 'Deep Clean', priority: 'normal', score: 65 } },
  construction: { label: 'Construction', services: ['Remodeling','Additions','Painting','Flooring','Tile & Trim'], categories: ['Construction'], primary: '#8B5CF6', secondary: '#C4B5FD', ...DALLAS, sampleAppointment: { service: 'Walk-Through Estimate', whenOffsetHours: 48, notes: 'Kitchen remodel ~200 sqft. Budget $40-60k. Wants quartz + soft-close.' }, sampleLead: { source: 'referral', intent: 'quote', serviceInterest: 'Kitchen Remodel', priority: 'hot', score: 89 } },
  auto_care: { label: 'Auto Care', services: ['Full Detail','Express Wash','Ceramic Coating','Oil Change','Diagnostic'], categories: ['Auto Care'], primary: '#1F2937', secondary: '#6B7280', ...PHOENIX, sampleAppointment: { service: 'Full Detail', whenOffsetHours: 24, notes: '2022 Tahoe. Interior + exterior, pet hair removal. Driveway, water access ok.' }, sampleLead: { source: 'widget', intent: 'booking', serviceInterest: 'Ceramic Coating', priority: 'high', score: 74 } },
  security_systems: { label: 'Security Systems', services: ['Camera Install','Alarm System','Monitoring','Smart Lock Install','System Upgrade'], categories: ['Security'], primary: '#1E40AF', secondary: '#3B82F6', ...HOUSTON, sampleAppointment: { service: 'Camera Install', whenOffsetHours: 26, notes: '6 cameras + NVR + monitoring. Wired, prefer Reolink. Recent attempted break-in.' }, sampleLead: { source: 'voice', intent: 'emergency', serviceInterest: 'Camera Install', priority: 'hot', score: 87 } },
  real_estate: { label: 'Real Estate', services: ['Showing Booking','Buyer Consult','Listing Inquiry','Open House RSVP','Market Update'], categories: ['Real Estate'], primary: '#0F766E', secondary: '#2DD4BF', ...AUSTIN, sampleAppointment: { service: 'Property Showing', whenOffsetHours: 30, notes: 'Buyer pre-approved $450k. Likes 4123 Maple St and 2 others nearby.' }, sampleLead: { source: 'chat', intent: 'booking', serviceInterest: 'Property Showing', priority: 'high', score: 78 } },
  beauty_wellness: { label: 'Beauty & Wellness', services: ['Haircut','Color & Highlights','Balayage','Massage','Facial'], categories: ['Beauty','Wellness'], primary: '#DB2777', secondary: '#F472B6', ...AUSTIN, sampleAppointment: { service: 'Color & Cut', whenOffsetHours: 28, notes: 'Balayage refresh + cut with Sarah. Has color history on file.' }, sampleLead: { source: 'widget', intent: 'booking', serviceInterest: 'Color & Highlights', priority: 'high', score: 72 } },
  restaurants: { label: 'Restaurants', services: ['Reservation','Catering Quote','Private Event','Takeout Order','Gift Card'], categories: ['Restaurants'], primary: '#B91C1C', secondary: '#F87171', ...ORLANDO, sampleAppointment: { service: 'Reservation (party of 6)', whenOffsetHours: 26, notes: 'Birthday celebration, 1 vegetarian, 1 GF. Window booth requested.' }, sampleLead: { source: 'chat', intent: 'booking', serviceInterest: 'Catering', priority: 'high', score: 75 } },
  personal_assistant: { label: 'Personal Assistant', services: ['Discovery Call','Strategy Session','Follow-Up','Onboarding Call','Check-In'], categories: ['Professional Services'], primary: '#6366F1', secondary: '#A5B4FC', ...AUSTIN, sampleAppointment: { service: 'Discovery Call', whenOffsetHours: 26, notes: '30 min intro call. Topic: Q2 marketing strategy. Zoom link auto-sent.' }, sampleLead: { source: 'referral', intent: 'booking', serviceInterest: 'Strategy Session', priority: 'high', score: 80 } },
  // Legacy alias
  general_contractor: { label: 'General Contractor', services: ['Remodeling','Additions','Roofing','Siding','Deck Building'], categories: ['General Contractor'], primary: '#8B5CF6', secondary: '#A78BFA', ...DALLAS, sampleAppointment: { service: 'Walk-Through Estimate', whenOffsetHours: 48, notes: 'Kitchen remodel ~200 sqft.' }, sampleLead: { source: 'referral', intent: 'quote', serviceInterest: 'Remodeling', priority: 'hot', score: 89 } },
  landscaping: { label: 'Landscaping', services: ['Lawn Mowing','Tree Trimming','Landscape Design','Irrigation','Snow Removal'], categories: ['Landscaping'], primary: '#10B981', secondary: '#34D399', ...ORLANDO, sampleAppointment: { service: 'Weekly Mow', whenOffsetHours: 18, notes: 'Half-acre lot.' }, sampleLead: { source: 'widget', intent: 'booking', serviceInterest: 'Tree Removal', priority: 'high', score: 70 } },
  other: { label: 'Service', services: ['Service Calls','Estimates','Recurring Maintenance','Emergency Service'], categories: ['Service'], primary: '#6366F1', secondary: '#818CF8', ...AUSTIN, sampleAppointment: { service: 'Service Call', whenOffsetHours: 24, notes: 'New customer intake.' }, sampleLead: { source: 'chat', intent: 'inquiry', serviceInterest: 'General Service', priority: 'normal', score: 60 } },
};

const SAMPLE_FIRST = ['Sarah','James','Maria','David','Emma','Michael','Linda','Robert'];
const SAMPLE_LAST = ['Johnson','Smith','Garcia','Brown','Davis','Miller','Wilson'];
const STREETS = ['Main St','Oak Ave','Pine Rd','Maple Dr','Elm St'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function token(len = 8) { return Math.random().toString(36).slice(2, 2 + len); }
function phone() {
  const n = () => Math.floor(Math.random() * 9000 + 1000);
  return `+1555${n()}${String(n()).slice(0, 3)}`;
}
function daysFromNow(d: number) { return new Date(Date.now() + d * 86400000).toISOString(); }
function hoursFromNow(h: number) { return new Date(Date.now() + h * 3600000).toISOString(); }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString(); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { name, email, phone: prospectPhone, business_name, industry, sms_opt_in, email_opt_in } = body || {};

    if (!name || !email || !business_name || !industry) {
      return new Response(JSON.stringify({ success: false, error: 'name, email, business_name, and industry are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const industryKey = INDUSTRY_DEFAULTS[industry] ? industry : 'other';
    const ind = INDUSTRY_DEFAULTS[industryKey];

    // Rate limit: 1 trial per email per 7 days
    const { data: recent } = await admin
      .from('demo_trials')
      .select('id, expires_at, status')
      .eq('prospect_email', email.toLowerCase())
      .gt('created_at', daysAgo(7))
      .order('created_at', { ascending: false })
      .limit(1);
    if (recent && recent.length > 0 && recent[0].status === 'active') {
      return new Response(JSON.stringify({ success: false, error: 'You already have an active demo. Check your email for credentials.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slug = `demo-trial-${industryKey}-${token(6)}`;
    const tk = token(6);
    const adminEmail = `demo-admin-${tk}@auraintercept.ai`;
    const employeeEmail = `demo-tech-${tk}@auraintercept.ai`;
    const customerEmail = `demo-customer-${tk}@auraintercept.ai`;

    // 1) Create company
    const { data: company, error: companyErr } = await admin.from('companies').insert({
      name: `[DEMO] ${business_name || `${ind.label} Demo Co.`}`,
      slug,
      subscription_tier: 'performance',
      primary_color: ind.primary,
      secondary_color: ind.secondary,
      contact_email: email,
      contact_phone: prospectPhone || phone(),
      business_phone: phone(),
      address: ind.address,
      service_area_cities: ind.cities,
      service_area_zip_codes: ind.zips,
      service_categories: ind.categories,
      industry_vertical: industryKey,
      trial_ends_at: daysFromNow(TRIAL_HOURS / 24),
      is_demo: true,
      demo_email_opt_in: !!email_opt_in,
      demo_sms_opt_in: !!sms_opt_in,
    }).select('id').single();
    if (companyErr) throw new Error(`company: ${companyErr.message}`);
    const companyId = company.id as string;

    const expiresAt = new Date(Date.now() + TRIAL_HOURS * 3600000).toISOString();
    const userMeta = { aura_demo_trial: true, aura_demo_expires_at: expiresAt };

    // 2) Create three users
    const createUser = async (em: string, fullName: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email: em,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName, ...userMeta },
      });
      if (error || !data?.user) throw new Error(`createUser ${em}: ${error?.message}`);
      return data.user.id;
    };

    const adminUserId = await createUser(adminEmail, `${name} (Demo Owner)`);
    const employeeUserId = await createUser(employeeEmail, `${business_name} Tech`);
    const customerUserId = await createUser(customerEmail, `Sample Customer`);

    // 3) Profile links
    await admin.from('profiles').update({ company_id: companyId, full_name: `${name} (Demo Owner)` }).eq('id', adminUserId);
    await admin.from('profiles').update({ company_id: companyId, full_name: `${business_name} Tech` }).eq('id', employeeUserId);
    await admin.from('profiles').update({ full_name: 'Sample Customer' }).eq('id', customerUserId);

    // 4) Roles
    await admin.from('user_roles').upsert({ user_id: adminUserId, role: 'company_admin' }, { onConflict: 'user_id,role' });
    await admin.from('user_roles').upsert({ user_id: employeeUserId, role: 'employee' }, { onConflict: 'user_id,role' });
    await admin.from('user_roles').upsert({ user_id: customerUserId, role: 'customer' }, { onConflict: 'user_id,role' });

    // 5) Job assignment + customer association
    await admin.from('employee_job_assignments').upsert({
      employee_id: employeeUserId, company_id: companyId, job_type: 'technician',
    }, { onConflict: 'company_id,employee_id,job_type' });
    await admin.from('customer_company_associations').upsert({
      customer_user_id: customerUserId, company_id: companyId,
    }, { onConflict: 'customer_user_id,company_id' });

    // 6) Business hours
    for (let d = 0; d < 7; d++) {
      const closed = d === 0 || d === 6;
      await admin.from('business_hours').upsert({
        company_id: companyId, day_of_week: d, hour_type: 'office',
        open_time: closed ? null : '08:00:00', close_time: closed ? null : '17:00:00',
        is_closed: closed,
      }, { onConflict: 'company_id,day_of_week,hour_type' });
    }

    // 7) Sample customers + appointments
    for (let i = 0; i < 4; i++) {
      await admin.from('customer_profiles').insert({
        company_id: companyId,
        email: `sample${i + 1}-${tk}@example.com`,
        name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        phone: phone(),
        address: `${100 + i * 12} ${rand(STREETS)}, Austin, TX 78701`,
      });
    }
    // The signed-in customer's profile too
    await admin.from('customer_profiles').insert({
      company_id: companyId,
      email: customerEmail,
      name: 'Sample Customer',
      phone: phone(),
      address: ind.address,
    });

    // Industry-specific featured appointment for the demo customer
    const appts = [
      {
        company_id: companyId,
        customer_name: 'Sample Customer',
        customer_email: customerEmail,
        customer_phone: phone(),
        customer_address: ind.address,
        service_type: ind.sampleAppointment.service,
        datetime: hoursFromNow(ind.sampleAppointment.whenOffsetHours),
        duration_minutes: 90,
        status: 'scheduled',
        notes: ind.sampleAppointment.notes,
      },
      // 2 more upcoming
      ...[1, 2].map((i) => ({
        company_id: companyId,
        customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        customer_email: `sample${i}-${tk}@example.com`,
        customer_phone: phone(),
        customer_address: `${100 + i} ${rand(STREETS)}, ${ind.cities[0]}`,
        service_type: rand(ind.services),
        datetime: daysFromNow(2 + i * 2),
        duration_minutes: 60,
        status: 'scheduled',
      })),
      // 2 completed in past
      ...[3, 4].map((i) => ({
        company_id: companyId,
        customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        customer_email: `sample${i}-${tk}@example.com`,
        customer_phone: phone(),
        customer_address: `${100 + i} ${rand(STREETS)}, ${ind.cities[0]}`,
        service_type: rand(ind.services),
        datetime: daysAgo(3 + i * 2),
        duration_minutes: 60,
        status: 'completed',
      })),
      // 1 cancelled
      {
        company_id: companyId,
        customer_name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        customer_email: `sample5-${tk}@example.com`,
        customer_phone: phone(),
        customer_address: `${250} ${rand(STREETS)}, ${ind.cities[0]}`,
        service_type: rand(ind.services),
        datetime: daysFromNow(4),
        duration_minutes: 60,
        status: 'cancelled',
      },
    ];
    await admin.from('appointments').insert(appts);

    // 8) Seed leads — featured industry-specific lead first
    await admin.from('leads').insert([
      {
        company_id: companyId,
        name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`,
        phone: phone(),
        email: `lead1-${tk}@example.com`,
        source: ind.sampleLead.source,
        intent: ind.sampleLead.intent,
        service_interest: ind.sampleLead.serviceInterest,
        priority: ind.sampleLead.priority,
        score: ind.sampleLead.score,
        status: 'new',
      },
      { company_id: companyId, name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`, phone: phone(), email: `lead2-${tk}@example.com`, source: 'chat', intent: 'quote', service_interest: rand(ind.services), priority: 'high', score: 72, status: 'contacted' },
      { company_id: companyId, name: `${rand(SAMPLE_FIRST)} ${rand(SAMPLE_LAST)}`, phone: phone(), email: `lead3-${tk}@example.com`, source: 'widget', intent: 'booking', service_interest: rand(ind.services), priority: 'normal', score: 55, status: 'new' },
    ]);

    // 9) Insert trial record
    const { data: trialRow, error: trialErr } = await admin.from('demo_trials').insert({
      company_id: companyId,
      prospect_email: email.toLowerCase(),
      prospect_name: name,
      prospect_phone: prospectPhone || null,
      industry: industryKey,
      admin_user_id: adminUserId,
      employee_user_id: employeeUserId,
      customer_user_id: customerUserId,
      admin_email: adminEmail,
      employee_email: employeeEmail,
      customer_email: customerEmail,
      password: PASSWORD,
      sms_opt_in: !!sms_opt_in,
      email_opt_in: !!email_opt_in,
      expires_at: expiresAt,
      created_ip: req.headers.get('x-forwarded-for') || null,
    }).select('id').single();
    if (trialErr) throw new Error(`trial: ${trialErr.message}`);
    const trialId = trialRow.id as string;
    const shareUrl = `${PUBLIC_URL}/demo/${trialId}`;

    // 10) Best-effort: email credentials so the prospect can open the demo on desktop + mobile
    let emailed = false;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    // Transactional credentials email — always sent (it's the receipt with their login info),
    // independent of the marketing opt-in flags. Marketing opt-ins are stored separately on demo_trials.
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'Aura Intercept <demos@auraintercept.ai>',
          to: [email],
          subject: `Your ${ind.label} demo is ready — 48 hours of Aura Intercept`,
          html: buildDemoEmailHtml({
            name,
            businessName: business_name,
            industryLabel: ind.label,
            password: PASSWORD,
            expiresAt,
            adminEmail,
            employeeEmail,
            customerEmail,
            shareUrl,
          }),
          text: buildDemoEmailText({
            name,
            businessName: business_name,
            industryLabel: ind.label,
            password: PASSWORD,
            expiresAt,
            adminEmail,
            employeeEmail,
            customerEmail,
            shareUrl,
          }),
        });
        emailed = true;
      } catch (mailErr) {
        console.error('demo email send failed (non-fatal):', mailErr);
      }
    } else {
      console.warn('RESEND_API_KEY not configured — demo credentials email skipped.');
    }

    return new Response(JSON.stringify({
      success: true,
      trial_id: trialId,
      expires_at: expiresAt,
      password: PASSWORD,
      industry: industryKey,
      industry_label: ind.label,
      emailed,
      prospect_email: email,
      share_url: shareUrl,
      admin: { email: adminEmail, redirect: '/dashboard' },
      employee: { email: employeeEmail, redirect: '/technician' },
      customer: { email: customerEmail, redirect: '/customer-portal' },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('create-demo-trial error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
