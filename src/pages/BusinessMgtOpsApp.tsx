import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { AnalyticsAgentConsole } from '@/components/analytics/AnalyticsAgentConsole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, LayoutDashboard, Briefcase, Loader2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Standalone Business Management Console App - Lightweight PWA for managers
 * This is the installable mobile app that provides quick access to both
 * Business Management Console and Analytics & Reports Console consoles.
 * Includes embedded login form for seamless authentication.
 */
export default function BusinessMgtOpsApp() {
  const { user, companyId, loading } = useAuth();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeConsole, setActiveConsole] = useState<'business' | 'analytics'>('business');

  // Fetch company branding
  const { data: company } = useQuery({
    queryKey: ['company-branding', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name, logo_url, primary_color')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      // Validate inputs
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        setIsLoggingIn(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        setIsLoggingIn(false);
        return;
      }

      toast.success('Signed in successfully');
    } catch (error) {
      toast.error('An unexpected error occurred');
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleOpenFullDashboard = () => {
    window.open('/dashboard', '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Briefcase className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading Business Ops...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show embedded login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Business Management</h1>
            <p className="text-sm text-muted-foreground">Management Console</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-sm border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Manager Sign In</CardTitle>
            <CardDescription>
              Sign in to access business management and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-input text-foreground placeholder:text-muted-foreground border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="bg-input text-foreground placeholder:text-muted-foreground border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <ForgotPasswordDialog />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
          Having trouble signing in? Contact your company administrator for assistance.
        </p>
      </div>
    );
  }

  // Authenticated - show Business Ops Consoles with tab switching
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name || 'Company'} 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="font-semibold text-sm">Business Management</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenFullDashboard}
              className="text-xs gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Full Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Console Switcher */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="px-4 py-2">
          <Tabs value={activeConsole} onValueChange={(v) => setActiveConsole(v as 'business' | 'analytics')}>
            <TabsList className="bg-muted w-full">
              <TabsTrigger value="business" className="flex-1 text-xs gap-1.5 text-foreground/70 data-[state=active]:text-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                Business Ops
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 text-xs gap-1.5 text-foreground/70 data-[state=active]:text-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Console Content - Full height minus headers */}
      <main className="flex-1 flex flex-col min-h-0 p-4">
        {activeConsole === 'business' ? (
          <BusinessOpsAgentConsole companyId={companyId || undefined} />
        ) : (
          <AnalyticsAgentConsole companyId={companyId || undefined} />
        )}
      </main>
    </div>
  );
}
