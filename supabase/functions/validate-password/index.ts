import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top 1000+ common passwords (subset shown for brevity - full list in production)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', '12345678', '12345', '1234567', 'qwerty',
  'abc123', 'password1', 'password123', '1234567890', 'iloveyou', 'admin',
  'welcome', 'monkey', 'dragon', 'master', 'login', 'letmein', 'princess',
  'sunshine', 'qwerty123', 'passw0rd', 'football', 'baseball', 'shadow',
  'michael', 'batman', 'superman', 'trustno1', 'hello', 'charlie', 'donald',
  'password1!', 'qazwsx', 'ninja', 'azerty', 'solo', 'loveme', 'whatever',
  'access', 'starwars', 'master123', 'hello123', 'ashley', 'bailey',
  'passpass', 'flower', 'jordan', 'buster', 'tigger', 'soccer', 'hockey',
  'ranger', 'harley', 'thomas', 'secret', 'ginger', 'pepper', 'killer',
  'robert', 'matthew', 'jennifer', 'michelle', 'amanda', 'jessica', 'joshua',
  'andrew', 'daniel', 'taylor', 'anthony', 'nicole', 'heather', 'summer',
  'blessed', 'love', 'faith', 'happy', 'angel', 'freedom', 'fuckyou',
  'cheese', 'cookie', 'banana', 'chocolate', 'yankees', 'eagles', 'dolphins',
  'liverpool', 'arsenal', 'chelsea', 'london', 'paris', 'berlin', 'moscow',
  'computer', 'internet', 'corvette', 'mustang', 'mercedes', 'ferrari',
  '111111', '000000', '666666', '121212', '654321', 'password!', 'test123',
  'testing', 'test', 'pass123', 'pass', 'admin123', 'admin1', 'root',
  'toor', 'guest', 'changeme', 'default', 'user', 'demo', 'temp', 'temppass',
  'abcd1234', 'qwer1234', 'asdf1234', 'zxcv1234', 'p@ssw0rd', 'p@ssword',
  'pa$$word', 'welcome1', 'welcome123', 'letmein!', 'letmein1', 'iloveyou1',
  'lovelove', 'password2', 'password12', 'abc1234', '1qaz2wsx', '2wsx3edc',
  'qazwsxedc', 'zaq12wsx', 'asdfgh', 'asdfghjk', 'qwertyui', 'zxcvbn',
  'zxcvbnm', '!@#$%^', '!@#$%^&*', 'google', 'facebook', 'twitter',
  'instagram', 'linkedin', 'youtube', 'amazon', 'apple', 'microsoft',
  'windows', 'linux', 'ubuntu', 'mac', 'iphone', 'android', 'samsung',
]);

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', 'qazwsx', '!@#$%^', 'qweasd', 'poiuytrewq', 'lkjhgfdsa',
  'mnbvcxz', '0987654321', 'qaz', 'wsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm',
];

interface ValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  breached?: boolean;
  breachCount?: number;
}

function detectPatterns(password: string): string[] {
  const issues: string[] = [];
  const lower = password.toLowerCase();
  
  // Check keyboard patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lower.includes(pattern) && pattern.length >= 4) {
      issues.push('Contains keyboard pattern');
      break;
    }
  }
  
  // Check for repeated characters (e.g., "aaa", "111")
  if (/(.)\1{2,}/.test(password)) {
    issues.push('Contains repeated characters');
  }
  
  // Check for sequential numbers (e.g., "123", "321")
  if (/(?:012|123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210)/.test(password)) {
    issues.push('Contains sequential numbers');
  }
  
  // Check for sequential letters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    issues.push('Contains sequential letters');
  }
  
  return issues;
}

function calculateScore(password: string, issues: string[]): number {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 10) score += 0.5;
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Penalize for issues
  score -= issues.length * 0.5;
  
  // Ensure score is in valid range
  return Math.max(0, Math.min(4, Math.floor(score)));
}

async function checkHaveIBeenPwned(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // k-anonymity: only send first 5 characters
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to responses to prevent response size analysis
        'User-Agent': 'Aura-Intercept-Password-Validator',
      },
    });
    
    if (!response.ok) {
      console.warn('HIBP API returned non-OK status:', response.status);
      return { breached: false, count: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return { breached: true, count: parseInt(countStr, 10) };
      }
    }
    
    return { breached: false, count: 0 };
  } catch (error) {
    console.error('HIBP check failed:', error);
    // Graceful degradation - don't block registration if HIBP is unavailable
    return { breached: false, count: 0 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { password, checkHibp = true } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const issues: string[] = [];
    
    // Length check
    if (password.length < 8) {
      issues.push('At least 8 characters required');
    }
    
    // Complexity checks
    if (!/[a-z]/.test(password)) {
      issues.push('Add a lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      issues.push('Add an uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      issues.push('Add a number');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      issues.push('Add a special character');
    }
    
    // Common password check
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      issues.unshift('This is a commonly used password');
    }
    
    // Pattern detection
    const patternIssues = detectPatterns(password);
    issues.push(...patternIssues);
    
    // Calculate score
    const score = calculateScore(password, issues);
    
    // Determine label
    const labels: Array<'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'> = [
      'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'
    ];
    const label = labels[score];
    
    // Check HaveIBeenPwned if enabled
    let breached = false;
    let breachCount = 0;
    
    if (checkHibp && password.length >= 8) {
      const hibpResult = await checkHaveIBeenPwned(password);
      breached = hibpResult.breached;
      breachCount = hibpResult.count;
      
      if (breached) {
        issues.unshift(`Found in ${breachCount.toLocaleString()} data breaches`);
      }
    }
    
    // Password is valid if no critical issues and score >= 2 and not breached
    const valid = password.length >= 8 && score >= 2 && !breached && 
                  !COMMON_PASSWORDS.has(password.toLowerCase());

    const result: ValidationResult = {
      valid,
      score,
      issues,
      label,
      breached,
      breachCount,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Password validation error:', error);
    return new Response(JSON.stringify({ error: 'Validation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
