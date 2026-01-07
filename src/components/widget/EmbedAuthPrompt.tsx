import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, X, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmbedAuthPromptProps {
  companyId: string;
  onAuthenticated: (userId: string) => void;
  onDismiss: () => void;
  primaryColor?: string;
}

export function EmbedAuthPrompt({ 
  companyId, 
  onAuthenticated, 
  onDismiss,
  primaryColor = '#6366f1'
}: EmbedAuthPromptProps) {
  const [mode, setMode] = useState<'prompt' | 'login' | 'signup'>('prompt');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href,
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Add customer role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'customer',
        });

        // Create customer company association
        await supabase.from('customer_company_associations').insert({
          customer_user_id: data.user.id,
          company_id: companyId,
          last_interaction_at: new Date().toISOString(),
        });

        onAuthenticated(data.user.id);
        toast.success('Account created! You can now track all your appointments.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

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
              Sign in to access your booking history and get updates from your customer dashboard.
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
            placeholder={mode === 'signup' ? 'Create password (6+ chars)' : 'Your password'}
            required
            minLength={6}
            className="h-9 text-sm"
          />
        </div>

        <Button type="submit" className="w-full h-9" disabled={isLoading}>
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
