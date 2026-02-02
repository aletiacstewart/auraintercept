/**
 * Intent detection utilities for the Unified Aura system
 * Provides fast local pattern matching before falling back to AI classification
 */

// Business entity keywords for matching
const BUSINESS_ENTITIES = /customers?|leads?|appointments?|quotes?|invoices?|campaigns?|inventory|items?|jobs?|technicians?|employees?|feedback|services?/i;

// Analytics/data query patterns
const ANALYTICS_PATTERNS = [
  /what('?s| is| are| was| were)?\s+(my |our |the )?.*?(revenue|sales|income|profit|earnings)/i,
  /how (much|many)/i,
  /show me.*?(data|report|analytics|metrics|numbers|stats|statistics)/i,
  /compare|trend|forecast|projection|prediction/i,
  /(top|best|worst|highest|lowest) (performing|sellers|customers|employees|technicians|leads)/i,
  /this (month|week|quarter|year|period)/i,
  /last (month|week|quarter|year|period)/i,
  /(average|total|sum|count|mean) (of |for )?/i,
  /analyze|analysis|breakdown|summary/i,
  /performance|metrics|kpi|dashboard/i,
  /growth|decline|increase|decrease/i,
  /what (happened|changed|improved|declined)/i,
  /appointments? (today|this week|scheduled|upcoming|completed)/i,
  /customers? (count|total|new|returning|active)/i,
  /invoices? (pending|paid|overdue|total)/i,
  /leads? (conversion|status|count|new)/i,
  /bookings? (rate|count|today|this week)/i,
  // NEW: Natural question patterns with business entities
  /how many\s+(customers?|leads?|appointments?|quotes?|invoices?|campaigns?|items?)/i,
  /what('?s| is| are)?\s+(my |our |the )?(customer|lead|appointment|quote|invoice|campaign|inventory)\s*(count|total|number)?/i,
  /(count|number|total|amount)\s+of\s+(customers?|leads?|appointments?|quotes?|invoices?)/i,
  /do i have\s+.*(customers?|leads?|appointments?|quotes?|invoices?)/i,
  /(active|pending|open|new|overdue|expired|expiring)\s+(customers?|leads?|quotes?|invoices?)/i,
];

// Navigation/action command patterns
const ACTION_PATTERNS = [
  /^(go to|navigate to|open|take me to|bring up)\s+/i,
  /^(click|press|tap|select|choose|pick)\s+/i,
  /^(create|add|new|make)\s+(a |an )?(new )?(quote|appointment|customer|lead|invoice|job)/i,
  /^(fill|enter|type|input|set)\s+/i,
  /^(search for|find|look up|lookup)\s+/i,
  /^(close|cancel|dismiss|back|return|exit)/i,
  /^(save|submit|confirm|done|finish)/i,
  /^(next|previous|prev|forward|backward)/i,
  /^(scroll|up|down)\s*(page)?/i,
  /^(logout|log out|sign out|signout)/i,
  // Only match "page/screen" if preceded by navigation verb
  /^(go to|open|show)\s+.*(page|screen|section|tab|menu)/i,
];

// Hybrid patterns (both data and action)
const HYBRID_PATTERNS = [
  /(show|display|get).+(then|and then|after that).+(go|navigate|open)/i,
  /(what|how many).+(then|and then|after that).+(go|navigate|open)/i,
  /(analyze|compare).+(then|and then|after that).+(open|click|create)/i,
];

export type IntentType = 'data_query' | 'action_command' | 'hybrid' | 'unknown';

export interface LocalIntentResult {
  intent: IntentType;
  confidence: number;
  matchedPattern?: string;
}

/**
 * Performs fast local intent detection using pattern matching
 * @param text The input text to classify
 * @returns The detected intent with confidence score
 */
export function detectLocalIntent(text: string): LocalIntentResult {
  const normalizedText = text.trim().toLowerCase();
  
  // PRIORITY CHECK 1: Questions starting with "how many" are ALWAYS data queries
  if (/^how many\b/i.test(normalizedText)) {
    return {
      intent: 'data_query',
      confidence: 0.95,
      matchedPattern: 'how_many_question',
    };
  }
  
  // PRIORITY CHECK 2: Questions with "do I have" pattern about entities are data queries
  if (/\bdo i have\b/i.test(normalizedText) && BUSINESS_ENTITIES.test(normalizedText)) {
    return {
      intent: 'data_query',
      confidence: 0.95,
      matchedPattern: 'do_i_have_question',
    };
  }
  
  // PRIORITY CHECK 3: "What is/are my X" questions about entities are data queries
  if (/^what('?s| is| are)?\s+(my |our |the )?/i.test(normalizedText) && BUSINESS_ENTITIES.test(normalizedText)) {
    return {
      intent: 'data_query',
      confidence: 0.9,
      matchedPattern: 'what_is_my_question',
    };
  }
  
  // Check for hybrid first (more specific)
  for (const pattern of HYBRID_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        intent: 'hybrid',
        confidence: 0.85,
        matchedPattern: pattern.source,
      };
    }
  }
  
  // Count matches for analytics and action patterns
  let analyticsScore = 0;
  let actionScore = 0;
  let analyticsMatch: string | undefined;
  let actionMatch: string | undefined;
  
  for (const pattern of ANALYTICS_PATTERNS) {
    if (pattern.test(normalizedText)) {
      analyticsScore += 1;
      if (!analyticsMatch) analyticsMatch = pattern.source;
    }
  }
  
  for (const pattern of ACTION_PATTERNS) {
    if (pattern.test(normalizedText)) {
      actionScore += 1;
      if (!actionMatch) actionMatch = pattern.source;
    }
  }
  
  // Determine intent based on scores
  if (analyticsScore > 0 && actionScore > 0) {
    // Both matched - could be hybrid or needs AI
    if (analyticsScore > actionScore * 2) {
      return { intent: 'data_query', confidence: 0.7, matchedPattern: analyticsMatch };
    }
    if (actionScore > analyticsScore * 2) {
      return { intent: 'action_command', confidence: 0.7, matchedPattern: actionMatch };
    }
    // Similar scores - might be hybrid, let AI decide
    return { intent: 'hybrid', confidence: 0.5 };
  }
  
  if (analyticsScore > 0) {
    const confidence = Math.min(0.6 + (analyticsScore * 0.1), 0.9);
    return { intent: 'data_query', confidence, matchedPattern: analyticsMatch };
  }
  
  if (actionScore > 0) {
    const confidence = Math.min(0.6 + (actionScore * 0.1), 0.9);
    return { intent: 'action_command', confidence, matchedPattern: actionMatch };
  }
  
  // No clear match
  return { intent: 'unknown', confidence: 0 };
}

/**
 * Quick check if text is likely an analytics query
 * Used for fast routing without full classification
 */
export function isLikelyAnalyticsQuery(text: string): boolean {
  const result = detectLocalIntent(text);
  return result.intent === 'data_query' && result.confidence >= 0.6;
}

/**
 * Quick check if text is likely an action command
 * Used for fast routing without full classification
 */
export function isLikelyActionCommand(text: string): boolean {
  const result = detectLocalIntent(text);
  return result.intent === 'action_command' && result.confidence >= 0.6;
}

/**
 * Extracts parts from a hybrid command
 * Returns null if can't reliably split
 */
export function splitHybridCommand(text: string): { dataPart: string; actionPart: string } | null {
  // Common separators for hybrid commands
  const separators = [
    /\s+then\s+/i,
    /\s+and then\s+/i,
    /\s+after that\s+/i,
    /\s*,\s*then\s+/i,
    /\s+and\s+(?=go|navigate|open|click|create)/i,
  ];
  
  for (const separator of separators) {
    const match = text.match(separator);
    if (match && match.index !== undefined) {
      const dataPart = text.slice(0, match.index).trim();
      const actionPart = text.slice(match.index + match[0].length).trim();
      
      if (dataPart && actionPart) {
        return { dataPart, actionPart };
      }
    }
  }
  
  return null;
}
