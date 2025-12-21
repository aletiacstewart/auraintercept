import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bot, Building2, Users, Shield } from 'lucide-react';
import logo from '@/assets/logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'platform_admin' | 'company' | 'employee';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as AuthMode) || 'company';
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');

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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!', description: 'Redirecting to dashboard...' });
      navigate('/dashboard');
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
          name: 'AI Bot Company',
          slug: 'ai-bot-company-' + authData.user.id.slice(0, 8),
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

      toast({ title: 'Account Created!', description: 'Welcome to AI Bot Company Platform!' });
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
          title: 'Employee Access',
          description: 'Sign in to your employee dashboard',
          icon: Users,
          showCompanyField: false,
          showCodeField: true,
          onSignup: handleEmployeeSignup
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-2xl gradient-primary p-0.5 shadow-glow">
            <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
              <img src={logo} alt="AI Bot Company" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">AI Bot Company</h1>
            <p className="text-sm text-muted-foreground">The Future of Work</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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

        {/* Mode switcher */}
        <div className="flex justify-center gap-4 text-sm">
          {mode !== 'company' && (
            <Button variant="link" size="sm" onClick={() => navigate('/auth?mode=company')}>
              <Building2 className="w-4 h-4 mr-1" /> Company Login
            </Button>
          )}
          {mode !== 'employee' && (
            <Button variant="link" size="sm" onClick={() => navigate('/auth?mode=employee')}>
              <Users className="w-4 h-4 mr-1" /> Employee Login
            </Button>
          )}
          {mode !== 'platform_admin' && (
            <Button variant="link" size="sm" onClick={() => navigate('/auth?mode=platform_admin')}>
              <Shield className="w-4 h-4 mr-1" /> Admin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
