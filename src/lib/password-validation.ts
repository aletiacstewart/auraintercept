// Client-side password validation utilities

// Top 100 common passwords for quick client-side check
const COMMON_PASSWORDS_QUICK = new Set([
  'password', '123456', '123456789', '12345678', '12345', 'qwerty', 'abc123',
  'password1', 'password123', '1234567890', 'iloveyou', 'admin', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'letmein', 'princess', 'sunshine',
  'qwerty123', 'passw0rd', 'football', 'baseball', 'shadow', 'michael',
  'batman', 'superman', 'trustno1', 'hello', 'charlie', 'donald', 'p@ssw0rd',
  'password!', 'test123', 'admin123', 'root', 'guest', 'changeme', 'default',
]);

// Keyboard patterns
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1234567890',
];

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface ServerValidationResult extends PasswordValidationResult {
  breached?: boolean;
  breachCount?: number;
}

/**
 * Client-side password validation - fast, synchronous
 * Use for real-time feedback as user types
 */
export function validatePasswordClient(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, score: 0, issues: [], label: 'Very Weak' };
  }

  const issues: string[] = [];
  let score = 0;

  // Length checks
  if (password.length < 8) {
    issues.push('At least 8 characters required');
  } else {
    score += 1;
  }
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  // Complexity checks
  if (!/[a-z]/.test(password)) {
    issues.push('Add a lowercase letter');
  } else {
    score += 0.3;
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Add an uppercase letter');
  } else {
    score += 0.4;
  }
  
  if (!/[0-9]/.test(password)) {
    issues.push('Add a number');
  } else {
    score += 0.3;
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Add a special character');
  } else {
    score += 1;
  }

  // Common password check (quick client-side)
  if (COMMON_PASSWORDS_QUICK.has(password.toLowerCase())) {
    issues.unshift('This is a commonly used password');
    score = 0;
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    issues.push('Avoid repeated characters');
    score = Math.max(0, score - 0.5);
  }

  // Keyboard pattern check
  const lower = password.toLowerCase();
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lower.includes(pattern)) {
      issues.push('Avoid keyboard patterns');
      score = Math.max(0, score - 0.5);
      break;
    }
  }

  const normalizedScore = Math.min(4, Math.max(0, Math.floor(score)));
  const labels: Array<'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'> = [
    'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'
  ];

  return {
    valid: password.length >= 8 && normalizedScore >= 2 && !COMMON_PASSWORDS_QUICK.has(password.toLowerCase()),
    score: normalizedScore,
    issues,
    label: labels[normalizedScore],
  };
}

/**
 * Server-side password validation - comprehensive with HIBP check
 * Use before form submission
 */
export async function validatePasswordServer(
  password: string,
  supabaseUrl?: string
): Promise<ServerValidationResult> {
  const url = supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  
  try {
    const response = await fetch(`${url}/functions/v1/validate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, checkHibp: true }),
    });

    if (!response.ok) {
      console.error('Password validation API error:', response.status);
      // Fall back to client validation
      return { ...validatePasswordClient(password), breached: undefined, breachCount: undefined };
    }

    return await response.json();
  } catch (error) {
    console.error('Password validation failed:', error);
    // Fall back to client validation
    return { ...validatePasswordClient(password), breached: undefined, breachCount: undefined };
  }
}

/**
 * Returns color class for password strength
 */
export function getStrengthColor(score: number): string {
  const colors = [
    'bg-destructive',     // 0: Very Weak
    'bg-orange-500',      // 1: Weak
    'bg-yellow-500',      // 2: Fair
    'bg-lime-500',        // 3: Good
    'bg-green-500',       // 4: Strong
  ];
  return colors[Math.min(score, 4)];
}
