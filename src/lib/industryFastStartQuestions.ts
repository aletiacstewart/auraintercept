/**
 * Phase F — Industry-specific Fast Start questions.
 *
 * Lightweight, vertical-aware questions surfaced inside the Fast Start
 * wizard (Step 0) AFTER a business type is picked. Answers are appended
 * to the company's `ai_agent_prompt` at launch so every operative has
 * the context from day one. No schema changes — purely additive.
 *
 * Keep questions short (1-2 lines), open-ended, and answerable in
 * < 30 seconds each. Cap at 4 per vertical to respect the wizard budget.
 */

export interface FastStartQuestion {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

const COMMON_TRADES: FastStartQuestion[] = [
  { key: 'service_radius', label: 'Service area / radius', placeholder: 'e.g. Dallas-Fort Worth, 30 mi radius' },
  { key: 'after_hours', label: 'After-hours / emergency policy', placeholder: 'e.g. 24/7 emergency, $150 trip fee after 6pm' },
  { key: 'pricing_style', label: 'How do you quote pricing?', placeholder: 'e.g. flat-rate book, hourly + parts, free estimate' },
];

export const INDUSTRY_FAST_START_QUESTIONS: Record<string, FastStartQuestion[]> = {
  hvac: [
    ...COMMON_TRADES,
    { key: 'maintenance_plan', label: 'Maintenance plan offered?', placeholder: 'e.g. $15/mo VIP — 2 tune-ups + 15% off repairs' },
  ],
  plumbing: [
    ...COMMON_TRADES,
    { key: 'emergency_types', label: 'What counts as an emergency call?', placeholder: 'e.g. burst pipe, no hot water, sewer backup' },
  ],
  electrical: [
    ...COMMON_TRADES,
    { key: 'permits_handled', label: 'Do you pull permits?', placeholder: 'e.g. yes for panel + service upgrades' },
  ],
  appliance_repair: [
    ...COMMON_TRADES,
    { key: 'brands_serviced', label: 'Brands you service / avoid', placeholder: 'e.g. all majors except Sub-Zero / Viking' },
  ],
  solar: [
    { key: 'service_radius', label: 'Service area', placeholder: 'e.g. Phoenix metro' },
    { key: 'financing', label: 'Financing options offered', placeholder: 'e.g. cash, loan via Sunlight, PPA' },
    { key: 'lead_qualification', label: 'How do you qualify leads?', placeholder: 'e.g. own home, $150+ utility bill, south-facing roof' },
  ],
  roofing: [
    ...COMMON_TRADES,
    { key: 'insurance_claims', label: 'Insurance / storm-claim work?', placeholder: 'e.g. yes — full claims assistance' },
  ],
  landscape: [
    ...COMMON_TRADES,
    { key: 'recurring_plans', label: 'Recurring service plans', placeholder: 'e.g. weekly mowing, monthly maintenance, seasonal cleanup' },
  ],
  fencing: [
    ...COMMON_TRADES,
    { key: 'lead_qualification', label: 'How do you qualify estimate requests?', placeholder: 'e.g. linear feet, material preference, timeline' },
  ],
  pool_spa: [
    ...COMMON_TRADES,
    { key: 'recurring_plans', label: 'Weekly service plans offered', placeholder: 'e.g. $150/mo full chem + clean' },
  ],
  pest_control: [
    ...COMMON_TRADES,
    { key: 'recurring_plans', label: 'Treatment plans offered', placeholder: 'e.g. monthly, quarterly, termite annual' },
  ],
  auto_care: [
    { key: 'service_radius', label: 'Shop location & service area', placeholder: 'e.g. one shop in Austin TX' },
    { key: 'pricing_style', label: 'How do you quote repairs?', placeholder: 'e.g. flat-rate book, free diagnostic with repair' },
    { key: 'specialties', label: 'Specialties / brands', placeholder: 'e.g. European cars, diesel, EV-certified' },
  ],
  handyman: [
    ...COMMON_TRADES,
    { key: 'min_job', label: 'Minimum job / trip charge', placeholder: 'e.g. 1-hour minimum, $99 trip fee' },
  ],
  construction: [
    ...COMMON_TRADES,
    { key: 'project_size', label: 'Typical project size you take', placeholder: 'e.g. $5K-$75K residential remodels' },
  ],
  security_systems: [
    ...COMMON_TRADES,
    { key: 'monitoring', label: '24/7 monitoring offered?', placeholder: 'e.g. yes — $35/mo, UL-listed central station' },
  ],
  restaurants: [
    { key: 'cuisine', label: 'Cuisine & vibe', placeholder: 'e.g. wood-fired Neapolitan pizza, casual' },
    { key: 'reservations', label: 'Reservation / walk-in policy', placeholder: 'e.g. reservations for parties of 4+, walk-ins welcome' },
    { key: 'private_events', label: 'Private events / catering?', placeholder: 'e.g. yes — private dining room seats 30, off-site catering' },
    { key: 'dietary', label: 'Dietary accommodations', placeholder: 'e.g. GF + vegan options, no nuts in kitchen' },
  ],
  real_estate: [
    { key: 'service_radius', label: 'Markets you serve', placeholder: 'e.g. Greater Boston, North Shore' },
    { key: 'specialty', label: 'Buyer / seller / both?', placeholder: 'e.g. 70% sellers, 30% buyers, focus on $750K-$2M' },
    { key: 'lead_qualification', label: 'How do you qualify leads?', placeholder: 'e.g. timeframe, financing pre-approval, current home status' },
  ],
  saas_platform: [
    { key: 'product_summary', label: 'What does your product do?', placeholder: 'e.g. inventory management for small e-com brands' },
    { key: 'icp', label: 'Ideal customer profile', placeholder: 'e.g. Shopify stores doing $1M-$20M/yr' },
    { key: 'pricing_style', label: 'Pricing model', placeholder: 'e.g. $99/$299/$799 monthly tiers, 14-day trial' },
    { key: 'support_sla', label: 'Support SLA', placeholder: 'e.g. 4-hr response Mon-Fri, 24-hr weekends' },
  ],
  personal_assistant: [
    { key: 'service_summary', label: 'What services do you offer?', placeholder: 'e.g. errand-running, scheduling, travel booking' },
    { key: 'pricing_style', label: 'Pricing structure', placeholder: 'e.g. $50/hr or $1500/mo retainer' },
    { key: 'lead_qualification', label: 'How do you qualify clients?', placeholder: 'e.g. min 10 hrs/mo, in NYC metro' },
  ],

  // Booking cluster
  salon: [
    { key: 'service_menu', label: 'Top services & price range', placeholder: 'e.g. cut $65, color $150-$300, balayage $250+' },
    { key: 'stylist_levels', label: 'Stylist levels / pricing tiers', placeholder: 'e.g. Stylist / Senior / Master' },
    { key: 'cancellation', label: 'Cancellation & late policy', placeholder: 'e.g. 24-hr notice, card on file for chemical services' },
    { key: 'walk_ins', label: 'Walk-ins accepted?', placeholder: 'e.g. yes for cuts, by-appointment for color' },
  ],
  fitness: [
    { key: 'class_types', label: 'Class types & schedule', placeholder: 'e.g. yoga, HIIT, strength — 6am to 8pm daily' },
    { key: 'membership', label: 'Membership / pricing options', placeholder: 'e.g. $30 drop-in, 10-pack $250, unlimited $189/mo' },
    { key: 'beginner_policy', label: 'Beginner / new-client experience', placeholder: 'e.g. free intro class, Level 1 recommended first' },
    { key: 'cancellation', label: 'Cancellation policy', placeholder: 'e.g. 12-hr notice or class credit forfeited' },
  ],
  professional: [
    { key: 'service_summary', label: 'What services do you offer?', placeholder: 'e.g. fractional CFO, fundraising advisory' },
    { key: 'icp', label: 'Ideal client profile', placeholder: 'e.g. Series A SaaS, $1M-$10M ARR' },
    { key: 'engagement_model', label: 'Engagement model', placeholder: 'e.g. monthly retainer $5K-$15K, project SOW' },
    { key: 'discovery_call', label: 'Discovery-call process', placeholder: 'e.g. 30 min, then written proposal in 2 days' },
  ],

  // Healthcare — kept generic & HIPAA-safe (no medical specifics)
  chiropractic: [
    { key: 'service_radius', label: 'Office location & service area', placeholder: 'e.g. Tempe AZ' },
    { key: 'insurance_accepted', label: 'Insurance accepted', placeholder: 'e.g. BCBS, Aetna, United, cash plans available' },
    { key: 'new_patient_flow', label: 'New patient appointment flow', placeholder: 'e.g. 60-min eval, then treatment plan visit' },
    { key: 'cancellation', label: 'Cancellation policy', placeholder: 'e.g. 24-hr notice required' },
  ],
  dental: [
    { key: 'insurance_accepted', label: 'Insurance accepted', placeholder: 'e.g. most PPOs, in-house membership for uninsured' },
    { key: 'service_summary', label: 'Services offered', placeholder: 'e.g. general, cosmetic, Invisalign, implants' },
    { key: 'new_patient_flow', label: 'New patient flow', placeholder: 'e.g. exam + cleaning + X-rays at first visit' },
    { key: 'after_hours', label: 'After-hours / emergency policy', placeholder: 'e.g. on-call line for active patients' },
  ],
  medical_office: [
    { key: 'service_summary', label: 'Practice type & services', placeholder: 'e.g. family medicine, well-visits, sick-visits' },
    { key: 'insurance_accepted', label: 'Insurance accepted', placeholder: 'e.g. major commercial + Medicare' },
    { key: 'new_patient_policy', label: 'New patient acceptance', placeholder: 'e.g. accepting new patients, waitlist 4 weeks' },
    { key: 'cancellation', label: 'Cancellation / no-show policy', placeholder: 'e.g. $50 fee after 24 hrs notice' },
  ],
  optometry: [
    { key: 'insurance_accepted', label: 'Vision & medical insurance', placeholder: 'e.g. VSP, EyeMed, Davis + most medical' },
    { key: 'service_summary', label: 'Services offered', placeholder: 'e.g. comprehensive exams, contacts, dry-eye, kids' },
    { key: 'new_patient_flow', label: 'New patient flow', placeholder: 'e.g. 45-min exam, optical try-on after' },
    { key: 'cancellation', label: 'Cancellation policy', placeholder: 'e.g. 24-hr notice' },
  ],
  physical_therapy: [
    { key: 'insurance_accepted', label: 'Insurance accepted', placeholder: 'e.g. most plans, cash-pay $90/session' },
    { key: 'referral_required', label: 'Referral required?', placeholder: 'e.g. yes for most insurance, direct-access OK in our state' },
    { key: 'service_summary', label: 'Specialties', placeholder: 'e.g. ortho, sports, post-op, pelvic floor' },
    { key: 'session_length', label: 'Session length & frequency', placeholder: 'e.g. 45 min, 2x/week typical' },
  ],
  veterinary: [
    { key: 'service_summary', label: 'Species & services', placeholder: 'e.g. dogs/cats, wellness + surgery + dental' },
    { key: 'after_hours', label: 'After-hours / emergency policy', placeholder: 'e.g. refer to BluePearl after 6pm' },
    { key: 'new_patient_flow', label: 'New patient flow', placeholder: 'e.g. records request, then 30-min new-patient exam' },
    { key: 'cancellation', label: 'Cancellation policy', placeholder: 'e.g. 24-hr notice, $30 no-show fee' },
  ],
};

export const GENERIC_FAST_START_QUESTIONS: FastStartQuestion[] = [
  { key: 'service_summary', label: 'What services do you offer?', placeholder: 'e.g. brief 1-line description of your top services' },
  { key: 'service_radius', label: 'Service area', placeholder: 'e.g. metro area, ZIP codes, or "national online"' },
  { key: 'pricing_style', label: 'How do you quote pricing?', placeholder: 'e.g. flat-rate, hourly, per-project' },
];

export function getFastStartQuestions(industryId: string | null | undefined): FastStartQuestion[] {
  if (!industryId) return [];
  return INDUSTRY_FAST_START_QUESTIONS[industryId] ?? GENERIC_FAST_START_QUESTIONS;
}

/**
 * Render answered questions as a Q/A block suitable for appending to
 * `ai_agent_prompt`. Skips empty answers.
 */
export function formatFastStartAnswers(
  industryId: string | null | undefined,
  answers: Record<string, string>,
): string {
  const qs = getFastStartQuestions(industryId);
  const lines = qs
    .map((q) => {
      const v = (answers[q.key] ?? '').trim();
      return v ? `Q: ${q.label}\nA: ${v}` : null;
    })
    .filter(Boolean);
  if (lines.length === 0) return '';
  return `Business context (from Fast Start):\n${lines.join('\n\n')}`;
}


const FAST_START_BLOCK_HEADER = 'Business context (from Fast Start):';

/** Round-trip helpers so admins can edit the answers later in the KB. */
export function parseFastStartAnswers(
  industryId: string | null | undefined,
  prompt: string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!prompt) return out;
  const idx = prompt.indexOf(FAST_START_BLOCK_HEADER);
  if (idx === -1) return out;
  const block = prompt.slice(idx + FAST_START_BLOCK_HEADER.length);
  const qs = getFastStartQuestions(industryId);
  const labelToKey = new Map(qs.map((q) => [q.label, q.key]));
  const re = /Q:\s*([^\n]+)\nA:\s*([\s\S]*?)(?=\n\nQ:|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const key = labelToKey.get(m[1].trim());
    if (key) out[key] = m[2].trim();
  }
  return out;
}

/** Replace or append the Fast Start block inside the prompt, preserving
 *  whatever the admin wrote above it. */
export function upsertFastStartBlock(
  prompt: string | null | undefined,
  newBlock: string,
): string {
  const base = (prompt ?? '').trimEnd();
  const idx = base.indexOf(FAST_START_BLOCK_HEADER);
  if (idx === -1) {
    if (!newBlock) return base;
    return base ? `${base}\n\n${newBlock}` : newBlock;
  }
  const before = base.slice(0, idx).trimEnd();
  if (!newBlock) return before;
  return before ? `${before}\n\n${newBlock}` : newBlock;
}

