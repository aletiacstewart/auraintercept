import type { IndustryPack } from '@/hooks/useIndustryPack';
import { getReportableIntakeFields } from '@/lib/intakeAnalytics';

// Intent types for Aura query parsing
export type AuraIntent =
  | 'forecast'
  | 'revenue'
  | 'performance'
  | 'customer_insights'
  | 'kpi'
  | 'comparison'
  | 'intake_analytics'
  | 'general';

export type IntakeAnalyticsView = 'distribution' | 'trend' | 'completeness';
export type IntakeAnalyticsSource = 'appointments' | 'leads';

export interface IntakeAnalyticsTarget {
  source: IntakeAnalyticsSource;
  field?: string;
  view: IntakeAnalyticsView;
}

export interface ParsedQuery {
  intent: AuraIntent;
  timeframe?: string;
  metric?: string;
  comparison?: boolean;
  originalQuery: string;
  /** Populated when intent === 'intake_analytics'. */
  intake?: IntakeAnalyticsTarget;
}

// Pattern definitions for intent detection
const intentPatterns: Record<AuraIntent, RegExp[]> = {
  forecast: [
    /forecast/i,
    /predict(ed|ion)?/i,
    /project(ed|ion)?/i,
    /next\s+(week|month|quarter|year)/i,
    /future/i,
    /trend/i,
    /expect(ed)?/i,
  ],
  revenue: [
    /revenue/i,
    /sales/i,
    /income/i,
    /earnings/i,
    /money/i,
    /profit/i,
    /total\s+(sales|revenue)/i,
  ],
  performance: [
    /performance/i,
    /top\s+performer/i,
    /best\s+employee/i,
    /completion\s+rate/i,
    /efficiency/i,
    /productivity/i,
    /team\s+metrics/i,
  ],
  customer_insights: [
    /customer/i,
    /retention/i,
    /churn/i,
    /satisfaction/i,
    /loyalty/i,
    /repeat\s+customer/i,
  ],
  kpi: [
    /kpi/i,
    /key\s+performance/i,
    /metrics/i,
    /dashboard/i,
    /overview/i,
    /summary/i,
  ],
  comparison: [
    /compare/i,
    /vs\.?/i,
    /versus/i,
    /compared?\s+to/i,
    /last\s+(week|month|quarter|year)/i,
    /previous/i,
    /year\s+over\s+year/i,
    /month\s+over\s+month/i,
  ],
  intake_analytics: [
    /\bintake\b/i,
    /\bfield\s+(distribution|completeness|fill|usage)/i,
    /\b(distribution|completeness)\b.*\bfield/i,
    /which\s+(intake\s+)?fields?\s+(are|is)\s+(blank|empty|missing)/i,
    /\bblank\s+(most\s+)?often\b/i,
    /\bfill\s+rate\b/i,
  ],
  general: [],
};

// Timeframe detection patterns
const timeframePatterns: { pattern: RegExp; value: string }[] = [
  { pattern: /today/i, value: 'today' },
  { pattern: /yesterday/i, value: 'yesterday' },
  { pattern: /this\s+week/i, value: 'this_week' },
  { pattern: /last\s+week/i, value: 'last_week' },
  { pattern: /this\s+month/i, value: 'this_month' },
  { pattern: /last\s+month/i, value: 'last_month' },
  { pattern: /next\s+month/i, value: 'next_month' },
  { pattern: /this\s+quarter/i, value: 'this_quarter' },
  { pattern: /last\s+quarter/i, value: 'last_quarter' },
  { pattern: /this\s+year/i, value: 'this_year' },
  { pattern: /last\s+year/i, value: 'last_year' },
  { pattern: /(\d+)\s+days?/i, value: 'custom_days' },
];

/**
 * Parse a natural language query and extract intent and parameters.
 * Pass `pack` when available so phrases mentioning a vertical-specific
 * field label (e.g. "system age") can promote the query to the
 * `intake_analytics` intent and pre-select the matching field.
 */
export function parseAuraQuery(
  query: string,
  pack?: IndustryPack | null,
): ParsedQuery {
  const normalizedQuery = query.toLowerCase().trim();

  // Detect intent
  let detectedIntent: AuraIntent = 'general';
  let maxMatches = 0;

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (intent === 'general') continue;
    const matches = patterns.filter((pattern) => pattern.test(normalizedQuery)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIntent = intent as AuraIntent;
    }
  }

  // Promote to intake_analytics if any pack-defined field label appears
  // verbatim in the query — even when no generic intake keyword fires.
  const intakeTarget = extractIntakeTarget(normalizedQuery, pack);
  if (intakeTarget && (detectedIntent === 'general' || intakeTarget.field)) {
    detectedIntent = 'intake_analytics';
  }

  // Detect timeframe
  let timeframe: string | undefined;
  for (const { pattern, value } of timeframePatterns) {
    if (pattern.test(normalizedQuery)) {
      timeframe = value;
      break;
    }
  }

  // Detect if it's a comparison query
  const isComparison = intentPatterns.comparison.some((pattern) =>
    pattern.test(normalizedQuery),
  );

  return {
    intent: detectedIntent,
    timeframe,
    comparison: isComparison,
    originalQuery: query,
    intake: detectedIntent === 'intake_analytics' ? intakeTarget ?? defaultIntakeTarget(normalizedQuery) : undefined,
  };
}

/**
 * Resolve `{source, field, view}` from a free-text query against the active
 * industry pack. Returns null when the query has no intake-analytics signal
 * AND no field label matches.
 */
export function extractIntakeTarget(
  normalizedQuery: string,
  pack?: IndustryPack | null,
): IntakeAnalyticsTarget | null {
  const view = detectIntakeView(normalizedQuery);
  const source = detectIntakeSource(normalizedQuery);
  const field = matchPackField(normalizedQuery, pack);

  // Need at least one signal beyond "general".
  const hasIntakeSignal = intentPatterns.intake_analytics.some((p) =>
    p.test(normalizedQuery),
  );
  if (!hasIntakeSignal && !field) return null;

  return { source, field, view };
}

function defaultIntakeTarget(normalizedQuery: string): IntakeAnalyticsTarget {
  return {
    source: detectIntakeSource(normalizedQuery),
    view: detectIntakeView(normalizedQuery),
  };
}

function detectIntakeView(q: string): IntakeAnalyticsView {
  if (/(completeness|complete\b|blank|empty|missing|fill\s+rate)/i.test(q)) {
    return 'completeness';
  }
  if (/(trend|over\s+time|monthly|history|by\s+month)/i.test(q)) {
    return 'trend';
  }
  return 'distribution';
}

function detectIntakeSource(q: string): IntakeAnalyticsSource {
  return /\blead/i.test(q) ? 'leads' : 'appointments';
}

/**
 * Fuzzy-match a pack field by checking the query for the field's label,
 * label-without-spaces, or its raw `name` token.
 */
function matchPackField(q: string, pack?: IndustryPack | null): string | undefined {
  if (!pack) return undefined;
  const fields = getReportableIntakeFields(pack);
  if (fields.length === 0) return undefined;

  // Prefer the longest matching label so "system age" beats "age".
  const candidates = fields
    .map((f) => ({
      name: f.name,
      tokens: [
        f.label.toLowerCase(),
        f.label.toLowerCase().replace(/\s+/g, ''),
        f.name.toLowerCase().replace(/_/g, ' '),
        f.name.toLowerCase(),
      ].filter(Boolean),
    }))
    .sort((a, b) => Math.max(...b.tokens.map((t) => t.length)) - Math.max(...a.tokens.map((t) => t.length)));

  for (const c of candidates) {
    if (c.tokens.some((t) => t.length >= 3 && q.includes(t))) {
      return c.name;
    }
  }
  return undefined;
}

/**
 * Get a suggested response type based on intent
 */
export function getSuggestedVisualization(intent: AuraIntent): 'chart' | 'stat' | 'list' | 'comparison' {
  switch (intent) {
    case 'forecast':
      return 'chart';
    case 'revenue':
      return 'stat';
    case 'performance':
      return 'list';
    case 'customer_insights':
      return 'stat';
    case 'kpi':
      return 'stat';
    case 'comparison':
      return 'comparison';
    case 'intake_analytics':
      return 'chart';
    default:
      return 'stat';
  }
}

/**
 * Get tab to focus based on intent
 */
export function getTabFromIntent(intent: AuraIntent): string {
  switch (intent) {
    case 'revenue':
    case 'forecast':
      return 'revenue';
    case 'performance':
      return 'performance';
    case 'customer_insights':
      return 'insights';
    case 'intake_analytics':
      return 'intake';
    case 'kpi':
    case 'comparison':
    case 'general':
    default:
      return 'analytics';
  }
}

/**
 * Build the deep-link target for the Intake analytics tab. Pure helper so
 * UI components don't reimplement query-string assembly.
 */
export function buildIntakeAnalyticsHref(target: IntakeAnalyticsTarget): string {
  const params = new URLSearchParams();
  params.set('tab', 'intake');
  params.set('source', target.source);
  if (target.field) params.set('field', target.field);
  params.set('view', target.view);
  return `/dashboard/analytics?${params.toString()}`;
}
