// Voice navigation utilities for hands-free form control

export type VoiceCommand = 
  | 'next' 
  | 'tab' 
  | 'back' 
  | 'previous' 
  | 'clear' 
  | 'erase'
  | 'save job' 
  | 'submit' 
  | 'send'
  | 'clock out' 
  | 'logout' 
  | 'sign out'
  | 'hey aura'
  | 'ask aura'
  | 'aura help'
  | 'cancel'
  | 'stop listening'
  | 'navigate';

/**
 * Sanitize voice dictation text based on field type
 * - Removes trailing punctuation added by speech recognition
 * - Cleans phone numbers (removes spaces, keeps only digits)
 * - Normalizes email addresses (converts "at" to @, "dot" to .)
 */
export function sanitizeVoiceTextForField(text: string, fieldType?: string): string {
  let sanitized = text.trim();
  
  // Remove trailing punctuation (periods, commas added by speech recognition)
  sanitized = sanitized.replace(/[.,!?]+$/, '');
  
  // Detect field type from context
  const lowerFieldType = (fieldType || '').toLowerCase();
  const isPhone = lowerFieldType === 'tel' || 
                  /phone|mobile|cell|tel/i.test(fieldType || '') ||
                  /^\d[\d\s.\-()]+$/.test(sanitized.replace(/\s/g, ''));
  
  const isEmail = lowerFieldType === 'email' || 
                  /email/i.test(fieldType || '') ||
                  sanitized.toLowerCase().includes('@') || 
                  sanitized.toLowerCase().includes(' at ');
  
  if (isPhone) {
    // Remove all non-digit characters for phone numbers (keep + for international)
    sanitized = sanitized.replace(/[^\d+]/g, '');
  } else if (isEmail) {
    // Convert spoken "at" to @ and "dot" to .
    sanitized = sanitized
      .replace(/\s+at\s+/gi, '@')
      .replace(/\s+dot\s+/gi, '.')
      .replace(/\s/g, '') // Remove all spaces from email
      .replace(/\.+$/, '') // Remove trailing dots
      .toLowerCase();
  }
  
  return sanitized;
}

// Comprehensive page routes for voice navigation - matches sidebar labels exactly
export const PAGE_ROUTES: Record<string, string> = {
  // Overview Section
  'dashboard': '/dashboard',
  'home': '/dashboard',
  'quick setup': '/dashboard/quick-setup',
  'settings': '/dashboard/quick-setup',
  'setup': '/dashboard/quick-setup',
  'web presence': '/dashboard/smart-website',
  'smart website': '/dashboard/smart-website',
  'my schedule': '/dashboard/appointments',
  'ai console': '/technician/ai-console',
  'my jobs': '/technician/jobs',
  'calendar': '/technician/calendar',
  'job history': '/technician/history',
  'availability': '/technician/availability',
  
  // Business Management Section (exact sidebar labels)
  'business ops overview': '/dashboard/business-operations',
  'business operations': '/dashboard/business-operations',
  'business ops': '/dashboard/business-operations',
  'business management': '/dashboard/business-operations',
  'ops hub': '/dashboard/business-operations',
  'companies': '/dashboard/companies',
  'employees': '/dashboard/employees',
  'customers': '/dashboard/customers',
  'leads': '/dashboard/leads',
  'appointments': '/dashboard/appointments',
  'quotes': '/dashboard/quotes',
  'invoices': '/dashboard/invoices',
  'inventory': '/dashboard/inventory',
  
  // Analytics & Reports Section (now part of Business Operations)
  'ask aura': '/dashboard/business-operations?tab=analytics',
  'aura': '/dashboard/business-operations?tab=analytics',
  'analytics': '/dashboard/business-operations?tab=analytics',
  'analytics and reports': '/dashboard/business-operations?tab=analytics',
  'analytics reports': '/dashboard/business-operations?tab=analytics',
  'subscription analytics': '/dashboard/subscription-analytics',
  
  // Business Mobile Consoles Section
  'business mgt ops console': '/dashboard/ai-consoles/business-mgt-ops',
  'business management ops': '/dashboard/ai-consoles/business-mgt-ops',
  'analytics & reports ops': '/dashboard/ai-consoles/analytics',
  'analytics and reports ops': '/dashboard/ai-consoles/analytics',
  'marketing & sales ops': '/dashboard/ai-consoles/marketing-sales',
  'marketing and sales ops': '/dashboard/ai-consoles/marketing-sales',
  'marketing ops': '/dashboard/ai-consoles/marketing-sales',
  'sales ops': '/dashboard/ai-consoles/marketing-sales',
  'social signal': '/dashboard/ai-consoles/social-media',
  'social signal ops': '/dashboard/ai-consoles/social-media',
  'social media signal': '/dashboard/ai-consoles/social-media',
  'social media signal ops': '/dashboard/ai-consoles/social-media',
  'aura social signal': '/dashboard/ai-consoles/social-media',
  'aura social signal ops': '/dashboard/ai-consoles/social-media',
  'business mgt ops install': '/dashboard/business-mgt-ops-install',
  
  // Field Ops Consoles & Apps Section
  'technician-field ops': '/dashboard/ai-consoles/field-ops',
  'technician field ops': '/dashboard/ai-consoles/field-ops',
  'field ops': '/dashboard/ai-consoles/field-ops',
  'field operations': '/dashboard/ai-consoles/field-ops',
  'dispatch-field ops': '/dashboard/dispatch-field-ops',
  'dispatch field ops': '/dashboard/dispatch-field-ops',
  'dispatch': '/dashboard/dispatch-field-ops',
  'technician field ops install': '/dashboard/field-ops-install',
  'dispatch field ops install': '/dashboard/dispatch-field-ops-install',
  
  // Customer Consoles & Apps Section
  'customer portal': '/dashboard/ai-consoles/customer-portal',
  'customer website app': '/dashboard/customer-website-app',
  'customer portal app install': '/dashboard/customer-portal-app-install',
  
  // Configuration Section
  'ai operatives hub': '/dashboard/ai-agents',
  'ai operatives': '/dashboard/ai-agents',
  'operatives hub': '/dashboard/ai-agents',
  'ai agents hub': '/dashboard/ai-agents',
  'ai agents': '/dashboard/ai-agents',
  'knowledge base': '/dashboard/knowledge',
  'knowledge': '/dashboard/knowledge',
  'calculators': '/dashboard/calculators',
  'profile': '/technician/profile',
  'install app': '/technician/install',
  
  // 3rd Party Integrations Section
  'overview': '/dashboard/3rd-party-overview',
  'integrations': '/dashboard/3rd-party-overview',
  'integrations overview': '/dashboard/3rd-party-overview',
  '3rd party overview': '/dashboard/3rd-party-overview',
  'voice agent': '/dashboard/integrations/voice',
  'voice integration': '/dashboard/integrations/voice',
  'sms & text': '/dashboard/integrations/sms',
  'sms and text': '/dashboard/integrations/sms',
  'sms': '/dashboard/integrations/sms',
  'sms settings': '/dashboard/integrations/sms',
  'text': '/dashboard/integrations/sms',
  'text settings': '/dashboard/integrations/sms',
  'email': '/dashboard/integrations/email',
  'email integration': '/dashboard/integrations/email',
  'email settings': '/dashboard/integrations/email',
  'crm': '/dashboard/integrations/crm',
  'crm integration': '/dashboard/integrations/crm',
  'calendar integration': '/dashboard/integrations/calendar',
  
  // Platform Resources Section
  'platform issues': '/dashboard/platform-issues',
  'platform guides': '/dashboard/platform-guides',
  'help': '/dashboard/help',
  'architecture': '/dashboard/architecture',
  'export docs': '/dashboard/export-docs',
  
  // Other pages
  'campaigns': '/dashboard/campaigns',
};
// Question words that indicate a data query, not navigation
const QUESTION_INDICATORS = [
  'how many', 'how much', 'what is', 'what are', 'what\'s',
  'do i have', 'do we have', 'are there', 'is there',
  'count', 'total', 'sum', 'average', 'list', 'tell me',
  'show me the', 'give me', 'get me', 'find me',
  'pending', 'overdue', 'upcoming', 'recent', 'today',
  'this week', 'this month', 'last week', 'last month',
  '?', 'revenue', 'sales', 'profit', 'status'
];

// Check if text is a data query rather than navigation
export function isDataQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return QUESTION_INDICATORS.some(indicator => lower.includes(indicator));
}

// Parse navigation command and extract destination with fuzzy matching
// IMPORTANT: Only matches explicit navigation commands, not entity mentions
export function parseNavigationCommand(text: string): string | null {
  const normalizedText = text.toLowerCase().trim();
  
  // FIRST: Reject if this looks like a data query
  if (isDataQuery(normalizedText)) {
    return null;
  }
  
  // Only match EXPLICIT navigation verbs - must have clear intent to navigate
  const navigationPatterns = [
    /\b(?:go to|navigate to|open|take me to|switch to)\s+(.+)/i,
  ];
  
  // "show" is intentionally excluded - it's ambiguous ("show me revenue" vs "show customers page")
  // Only allow "show" with explicit "page" suffix
  const showPagePattern = /\bshow\s+(?:the\s+)?(.+?)\s+page\b/i;
  const showPageMatch = normalizedText.match(showPagePattern);
  if (showPageMatch) {
    const destination = showPageMatch[1].trim();
    if (PAGE_ROUTES[destination]) {
      return destination;
    }
  }
  
  for (const pattern of navigationPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const destination = match[1].trim();
      
      // 1. Exact match
      if (PAGE_ROUTES[destination]) {
        return destination;
      }
      
      // 2. Try with common word replacements
      const normalized = destination
        .replace(/&/g, 'and')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ');
      if (PAGE_ROUTES[normalized]) {
        return normalized;
      }
      
      // 3. Partial match (find best match)
      const matches = Object.keys(PAGE_ROUTES).filter(key => 
        key.includes(destination) || destination.includes(key)
      );
      if (matches.length > 0) {
        // Return the shortest match (most specific)
        return matches.sort((a, b) => a.length - b.length)[0];
      }
      
      // 4. Word overlap matching
      const destWords = destination.split(' ').filter(w => w.length > 2);
      let bestMatch: string | null = null;
      let bestScore = 0;
      for (const key of Object.keys(PAGE_ROUTES)) {
        const keyWords = key.split(' ');
        const overlap = destWords.filter(w => keyWords.some(kw => kw.includes(w) || w.includes(kw))).length;
        if (overlap > bestScore) {
          bestScore = overlap;
          bestMatch = key;
        }
      }
      if (bestMatch && bestScore >= 1) {
        return bestMatch;
      }
    }
  }
  
  return null;
}

// Parse search intent from voice input
export interface SearchIntent {
  intent: 'search' | 'filter' | 'lookup';
  query: string;
}

export function parseSearchIntent(text: string): SearchIntent | null {
  const normalizedText = text.toLowerCase().trim();
  
  const searchPatterns = [
    /\b(?:search for|search|find|look up|lookup|look for)\s+(.+)/i,
    /\b(?:filter by|show only|display)\s+(.+)/i,
  ];
  
  for (const pattern of searchPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      return {
        intent: 'search',
        query: match[1].trim(),
      };
    }
  }
  
  return null;
}

export interface CommandResult {
  success: boolean;
  action: string;
  message?: string;
}

// AI-interpreted action from the voice-navigator edge function
export interface AIAction {
  action: 'navigate' | 'click_button' | 'click_card' | 'search' | 'fill_field' | 'focus_field' | 'open_form' | 'scroll' | 'unknown';
  target?: string;
  value?: string;
  route?: string;
  confidence?: number;
  message?: string;
}

// Get all focusable elements within a container
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const focusableSelectors = [
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'button:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

// Move focus to the next element
export function focusNext(): CommandResult {
  const focusable = getFocusableElements();
  const current = document.activeElement as HTMLElement;
  const currentIndex = focusable.indexOf(current);
  
  if (currentIndex === -1 || currentIndex === focusable.length - 1) {
    focusable[0]?.focus();
  } else {
    focusable[currentIndex + 1]?.focus();
  }
  
  return { success: true, action: 'focus_next', message: 'Moved to next field' };
}

// Move focus to the previous element
export function focusPrevious(): CommandResult {
  const focusable = getFocusableElements();
  const current = document.activeElement as HTMLElement;
  const currentIndex = focusable.indexOf(current);
  
  if (currentIndex <= 0) {
    focusable[focusable.length - 1]?.focus();
  } else {
    focusable[currentIndex - 1]?.focus();
  }
  
  return { success: true, action: 'focus_previous', message: 'Moved to previous field' };
}

// Clear the current field's content
export function clearCurrentField(): CommandResult {
  const current = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
  
  if (current && ('value' in current)) {
    // Use native setter to properly trigger React state updates
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    
    nativeInputValueSetter?.call(current, '');
    const event = new Event('input', { bubbles: true });
    current.dispatchEvent(event);
    return { success: true, action: 'clear_field', message: 'Field cleared' };
  }
  
  return { success: false, action: 'clear_field', message: 'No field to clear' };
}

// Find and click the primary submit button
export function submitForm(): CommandResult {
  // Try to find the primary submit button
  const submitButton = document.querySelector<HTMLButtonElement>(
    'button[type="submit"], ' +
    'button.primary, ' +
    'button[data-primary="true"], ' +
    'form button:last-of-type'
  );
  
  if (submitButton) {
    submitButton.click();
    return { success: true, action: 'submit', message: 'Form submitted' };
  }
  
  // Try to submit the form containing the active element
  const activeElement = document.activeElement as HTMLElement;
  const form = activeElement?.closest('form');
  if (form) {
    form.requestSubmit();
    return { success: true, action: 'submit', message: 'Form submitted' };
  }
  
  return { success: false, action: 'submit', message: 'No form to submit' };
}

// Find and click a button by its text content
export function clickButtonByText(text: string): CommandResult {
  const normalizedText = text.toLowerCase().trim();
  const buttons = document.querySelectorAll('button');
  
  // FIRST: Try matching by data-voice-label (highest priority - exact match)
  for (const button of buttons) {
    const voiceLabel = button.getAttribute('data-voice-label')?.toLowerCase().trim() || '';
    if (voiceLabel === normalizedText) {
      (button as HTMLButtonElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  // SECOND: Try matching by data-voice-label (partial match)
  for (const button of buttons) {
    const voiceLabel = button.getAttribute('data-voice-label')?.toLowerCase().trim() || '';
    if (voiceLabel && (voiceLabel.includes(normalizedText) || normalizedText.includes(voiceLabel))) {
      (button as HTMLButtonElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  // THIRD: Try exact text match
  for (const button of buttons) {
    const buttonText = button.textContent?.toLowerCase().trim() || '';
    if (buttonText === normalizedText) {
      (button as HTMLButtonElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  // FOURTH: Try partial text match
  for (const button of buttons) {
    const buttonText = button.textContent?.toLowerCase().trim() || '';
    if (buttonText.includes(normalizedText) || normalizedText.includes(buttonText)) {
      (button as HTMLButtonElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  // FIFTH: Try matching by aria-label
  for (const button of buttons) {
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    if (ariaLabel.includes(normalizedText)) {
      (button as HTMLButtonElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  // Try matching links styled as buttons
  const links = document.querySelectorAll('a');
  for (const link of links) {
    const linkText = link.textContent?.toLowerCase().trim() || '';
    if (linkText.includes(normalizedText)) {
      (link as HTMLAnchorElement).click();
      return { success: true, action: 'click_button', message: `Clicked "${text}"` };
    }
  }
  
  return { success: false, action: 'click_button', message: `Button "${text}" not found` };
}

// Find and click a card by its label
export function clickCardByLabel(label: string): CommandResult {
  const normalizedLabel = label.toLowerCase().trim();
  
  // Look for clickable cards with matching text
  const clickableElements = document.querySelectorAll('[class*="cursor-pointer"], [role="button"], [data-voice-label]');
  
  for (const element of clickableElements) {
    const elementText = element.textContent?.toLowerCase() || '';
    const voiceLabel = element.getAttribute('data-voice-label')?.toLowerCase() || '';
    
    if (elementText.includes(normalizedLabel) || voiceLabel.includes(normalizedLabel)) {
      (element as HTMLElement).click();
      return { success: true, action: 'click_card', message: `Opened "${label}"` };
    }
  }
  
  // Also check for Card components specifically
  const cards = document.querySelectorAll('[class*="Card"], .card');
  for (const card of cards) {
    const cardText = card.textContent?.toLowerCase() || '';
    if (cardText.includes(normalizedLabel)) {
      // Try to find and click the card or its first clickable child
      const clickableChild = card.querySelector('button, a, [role="button"]') as HTMLElement;
      if (clickableChild) {
        clickableChild.click();
      } else {
        (card as HTMLElement).click();
      }
      return { success: true, action: 'click_card', message: `Opened "${label}"` };
    }
  }
  
  return { success: false, action: 'click_card', message: `Card "${label}" not found` };
}

// Fill a form field by its label
export function fillFieldByLabel(label: string, value: string): CommandResult {
  const normalizedLabel = label.toLowerCase().trim();
  
  // Find label element
  const labels = document.querySelectorAll('label');
  for (const labelEl of labels) {
    if (labelEl.textContent?.toLowerCase().includes(normalizedLabel)) {
      const forId = labelEl.getAttribute('for');
      let input: HTMLInputElement | HTMLTextAreaElement | null = null;
      
      if (forId) {
        input = document.getElementById(forId) as HTMLInputElement | HTMLTextAreaElement;
      } else {
        // Try to find input within or after the label
        input = labelEl.querySelector('input, textarea') || 
                labelEl.nextElementSibling?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
      }
      
      if (input) {
        input.focus();
        
        // Sanitize the value based on input type
        const fieldType = input.type || input.getAttribute('data-field-type') || '';
        const sanitizedValue = sanitizeVoiceTextForField(value, fieldType);
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        
        nativeInputValueSetter?.call(input, sanitizedValue);
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        return { success: true, action: 'fill_field', message: `Set "${label}" to "${sanitizedValue}"` };
      }
    }
  }
  
  // Try by placeholder
  const inputs = document.querySelectorAll('input, textarea');
  for (const input of inputs) {
    const placeholder = (input as HTMLInputElement).placeholder?.toLowerCase() || '';
    if (placeholder.includes(normalizedLabel)) {
      (input as HTMLInputElement).focus();
      
      // Sanitize the value based on input type
      const fieldType = (input as HTMLInputElement).type || input.getAttribute('data-field-type') || '';
      const sanitizedValue = sanitizeVoiceTextForField(value, fieldType);
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      
      nativeInputValueSetter?.call(input, sanitizedValue);
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      return { success: true, action: 'fill_field', message: `Set "${label}" to "${sanitizedValue}"` };
    }
  }
  
  return { success: false, action: 'fill_field', message: `Field "${label}" not found` };
}

// Get visible button labels for AI context
export function getVisibleButtonLabels(): string[] {
  const buttons = document.querySelectorAll('button:not([disabled])');
  const priorityLabels: string[] = [];  // Voice-labeled buttons first (action buttons)
  const regularLabels: string[] = [];
  
  buttons.forEach(button => {
    // Check for data-voice-label first (highest priority)
    const voiceLabel = button.getAttribute('data-voice-label')?.trim();
    if (voiceLabel && voiceLabel.length > 0 && voiceLabel.length < 50) {
      priorityLabels.push(voiceLabel);
    }
    
    const text = button.textContent?.trim();
    if (text && text.length > 0 && text.length < 50) {
      regularLabels.push(text);
    }
  });
  
  // Combine: priority (voice-labeled) buttons first, then regular
  const combined = [...priorityLabels, ...regularLabels];
  return [...new Set(combined)].slice(0, 30); // Increased limit to 30
}

// Get visible card labels for AI context
export function getVisibleCardLabels(): string[] {
  const cards = document.querySelectorAll('[data-voice-label], [class*="Card"] h3, [class*="Card"] h4');
  const labels: string[] = [];
  
  cards.forEach(card => {
    const voiceLabel = card.getAttribute('data-voice-label');
    const text = voiceLabel || card.textContent?.trim();
    if (text && text.length > 0 && text.length < 100) {
      labels.push(text);
    }
  });
  
  return [...new Set(labels)].slice(0, 20); // Limit to 20 unique labels
}

// Get visible form field labels for AI context
export function getVisibleFieldLabels(): string[] {
  const labels = document.querySelectorAll('label');
  const fieldLabels: string[] = [];
  
  labels.forEach(label => {
    const text = label.textContent?.trim();
    if (text && text.length > 0 && text.length < 50) {
      fieldLabels.push(text);
    }
  });
  
  // Also check for placeholders
  const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
  inputs.forEach(input => {
    const placeholder = (input as HTMLInputElement).placeholder?.trim();
    if (placeholder && placeholder.length > 0 && placeholder.length < 50) {
      fieldLabels.push(placeholder);
    }
  });
  
  return [...new Set(fieldLabels)].slice(0, 20); // Limit to 20 unique labels
}

// Focus a form field by its label (without filling it)
export function focusFieldByLabel(label: string): CommandResult {
  const normalizedLabel = label.toLowerCase().trim();
  
  // Find label element
  const labels = document.querySelectorAll('label');
  for (const labelEl of labels) {
    const labelText = labelEl.textContent?.toLowerCase().trim() || '';
    if (labelText.includes(normalizedLabel) || normalizedLabel.includes(labelText)) {
      const forId = labelEl.getAttribute('for');
      let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
      
      if (forId) {
        input = document.getElementById(forId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      } else {
        // Try to find input within or after the label
        input = labelEl.querySelector('input, textarea, select') || 
                labelEl.nextElementSibling?.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      }
      
      if (input) {
        input.focus();
        return { success: true, action: 'focus_field', message: `Focused "${label}" field` };
      }
    }
  }
  
  // Try by placeholder
  const inputs = document.querySelectorAll('input, textarea');
  for (const input of inputs) {
    const placeholder = (input as HTMLInputElement).placeholder?.toLowerCase() || '';
    if (placeholder.includes(normalizedLabel)) {
      (input as HTMLInputElement).focus();
      return { success: true, action: 'focus_field', message: `Focused "${label}" field` };
    }
  }
  
  // Try by name attribute
  for (const input of inputs) {
    const name = (input as HTMLInputElement).name?.toLowerCase() || '';
    if (name.includes(normalizedLabel)) {
      (input as HTMLInputElement).focus();
      return { success: true, action: 'focus_field', message: `Focused "${label}" field` };
    }
  }
  
  return { success: false, action: 'focus_field', message: `Field "${label}" not found` };
}

// Check if text is likely dictation content (not a command)
export function isLikelyDictationText(text: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  
  // Command keywords that indicate this is NOT dictation
  const commandPatterns = [
    /^(go to|navigate to|open|show|take me to|switch to)\s/i,
    /^(click|press|tap|select)\s/i,
    /^(search|find|look up|lookup|look for)\s/i,
    /^(set|fill|enter|type|put)\s.+\s(to|in|into|with)\s/i,
    /^(new|create|add)\s/i,
    /^(scroll|page)\s(up|down)/i,
    /\s(field|button|card|page)$/i,
    /^(next|back|previous|tab|clear|erase|save|submit|cancel|stop)/i,
  ];
  
  for (const pattern of commandPatterns) {
    if (pattern.test(normalizedText)) {
      return false; // This looks like a command
    }
  }
  
  return true; // This looks like dictation content
}

// Inject text into search input
export function injectSearchQuery(query: string): CommandResult {
  const searchInput = document.querySelector<HTMLInputElement>(
    'input[placeholder*="Search"], input[placeholder*="search"], input[type="search"], input[name="search"]'
  );
  
  if (searchInput) {
    searchInput.focus();
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    
    nativeInputValueSetter?.call(searchInput, query);
    const event = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(event);
    
    return { success: true, action: 'search', message: `Searching for "${query}"` };
  }
  
  return { success: false, action: 'search', message: 'No search field found on this page' };
}

// Execute a voice command
export function executeCommand(command: VoiceCommand, options?: {
  onLogout?: () => void;
  onAuraActivate?: () => void;
  onStopListening?: () => void;
}): CommandResult {
  switch (command) {
    case 'next':
    case 'tab':
      return focusNext();
      
    case 'back':
    case 'previous':
      return focusPrevious();
      
    case 'clear':
    case 'erase':
      return clearCurrentField();
      
    case 'save job':
    case 'submit':
    case 'send':
      return submitForm();
      
    case 'clock out':
    case 'logout':
    case 'sign out':
      options?.onLogout?.();
      return { success: true, action: 'logout', message: 'Logging out...' };
      
    case 'hey aura':
    case 'ask aura':
    case 'aura help':
      options?.onAuraActivate?.();
      return { success: true, action: 'aura_activate', message: 'Aura is listening...' };
      
    case 'cancel':
    case 'stop listening':
      options?.onStopListening?.();
      return { success: true, action: 'stop_listening', message: 'Voice mode paused' };
      
    default:
      return { success: false, action: 'unknown', message: 'Command not recognized' };
  }
}

// Check if a string contains a voice command
export function parseCommand(text: string): VoiceCommand | null {
  const normalizedText = text.toLowerCase().trim();
  
  const commandPatterns: Array<{ pattern: RegExp; command: VoiceCommand }> = [
    { pattern: /\b(next|go next)\b/i, command: 'next' },
    { pattern: /\btab\b/i, command: 'tab' },
    { pattern: /\b(back|go back|previous)\b/i, command: 'back' },
    { pattern: /\b(clear|erase|delete)\b/i, command: 'clear' },
    { pattern: /\b(save job|save|submit)\b/i, command: 'save job' },
    { pattern: /\bsend\b/i, command: 'send' },
    { pattern: /\b(clock out|log out|logout|sign out)\b/i, command: 'clock out' },
    { pattern: /\b(hey aura|hi aura)\b/i, command: 'hey aura' },
    { pattern: /\b(ask aura)\b/i, command: 'ask aura' },
    { pattern: /\b(aura help)\b/i, command: 'aura help' },
    { pattern: /\b(cancel|stop listening|stop voice)\b/i, command: 'stop listening' },
  ];
  
  for (const { pattern, command } of commandPatterns) {
    if (pattern.test(normalizedText)) {
      return command;
    }
  }
  
  return null;
}
