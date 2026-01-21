import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, ShieldAlert } from 'lucide-react';
import { validatePasswordClient, validatePasswordServer, getStrengthColor, type ServerValidationResult } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showIssues?: boolean;
  onValidationChange?: (result: ServerValidationResult) => void;
  enableServerValidation?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showIssues = true,
  onValidationChange,
  enableServerValidation = true,
}: PasswordStrengthIndicatorProps) {
  const [serverValidation, setServerValidation] = useState<ServerValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Client-side validation (immediate feedback)
  const clientValidation = useMemo(() => {
    return validatePasswordClient(password);
  }, [password]);

  // Server-side validation (debounced, includes HIBP check)
  useEffect(() => {
    if (!enableServerValidation || !password || password.length < 8) {
      setServerValidation(null);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await validatePasswordServer(password);
        setServerValidation(result);
        onValidationChange?.(result);
      } catch (error) {
        console.error('Server validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    }, 600); // Debounce 600ms after user stops typing

    return () => clearTimeout(timer);
  }, [password, enableServerValidation, onValidationChange]);

  if (!password) return null;

  // Use server validation if available, otherwise client
  const strength = serverValidation || clientValidation;
  const isBreached = serverValidation?.breached;
  const breachCount = serverValidation?.breachCount;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              index <= strength.score 
                ? isBreached 
                  ? 'bg-destructive' 
                  : getStrengthColor(strength.score)
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Strength label with validation indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Password strength: <span className="font-medium">{strength.label}</span>
        </p>
        {isValidating && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking...
          </span>
        )}
      </div>

      {/* Breach warning */}
      {isBreached && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
          <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-destructive">
              Password found in data breaches
            </p>
            <p className="text-xs text-destructive/80">
              This password appeared in {breachCount?.toLocaleString()} known breaches. 
              Please choose a different password.
            </p>
          </div>
        </div>
      )}

      {/* Issues list */}
      {showIssues && strength.issues.length > 0 && !isBreached && (
        <div className="space-y-1">
          {strength.issues.slice(0, 4).map((issue, index) => (
            <div 
              key={index} 
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3 text-destructive shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success indicators when password is strong */}
      {showIssues && strength.valid && !isBreached && strength.score >= 3 && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <Check className="h-3 w-3 shrink-0" />
          <span>Strong password</span>
        </div>
      )}
    </div>
  );
}
