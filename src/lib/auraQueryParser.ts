// Intent types for Aura query parsing
export type AuraIntent = 
  | 'forecast'
  | 'revenue'
  | 'performance'
  | 'customer_insights'
  | 'kpi'
  | 'comparison'
  | 'general';

export interface ParsedQuery {
  intent: AuraIntent;
  timeframe?: string;
  metric?: string;
  comparison?: boolean;
  originalQuery: string;
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
 * Parse a natural language query and extract intent and parameters
 */
export function parseAuraQuery(query: string): ParsedQuery {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Detect intent
  let detectedIntent: AuraIntent = 'general';
  let maxMatches = 0;

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (intent === 'general') continue;
    
    const matches = patterns.filter(pattern => pattern.test(normalizedQuery)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIntent = intent as AuraIntent;
    }
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
  const isComparison = intentPatterns.comparison.some(pattern => pattern.test(normalizedQuery));

  return {
    intent: detectedIntent,
    timeframe,
    comparison: isComparison,
    originalQuery: query,
  };
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
    case 'kpi':
    case 'comparison':
    case 'general':
    default:
      return 'analytics';
  }
}
