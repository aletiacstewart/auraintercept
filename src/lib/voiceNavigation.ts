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
  | 'stop listening';

export interface CommandResult {
  success: boolean;
  action: string;
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
    current.value = '';
    // Trigger input event for React controlled components
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
