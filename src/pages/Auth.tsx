import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bot, Building2, Users, Shield, Check, Crown, Zap, MessageSquare, Phone, Mail, Mic, UserCircle } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'platform_admin' | 'company' | 'employee' | 'customer';

const VALID_MODES: AuthMode[] = ['platform_admin', 'company', 'employee', 'customer'];

export default function Auth() {
  const [searchParams] = useSearchParams();
  
  // Runtime guard for mode - prevents malformed values from falling through
  const rawMode = searchParams.get('mode');
  const mode: AuthMode = rawMode && VALID_MODES.includes(rawMode as AuthMode) 
    ? (rawMode as AuthMode) 
    : 'company';
  
  const rawTab = searchParams.get('tab');
  const tabParam = rawTab === 'login' || rawTab === 'signup' ? rawTab : null;
  const source = searchParams.get('source');
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');

  // Sync activeTab with URL params and mode - runs on mount and when params change
  useEffect(() => {
    // Force login for QR source or employee mode (bulletproof the flow)
    if (source === 'qr' || mode === 'employee') {
      setActiveTab('login');
    } else if (tabParam) {
      setActiveTab(tabParam);
    } else {
      // Default: signup for company mode
      setActiveTab('signup');
    }
    // Reset form fields when mode changes
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setRegistrationCode('');
  }, [mode, tabParam, source]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Check user role to determine redirect
    if (authData.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      toast({ title: 'Welcome back!', description: 'Redirecting...' });
      
      if (roleData?.role === 'customer') {
        navigate('/customer');
      } else {
        navigate('/dashboard');
      }
    }

    setIsLoading(false);
  };

  const handlePlatformAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error('Full name is required');
    } catch (err) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard`;

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (authError) {
      toast({ title: 'Signup Failed', description: authError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Create platform admin's company (super-tenant)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Aura Intercept Platform',
          slug: 'aura-intercept-' + authData.user.id.slice(0, 8),
          primary_color: '#0EA5E9',
          secondary_color: '#8B5CF6'
        })
        .select()
        .single();

      if (companyError) {
        toast({ title: 'Error', description: 'Failed to create platform company', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Update profile with company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: companyData.id })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Assign platform_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'platform_admin' });

      if (roleError) {
        console.error('Role insert error:', roleError);
        toast({ title: 'Error', description: 'Failed to assign role: ' + roleError.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Account Created!', description: 'Welcome to Aura Intercept!' });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleCompanySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error('Full name is required');
      if (!companyName.trim()) throw new Error('Company name is required');
    } catch (err) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard`;
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (authError) {
      toast({ title: 'Signup Failed', description: authError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Create company first
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug
        })
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        toast({ title: 'Error', description: 'Failed to create company: ' + companyError.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile with company_id - retry if profile doesn't exist yet
      let profileUpdated = false;
      for (let i = 0; i < 3; i++) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: companyData.id, full_name: fullName })
          .eq('id', authData.user.id);

        if (!profileError) {
          profileUpdated = true;
          break;
        }
        console.log(`Profile update attempt ${i + 1} failed:`, profileError);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!profileUpdated) {
        console.error('Failed to update profile after retries');
      }

      // Assign company_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'company_admin' });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        toast({ title: 'Warning', description: 'Account created but role assignment failed. Please contact support.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ 
        title: 'Welcome! 🎉', 
        description: 'Your 30-day free trial has started. Enjoy full access to all features!' 
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleEmployeeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error('Full name is required');
      if (!registrationCode.trim()) throw new Error('Registration code is required');
    } catch (err) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Validate registration code
    const { data: codeData, error: codeError } = await supabase
      .from('employee_registration_codes')
      .select('*')
      .eq('code', registrationCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (codeError || !codeData) {
      toast({ title: 'Invalid Code', description: 'The registration code is invalid or expired', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/dashboard`;

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (authError) {
      toast({ title: 'Signup Failed', description: authError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Update profile with company_id
      await supabase
        .from('profiles')
        .update({ company_id: codeData.company_id })
        .eq('id', authData.user.id);

      // Assign employee role
      await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'employee' });

      // Mark code as used
      await supabase
        .from('employee_registration_codes')
        .update({ used: true })
        .eq('id', codeData.id);

      toast({ title: 'Welcome!', description: 'Your employee account has been created!' });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error('Full name is required');
    } catch (err) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/customer`;

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (authError) {
      toast({ title: 'Signup Failed', description: authError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile with full name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Assign customer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'customer' });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        toast({ title: 'Warning', description: 'Account created but role assignment failed. Please contact support.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ 
        title: 'Welcome! 🎉', 
        description: 'Your customer account has been created!' 
      });
      navigate('/customer');
    }

    setIsLoading(false);
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'platform_admin':
        return {
          title: 'Platform Admin',
          description: 'Access the platform administration dashboard',
          icon: Shield,
          showCompanyField: false,
          showCodeField: false,
          onSignup: handlePlatformAdminSignup
        };
      case 'employee':
        return {
          title: 'Employee Portal',
          description: 'Sign in to your employee dashboard',
          icon: Users,
          showCompanyField: false,
          showCodeField: true,
          onSignup: handleEmployeeSignup
        };
      case 'customer':
        return {
          title: 'Customer Portal',
          description: 'Access your service history and appointments',
          icon: UserCircle,
          showCompanyField: false,
          showCodeField: false,
          onSignup: handleCustomerSignup
        };
      default:
        return {
          title: 'Company Portal',
          description: 'Start your 30-day free trial',
          icon: Building2,
          showCompanyField: true,
          showCodeField: false,
          onSignup: handleCompanySignup
        };
    }
  };

  const config = getModeConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-5xl animate-fade-in">
          {/* Logo - centered above */}
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-2xl gradient-primary p-0.5 shadow-glow">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Aura Intercept" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Aura Intercept</h1>
              <p className="text-sm text-muted-foreground">Infrastructure of Intent</p>
              {/* Debug line for QR troubleshooting - only shows when source=qr */}
              {source === 'qr' && (
                <p className="mt-2 text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                  Mode: {mode} | Tab: {activeTab} | Source: {source}
                </p>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className={`grid gap-8 ${mode === 'company' ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
            {/* Left Column - What's Included (only for company mode) */}
            {mode === 'company' && (
              <Card className="border-border/50 shadow-md h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    What's Included
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">For Businesses:</span> This platform subscription is designed for small to large companies — not individual employees.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trial Info */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      30-Day Free Trial
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Full access to all features during your trial. No credit card required.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>Unlimited appointments</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>10 free employee accounts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>All AI agents</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>Chat widget</span>
                      </div>
                    </div>
                  </div>

                  {/* After Trial */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-semibold text-sm mb-2">After Trial: $250/month</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span>Email reminders included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" />
                        <span>SMS reminders (usage-based)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className="w-3 h-3" />
                        <span>AI Voice calls (usage-based)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>10 employees free, +$10/mo each additional</span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Note */}
                  <p className="text-xs text-center text-muted-foreground">
                    Upgrade anytime from your dashboard under Subscription
                  </p>

                  {/* Customer Info */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-center text-green-700 dark:text-green-400">
                      <span className="font-medium">Customers get free accounts</span> to engage with registered companies — book appointments, chat with AI agents, and more!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Right Column - Auth Card */}
            <div className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  {/* Mode switcher at top */}
                  <div className="flex flex-wrap justify-center gap-2 text-sm mb-4">
                    <Button 
                      variant={mode === 'customer' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={mode === 'customer' ? 'gradient-primary' : ''}
                      onClick={() => navigate('/auth?mode=customer')}
                    >
                      <UserCircle className="w-4 h-4 mr-1" /> Customer
                    </Button>
                    <Button 
                      variant={mode === 'employee' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={mode === 'employee' ? 'gradient-primary' : ''}
                      onClick={() => navigate('/auth?mode=employee')}
                    >
                      <Users className="w-4 h-4 mr-1" /> Employee
                    </Button>
                    <Button 
                      variant={mode === 'company' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={mode === 'company' ? 'gradient-primary' : ''}
                      onClick={() => navigate('/auth?mode=company')}
                    >
                      <Building2 className="w-4 h-4 mr-1" /> Company
                    </Button>
                    <Button 
                      variant={mode === 'platform_admin' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={mode === 'platform_admin' ? 'gradient-primary' : ''}
                      onClick={() => navigate('/auth?mode=platform_admin')}
                    >
                      <Shield className="w-4 h-4 mr-1" /> Platform Admin
                    </Button>
                  </div>
                  <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex justify-end">
                          <ForgotPasswordDialog />
                        </div>
                        <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                          {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={config.onSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>

                        {config.showCompanyField && (
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              type="text"
                              placeholder="Acme Corp"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        {config.showCodeField && (
                          <div className="space-y-2">
                            <Label htmlFor="code">Registration Code</Label>
                            <Input
                              id="code"
                              type="text"
                              placeholder="ABC123XYZ"
                              value={registrationCode}
                              onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                              required
                            />
                            <p className="text-xs text-muted-foreground">Enter the code provided by your company admin</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="signupEmail">Email</Label>
                          <Input
                            id="signupEmail"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signupPassword">Password</Label>
                          <Input
                            id="signupPassword"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <PasswordStrengthIndicator password={password} />
                        </div>
                        <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                          {isLoading ? 'Creating account...' : mode === 'company' ? 'Start Free Trial' : 'Create Account'}
                        </Button>
                        {mode === 'company' && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            30 days free • No credit card required • Cancel anytime
                          </p>
                        )}
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
