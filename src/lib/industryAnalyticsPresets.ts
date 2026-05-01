import type { IndustryPack } from '@/hooks/useIndustryPack';
import type { ReportableIntakeField } from '@/lib/intakeAnalytics';

/**
 * Per-vertical analytics presets — pre-built dashboard "shortcuts" that
 * surface the most actionable intake-analytics views for a given industry.
 *
 * Presets reference `field` by intake-field NAME (the same names used in
 * `industry_template_packs.form_schemas[*].fields[*].name`). At render time
 * we filter out presets whose field doesn't exist in the active pack so the
 * UI never offers a broken shortcut.
 */

export type AnalyticsPresetSource = 'appointments' | 'leads';
export type AnalyticsPresetView = 'distribution' | 'trend' | 'completeness';

export interface IndustryAnalyticsPreset {
  id: string;
  /** Short chip label shown to the user */
  label: string;
  /** Optional one-liner shown in the chip's tooltip */
  description?: string;
  source: AnalyticsPresetSource;
  /**
   * Field name to focus. When omitted, used only for `view: 'completeness'`
   * where no field is required.
   */
  field?: string;
  view: AnalyticsPresetView;
}

/**
 * Vertical → ordered list of presets. We keep this static (rather than DB-
 * driven) so non-engineer pack edits don't accidentally break the curated
 * "starter dashboard". Admins can still drill into any field manually.
 */
const PRESETS_BY_INDUSTRY: Record<string, IndustryAnalyticsPreset[]> = {
  hvac: [
    {
      id: 'hvac-system-age',
      label: 'System age distribution',
      description: 'How old are the HVAC systems we service most?',
      source: 'appointments',
      field: 'system_age',
      view: 'distribution',
    },
    {
      id: 'hvac-system-type',
      label: 'System type mix',
      source: 'appointments',
      field: 'system_type',
      view: 'distribution',
    },
    {
      id: 'hvac-issue-trend',
      label: 'Issue type trend',
      source: 'leads',
      field: 'issue_type',
      view: 'trend',
    },
  ],
  plumbing: [
    { id: 'plumbing-issue', label: 'Issue type mix', source: 'appointments', field: 'issue_type', view: 'distribution' },
    { id: 'plumbing-fixture', label: 'Fixture type', source: 'appointments', field: 'fixture_type', view: 'distribution' },
    { id: 'plumbing-emergency', label: 'Emergency vs scheduled', source: 'leads', field: 'is_emergency', view: 'distribution' },
  ],
  electrical: [
    { id: 'electrical-panel-age', label: 'Panel age', source: 'appointments', field: 'panel_age', view: 'distribution' },
    { id: 'electrical-issue', label: 'Issue type', source: 'appointments', field: 'issue_type', view: 'distribution' },
  ],
  roofing: [
    { id: 'roofing-material', label: 'Roof material', source: 'appointments', field: 'roof_material', view: 'distribution' },
    { id: 'roofing-age', label: 'Roof age', source: 'appointments', field: 'roof_age', view: 'distribution' },
    { id: 'roofing-leaks', label: 'Leak reports trend', source: 'leads', field: 'has_leak', view: 'trend' },
  ],
  landscape: [
    { id: 'landscape-lot-size', label: 'Lot size', source: 'appointments', field: 'lot_size', view: 'distribution' },
    { id: 'landscape-service', label: 'Service type', source: 'appointments', field: 'service_type', view: 'distribution' },
  ],
  pest_control: [
    { id: 'pest-type', label: 'Pest type', source: 'appointments', field: 'pest_type', view: 'distribution' },
    { id: 'pest-property', label: 'Property type', source: 'appointments', field: 'property_type', view: 'distribution' },
  ],
  pool_spa: [
    { id: 'pool-type', label: 'Pool type', source: 'appointments', field: 'pool_type', view: 'distribution' },
    { id: 'pool-size', label: 'Pool size', source: 'appointments', field: 'pool_size', view: 'distribution' },
  ],
  appliance_repair: [
    { id: 'appliance-brand', label: 'Brand mix', source: 'appointments', field: 'appliance_brand', view: 'distribution' },
    { id: 'appliance-type', label: 'Appliance type', source: 'appointments', field: 'appliance_type', view: 'distribution' },
  ],
  auto_care: [
    { id: 'auto-make', label: 'Vehicle make', source: 'appointments', field: 'vehicle_make', view: 'distribution' },
    { id: 'auto-service', label: 'Service type', source: 'appointments', field: 'service_type', view: 'distribution' },
  ],
  beauty_wellness: [
    { id: 'beauty-service', label: 'Service mix', source: 'appointments', field: 'service_type', view: 'distribution' },
    { id: 'beauty-stylist', label: 'Stylist preference', source: 'appointments', field: 'preferred_stylist', view: 'distribution' },
  ],
  construction: [
    { id: 'construction-project', label: 'Project type', source: 'leads', field: 'project_type', view: 'distribution' },
    { id: 'construction-budget', label: 'Budget range', source: 'leads', field: 'budget_range', view: 'distribution' },
  ],
  fencing: [
    { id: 'fencing-material', label: 'Fence material', source: 'appointments', field: 'fence_material', view: 'distribution' },
    { id: 'fencing-length', label: 'Linear footage', source: 'appointments', field: 'linear_feet', view: 'distribution' },
  ],
  handyman: [
    { id: 'handyman-task', label: 'Task type', source: 'appointments', field: 'task_type', view: 'distribution' },
    { id: 'handyman-rooms', label: 'Rooms involved', source: 'appointments', field: 'rooms', view: 'distribution' },
  ],
  real_estate: [
    {
      id: 're-preapproval',
      label: 'Pre-approval funnel',
      description: 'How many leads are mortgage-ready?',
      source: 'leads',
      field: 'pre_approved',
      view: 'distribution',
    },
    { id: 're-budget', label: 'Budget range', source: 'leads', field: 'budget_range', view: 'distribution' },
    { id: 're-timeline', label: 'Buying timeline', source: 'leads', field: 'timeline', view: 'distribution' },
  ],
  restaurants: [
    { id: 'rest-party-size', label: 'Party size', source: 'appointments', field: 'party_size', view: 'distribution' },
    { id: 'rest-occasion', label: 'Occasion', source: 'appointments', field: 'occasion', view: 'distribution' },
  ],
  security_systems: [
    { id: 'sec-property-type', label: 'Property type', source: 'leads', field: 'property_type', view: 'distribution' },
    { id: 'sec-system-type', label: 'System type', source: 'leads', field: 'system_type', view: 'distribution' },
  ],
  solar: [
    { id: 'solar-roof-type', label: 'Roof type', source: 'leads', field: 'roof_type', view: 'distribution' },
    { id: 'solar-bill', label: 'Avg electric bill', source: 'leads', field: 'avg_bill', view: 'distribution' },
  ],
  personal_assistant: [
    { id: 'pa-task-type', label: 'Task type', source: 'appointments', field: 'task_type', view: 'distribution' },
    { id: 'pa-frequency', label: 'Frequency', source: 'appointments', field: 'frequency', view: 'distribution' },
  ],
};

/**
 * Generic completeness preset that's universally useful — appended to every
 * vertical's preset list so admins always have a one-click way to spot
 * questions Aura is dropping or customers are skipping.
 */
const UNIVERSAL_TAIL: IndustryAnalyticsPreset[] = [
  {
    id: 'universal-completeness-appointments',
    label: 'Appointment intake completeness',
    description: 'Which questions are getting skipped most often?',
    source: 'appointments',
    view: 'completeness',
  },
  {
    id: 'universal-completeness-leads',
    label: 'Lead intake completeness',
    source: 'leads',
    view: 'completeness',
  },
];

/**
 * Resolve presets for the given pack. Filters out presets whose `field`
 * isn't actually defined in the pack's form schemas so we never offer a
 * shortcut that would land on an empty chart.
 */
export function getAnalyticsPresetsForPack(
  pack: IndustryPack | null | undefined,
  reportableFields: ReportableIntakeField[],
): IndustryAnalyticsPreset[] {
  const industryId = pack?.industry_id;
  const verticalPresets = (industryId && PRESETS_BY_INDUSTRY[industryId]) || [];
  const validNames = new Set(reportableFields.map((f) => f.name));

  const filtered = verticalPresets.filter((p) => {
    if (p.view === 'completeness' && !p.field) return true;
    return p.field ? validNames.has(p.field) : false;
  });

  return [...filtered, ...UNIVERSAL_TAIL];
}

/** Pick the preset to auto-apply on first render (no field already in URL). */
export function pickInitialPreset(
  presets: IndustryAnalyticsPreset[],
): IndustryAnalyticsPreset | null {
  return presets.find((p) => p.view !== 'completeness' && !!p.field) ?? presets[0] ?? null;
}