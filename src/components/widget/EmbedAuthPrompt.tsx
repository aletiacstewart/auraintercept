import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, X, LogIn, UserPlus, Globe, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerPortalInstallPrompt } from './CustomerPortalInstallPrompt';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { type ServerValidationResult } from '@/lib/password-validation';

interface EmbedAuthPromptProps {
  companyId: string;
  onAuthenticated: (userId: string) => void;
  onDismiss: () => void;
  primaryColor?: string;
}

interface ExistingUser {
  id: string;
  email: string;
  name?: string;
}

export function EmbedAuthPrompt({ 
  companyId, 
  onAuthenticated, 
  onDismiss,
  primaryColor = '#6366f1'
}: EmbedAuthPromptProps) {
  const [mode, setMode] = useState<'prompt' | 'login' | 'signup' | 'returning' | 'install-prompt'>('prompt');
  const [signupEmail, setSignupEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordValidation, setPasswordValidation] = useState<ServerValidationResult | null>(null);

  // Callback for password validation changes
  const handlePasswordValidationChange = useCallback((result: ServerValidationResult) => {
    setPasswordValidation(result);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if this is a customer account
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (roleData?.role === 'customer') {
            const userName = session.user.user_metadata?.full_name || 
                           session.user.email?.split('@')[0] || 
                           'there';
            setExistingUser({
              id: session.user.id,
              email: session.user.email || '',
              name: userName,
            });
            setMode('returning');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleContinueAsUser = async () => {
    if (!existingUser) return;
    
    setIsLoading(true);
    try {
      // Update company association
      await supabase.from('customer_company_associations').upsert({
        customer_user_id: existingUser.id,
        company_id: companyId,
        last_interaction_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_user_id,company_id',
      });

      onAuthenticated(existingUser.id);
      toast.success(`Welcome back, ${existingUser.name}!`);
    } catch (error: any) {
      console.error('Continue error:', error);
      toast.error('Failed to continue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    setExistingUser(null);
    setMode('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create/update customer company association
        await supabase.from('customer_company_associations').upsert({
          customer_user_id: data.user.id,
          company_id: companyId,
          last_interaction_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_user_id,company_id',
        });

        onAuthenticated(data.user.id);
        toast.success('Signed in successfully!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Validate terms agreement
    if (!termsAgreed) {
      toast.error('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Check for breached password
    if (passwordValidation?.breached) {
      toast.error('This password has been exposed in data breaches. Please choose a different password.');
      return;
    }
    if (passwordValidation && !passwordValidation.valid) {
      toast.error('Please choose a stronger password before continuing.');
      return;
    }

    setIsLoading(true);
    try {
      // Use secure edge function for registration with server-side validation
      const { data: registerResult, error: registerError } = await supabase.functions.invoke('customer-register', {
        body: {
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          companyId,
          termsAgreed,
        },
      });

      if (registerError) {
        throw new Error(registerError.message || 'Registration failed');
      }

      if (!registerResult?.success) {
        throw new Error(registerResult?.error || 'Failed to create account');
      }

      // Now sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        toast.success('Account created! Please sign in with your credentials.');
        setMode('login');
        return;
      }

      if (signInData.user) {
        // Store the email for the install prompt
        setSignupEmail(email.trim().toLowerCase());
        // Show install prompt instead of immediately completing
        setMode('install-prompt');
        toast.success('Account created! You can now track all your appointments.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return null;
  }

  // Install prompt after signup
  if (mode === 'install-prompt') {
    const handleContinueAfterInstall = async () => {
      // Get current user and complete authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        onAuthenticated(user.id);
      } else {
        // Fallback to prompt mode if no user
        setMode('prompt');
      }
    };

    return (
      <CustomerPortalInstallPrompt
        onContinue={handleContinueAfterInstall}
        userEmail={signupEmail}
        primaryColor={primaryColor}
      />
    );
  }

  // Returning customer view
  if (mode === 'returning' && existingUser) {
    return (
      <div className="mx-4 mb-4 p-4 rounded-lg border bg-muted/50 relative">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">Welcome back, {existingUser.name}!</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Continue as <span className="font-medium">{existingUser.email}</span> to track this booking.
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="default"
                className="text-xs"
                onClick={handleContinueAsUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="h-3 w-3 mr-1" />
                )}
                Continue
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs"
                onClick={handleSwitchAccount}
                disabled={isLoading}
              >
                Switch Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'prompt') {
    return (
      <div className="mx-4 mb-4 p-4 rounded-lg border bg-muted/50 relative">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">Track your appointments</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Your Aura Intercept account works everywhere. Sign in once to track appointments across all participating service providers.
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="default"
                className="text-xs"
                onClick={() => setMode('login')}
              >
                <LogIn className="h-3 w-3 mr-1" />
                Sign In
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs"
                onClick={() => setMode('signup')}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Create Account
              </Button>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Works with all Aura Intercept companies</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 p-4 rounded-lg border bg-card relative">
      <button
        onClick={() => setMode('prompt')}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
        aria-label="Back"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <h4 className="font-medium text-sm mb-3">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h4>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3">
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-9 text-sm"
            />
          </div>
        )}
        
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Create password (8+ chars)' : 'Your password'}
            required
            minLength={8}
            className="h-9 text-sm"
          />
          {mode === 'signup' && (
            <PasswordStrengthIndicator 
              password={password} 
              showIssues={false}
              onValidationChange={handlePasswordValidationChange}
            />
          )}
        </div>

        {mode === 'signup' && (
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="embed-terms" 
              checked={termsAgreed} 
              onCheckedChange={(checked) => setTermsAgreed(checked === true)}
              className="mt-0.5"
            />
            <label 
              htmlFor="embed-terms" 
              className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer"
            >
              I agree to the{' '}
              <a 
                href="/terms-of-service" 
                target="_blank"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a 
                href="/privacy-policy" 
                target="_blank"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>
            </label>
          </div>
        )}

        <Button type="submit" className="w-full h-9" disabled={isLoading || (mode === 'signup' && !termsAgreed)}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Please wait...
            </>
          ) : mode === 'login' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Works everywhere badge */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Works with all Aura Intercept companies</span>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}