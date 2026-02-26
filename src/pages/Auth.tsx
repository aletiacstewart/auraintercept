import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Bot, Building2, Users, Shield, Check, Zap, Phone, Mail, Mic, UserCircle, DollarSign, FileText, Calendar, Search, Headphones, Send, BookOpen, AlertTriangle } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { TermsAgreementCheckbox } from '@/components/auth/TermsAgreementCheckbox';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { type ServerValidationResult } from '@/lib/password-validation';

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
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'express' | 'flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command' | null>(null);
  // Add-on selection removed - now using 7-tier structure
  const [passwordValidation, setPasswordValidation] = useState<ServerValidationResult | null>(null);
  const [setupAcknowledged, setSetupAcknowledged] = useState({ a2p: false, costs: false, knowledgeBase: false });

  // Callback for password validation changes
  const handlePasswordValidationChange = useCallback((result: ServerValidationResult) => {
    setPasswordValidation(result);
  }, []);

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
      if (!termsAgreed) throw new Error('You must agree to the Terms of Service and Privacy Policy');
      
      // Check for breached password
      if (passwordValidation?.breached) {
        throw new Error('This password has been exposed in data breaches. Please choose a different password.');
      }
      if (passwordValidation && !passwordValidation.valid) {
        throw new Error('Please choose a stronger password before continuing.');
      }
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
      if (!termsAgreed) throw new Error('You must agree to the Terms of Service and Privacy Policy');
      
      // Check for breached password
      if (passwordValidation?.breached) {
        throw new Error('This password has been exposed in data breaches. Please choose a different password.');
      }
      if (passwordValidation && !passwordValidation.valid) {
        throw new Error('Please choose a stronger password before continuing.');
      }
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
      if (!termsAgreed) throw new Error('You must agree to the Terms of Service and Privacy Policy');
      
      // Check for breached password
      if (passwordValidation?.breached) {
        throw new Error('This password has been exposed in data breaches. Please choose a different password.');
      }
      if (passwordValidation && !passwordValidation.valid) {
        throw new Error('Please choose a stronger password before continuing.');
      }
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
      if (!termsAgreed) throw new Error('You must agree to the Terms of Service and Privacy Policy');
      
      // Check for breached password
      if (passwordValidation?.breached) {
        throw new Error('This password has been exposed in data breaches. Please choose a different password.');
      }
      if (passwordValidation && !passwordValidation.valid) {
        throw new Error('Please choose a stronger password before continuing.');
      }
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
              <p className="text-sm text-muted-foreground">Smart Agents, Automated Service</p>
              {/* Debug line for QR troubleshooting - only shows when source=qr */}
              {source === 'qr' && (
                <p className="mt-2 text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                  Mode: {mode} | Tab: {activeTab} | Source: {source}
                </p>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className={`grid gap-8 ${mode === 'company' || mode === 'customer' || mode === 'employee' ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
            {/* Left Column - Employee Portal Info (only for employee mode) */}
            {mode === 'employee' && (
              <div className="space-y-4 h-fit">
                {/* Header */}
                <div className="text-center md:text-left">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary mb-3">For Employees</span>
                  <h2 className="text-lg font-bold mb-2">Employee Portal Access</h2>
                  <p className="text-sm text-muted-foreground">
                    Access your job queue, manage appointments, and coordinate with dispatch through your company's AI-powered platform.
                  </p>
                </div>

                {/* Registration Code Requirement */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Registration Code Required</h4>
                      <p className="text-xs text-muted-foreground">
                        To sign up, you'll need the <span className="font-medium text-foreground">8-character Registration Code</span> provided by your employer. This code links your account to your company.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">Job Queue & Calendar</h4>
                      <p className="text-xs text-card-foreground/70">View assigned jobs, manage your schedule, and sync with your calendar.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">Customer Information</h4>
                      <p className="text-xs text-card-foreground/70">Access customer details, service history, and job notes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">AI Field Ops Assistant</h4>
                      <p className="text-xs text-card-foreground/70">Get AI-powered support for job details, inventory lookups, and more.</p>
                    </div>
                  </div>
                </div>

                {/* Where to get code */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-center text-muted-foreground">
                    <span className="font-medium text-foreground">Don't have a code?</span> Contact your company administrator — the Registration Code is displayed on their dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Left Column - Customer Portal Info (only for customer mode) */}
            {mode === 'customer' && (
              <div className="space-y-4 h-fit">
                {/* Header */}
                <div className="text-center md:text-left">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-3">For Customers</span>
                  <h2 className="text-lg font-bold mb-2">24/7 Customer Portal</h2>
                  <p className="text-sm text-muted-foreground">
                    Your one account works with all Aura Intercept companies. Book appointments, get quotes, and chat with AI agents anytime.
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">Easy Appointment Booking</h4>
                      <p className="text-xs text-card-foreground/70">Select from available services and time slots with real-time calendar sync.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">Instant Quote Requests</h4>
                      <p className="text-xs text-card-foreground/70">Get AI-powered quotes based on your service needs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">Appointment Tracking</h4>
                      <p className="text-xs text-card-foreground/70">Real-time status updates with technician ETA and job completion notifications.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-card-foreground">AI Chat Support</h4>
                      <p className="text-xs text-card-foreground/70">Natural language conversations with AI agents for instant answers.</p>
                    </div>
                  </div>
                </div>

                {/* Free Account Note */}
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-center text-foreground">
                    <span className="font-medium text-green-600">Customer accounts are always free</span> — one account works with all registered companies!
                  </p>
                </div>
              </div>
            )}
            {/* Left Column - What's Included (only for company mode) */}
            {mode === 'company' && (
              <div className="space-y-4 h-fit">
                {/* Free Trial Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-purple-500/15 to-amber-500/10 border border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">👑</span>
                      <h3 className="text-sm font-bold text-foreground">30-Day Free Trial — Full Access</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your trial includes <span className="font-semibold text-foreground">all 24 AI agents</span>, <span className="font-semibold text-foreground">all 7 control centers</span>, and <span className="font-semibold text-foreground">all integrations</span> — regardless of the plan you select. No credit card required. Choose a plan to see pricing after your trial.
                    </p>
                  </div>
                </div>

                {/* Header */}
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold flex items-center gap-2 justify-center md:justify-start">
                    <Zap className="w-5 h-5 text-primary" />
                    Choose Your Plan
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your plan — trial includes everything.
                  </p>
                </div>

                {/* 7 Tier Cards - Compact Grid */}
                <div className="space-y-2">
                  {/* Industry-Specific Tiers Label */}
                  <p className="text-xs font-medium text-muted-foreground">Industry-Specific Packages:</p>
                  
                  {/* Starter */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'express' ? null : 'express')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'express' 
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20' 
                        : 'border-border/50 bg-card hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'express' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'express' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-card-foreground">Aura Starter</h3>
                          <p className="text-[10px] text-card-foreground/70">Restaurants • Cafes • Food Service</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-600">$197</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>1 Agent</span>
                      <span>•</span>
                      <span>Voice + Chat</span>
                      <span>•</span>
                      <span>Smart Links</span>
                    </div>
                  </div>

                  {/* Flow */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'flow' ? null : 'flow')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'flow' 
                        ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/20' 
                        : 'border-border/50 bg-card hover:border-teal-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'flow' ? 'border-teal-500 bg-teal-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'flow' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-card-foreground">Aura Connect</h3>
                          <p className="text-[10px] text-card-foreground/70">Personal Services • Real Estate</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-teal-600">$397</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>3 Agents</span>
                      <span>•</span>
                      <span>1 Console</span>
                      <span>•</span>
                      <span>Calendar Sync</span>
                    </div>
                  </div>

                  {/* Halo */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'halo' ? null : 'halo')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'halo' 
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20' 
                        : 'border-border/50 bg-card hover:border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'halo' ? 'border-rose-500 bg-rose-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'halo' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-card-foreground">Aura Growth</h3>
                          <p className="text-[10px] text-card-foreground/70">Salons • Spas • Wellness</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-600">$597</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>11 Agents</span>
                      <span>•</span>
                      <span>3 Consoles</span>
                      <span>•</span>
                      <span>Outreach & Sales</span>
                    </div>
                  </div>

                  {/* General Business Tiers Label */}
                  <p className="text-xs font-medium text-muted-foreground pt-2">General Business Plans:</p>

                  {/* Core */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'core' ? null : 'core')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'core' 
                        ? 'border-slate-500 bg-slate-500/10 ring-2 ring-slate-500/20' 
                        : 'border-border/50 bg-card hover:border-slate-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'core' ? 'border-slate-500 bg-slate-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'core' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-card-foreground">Aura Presence</h3>
                          <p className="text-[10px] text-card-foreground/70">Web Presence Focus</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-600">$797</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>12 Agents</span>
                      <span>•</span>
                      <span>4 Consoles</span>
                      <span>•</span>
                      <span>Web Presence</span>
                    </div>
                  </div>

                  {/* Single-Point */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'single_point' ? null : 'single_point')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'single_point' 
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20' 
                        : 'border-border/50 bg-card hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'single_point' ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'single_point' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-card-foreground">Aura Logistics</h3>
                          <p className="text-[10px] text-card-foreground/70">Field Service Teams</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-600">$1,497</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>18 Agents</span>
                      <span>•</span>
                      <span>6 Consoles</span>
                      <span>•</span>
                      <span>15 Employees</span>
                    </div>
                  </div>

                  {/* Multi-Track - Highlighted */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'multi_track' ? null : 'multi_track')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative ${
                      selectedTier === 'multi_track' 
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                        : 'border-primary/50 bg-primary/5 hover:border-primary'
                    }`}
                  >
                    <div className="absolute -top-2 left-3">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full gradient-primary text-primary-foreground font-medium">Popular</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'multi_track' ? 'border-primary bg-primary' : 'border-primary/50'
                        }`}>
                          {selectedTier === 'multi_track' && <Check className="w-2 h-2 text-primary-foreground" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-foreground">Aura Performance</h3>
                          <p className="text-[10px] text-muted-foreground">Full Automation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">$2,497</span>
                        <span className="text-[10px] text-muted-foreground">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-muted-foreground">
                      <span>22 Agents</span>
                      <span>•</span>
                      <span>7 Consoles</span>
                      <span>•</span>
                      <span>Analytics</span>
                    </div>
                  </div>

                  {/* Command */}
                  <div 
                    onClick={() => setSelectedTier(selectedTier === 'command' ? null : 'command')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === 'command' 
                        ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20' 
                        : 'border-border/50 bg-card hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === 'command' ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground/50'
                        }`}>
                          {selectedTier === 'command' && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div>
                      <h3 className="font-semibold text-xs text-card-foreground">Aura Command</h3>
                          <p className="text-[10px] text-card-foreground/70">Multi-Location • Enterprise</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-purple-600">$3,497</span>
                        <span className="text-[10px] text-card-foreground/70">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1.5 ml-5 text-[10px] text-card-foreground/70">
                      <span>24 Agents</span>
                      <span>•</span>
                      <span>7 Consoles</span>
                      <span>•</span>
                      <span>50 Employees</span>
                    </div>
                  </div>
                </div>

                {/* Selection Info */}
                {selectedTier && (
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-center text-foreground">
                      <span className="font-medium">Selected: {
                        selectedTier === 'express' ? 'Aura Starter' :
                        selectedTier === 'flow' ? 'Aura Connect' :
                        selectedTier === 'halo' ? 'Aura Growth' :
                        selectedTier === 'core' ? 'Aura Presence' :
                        selectedTier === 'single_point' ? 'Aura Logistics' :
                        selectedTier === 'multi_track' ? 'Aura Performance' :
                        'Aura Command'
                      }</span>
                    </p>
                  </div>
                )}

                {/* Annual Savings Note */}
                <p className="text-xs text-center text-green-500">
                  Save 16% with annual billing
                </p>

                {/* Customer Info */}
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-[10px] text-center text-foreground">
                    <span className="font-medium text-green-600">Customers get free accounts</span> to engage with registered companies!
                  </p>
                </div>

                {/* 3rd Party Integrations - Detailed Cards */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground text-center">3rd Party Integration Costs + Usage Fees</h4>
                  <p className="text-[9px] text-muted-foreground text-center mb-2">You'll need your own accounts with these services.</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        <span className="font-semibold text-[9px] text-white">Google Calendar</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">Free - Unlimited</p>
                      <p className="text-[8px] text-white/60">Required for: Connect, Growth, Presence, Logistics, Performance, Command</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span className="font-semibold text-[9px] text-white">Resend</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">Free: 3,000/mo • $20/mo (50k)</p>
                      <p className="text-[8px] text-white/60">Required for: All tiers</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Mic className="w-3 h-3 text-purple-400" />
                        <span className="font-semibold text-[9px] text-white">ElevenLabs</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">Free: 10k • $5 (30k) • $99 (500k)</p>
                      <p className="text-[8px] text-white/60">Required for: All tiers</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Phone className="w-3 h-3 text-green-400" />
                        <span className="font-semibold text-[9px] text-white">SignalWire</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">$2/number • $0.004/SMS (40% cheaper)</p>
                      <p className="text-[8px] text-white/60">Required for: All tiers</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span className="font-semibold text-[9px] text-white">A2P 10DLC</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">$4 + $15 one-time • $10/mo</p>
                      <p className="text-[8px] text-white/60">Required for: All SMS features • Prevents filtering</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold text-[9px] text-white">Stripe</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">2.9% + $0.30/transaction</p>
                      <p className="text-[8px] text-white/60">Required for: Logistics, Performance, Command (Invoicing)</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Send className="w-3 h-3 text-pink-400" />
                        <span className="font-semibold text-[9px] text-white">Social Media</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">Free - Your Pages (OAuth)</p>
                      <p className="text-[8px] text-white/60">Required for: Presence, Performance, Command • Optional: Growth, Logistics</p>
                    </div>

                    <div className="rounded-lg p-2" style={{ backgroundColor: '#2a3d4e' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Search className="w-3 h-3 text-orange-400" />
                        <span className="font-semibold text-[9px] text-white">Tavily</span>
                      </div>
                      <p className="text-[8px] text-white/90 font-medium">Free: 1,000 searches/mo</p>
                      <p className="text-[8px] text-white/60">Optional for: All tiers • Enhances AI content quality</p>
                    </div>
                  </div>
                </div>

                {/* Required Documents & Setup Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground text-center flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Required Documents & Setup Checklist
                  </h4>
                  <Accordion type="multiple" className="space-y-1">
                    <AccordionItem value="a2p" className="border border-amber-500/30 rounded-lg px-3 bg-amber-500/5">
                      <AccordionTrigger className="text-xs font-semibold text-amber-400 py-2 hover:no-underline">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3" />
                          A2P 10DLC Registration (SMS Compliance) — Required
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />Business legal name, EIN/Tax ID, and business address</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />Business type (LLC, Corp, Sole Proprietor)</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />Use-case description for SMS messages + sample message content</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-amber-400 mt-0.5 flex-shrink-0" />Estimated monthly SMS volume</li>
                          <li className="flex items-start gap-1 text-amber-400 font-medium"><AlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />Approval takes 2–4 weeks. Plan accordingly.</li>
                          <li className="flex items-start gap-1 text-amber-300"><DollarSign className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />Cost: $4 brand + $15 campaign (one-time) + $10/mo</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="signalwire" className="border border-border/50 rounded-lg px-3 bg-muted/20">
                      <AccordionTrigger className="text-xs font-semibold text-foreground py-2 hover:no-underline">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-green-400" />
                          SignalWire Setup — Required
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-green-400 mt-0.5 flex-shrink-0" />Create account at signalwire.com</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-green-400 mt-0.5 flex-shrink-0" />Purchase a phone number (~$2/mo)</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-green-400 mt-0.5 flex-shrink-0" />Submit A2P 10DLC campaign through SignalWire portal</li>
                          <li className="flex items-start gap-1"><DollarSign className="w-2.5 h-2.5 text-green-400 mt-0.5 flex-shrink-0" />Usage: $0.004/SMS · $0.006/min voice</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="elevenlabs" className="border border-border/50 rounded-lg px-3 bg-muted/20">
                      <AccordionTrigger className="text-xs font-semibold text-foreground py-2 hover:no-underline">
                        <div className="flex items-center gap-1.5">
                          <Mic className="w-3 h-3 text-purple-400" />
                          ElevenLabs Setup — Required
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-purple-400 mt-0.5 flex-shrink-0" />Create account at elevenlabs.io</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-purple-400 mt-0.5 flex-shrink-0" />Generate API key for voice synthesis</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-purple-400 mt-0.5 flex-shrink-0" />Select or clone a voice for your AI agent</li>
                          <li className="flex items-start gap-1"><DollarSign className="w-2.5 h-2.5 text-purple-400 mt-0.5 flex-shrink-0" />Free (10k chars) · $5/mo (30k) · $99/mo (500k)</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="resend" className="border border-border/50 rounded-lg px-3 bg-muted/20">
                      <AccordionTrigger className="text-xs font-semibold text-foreground py-2 hover:no-underline">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-blue-400" />
                          Resend Setup — Required
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" />Create account at resend.com</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" />Verify your sending domain (DNS records required)</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" />Generate API key for transactional emails</li>
                          <li className="flex items-start gap-1"><DollarSign className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" />Free (3k/mo) · $20/mo (50k)</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="knowledgebase" className="border border-primary/30 rounded-lg px-3 bg-primary/5">
                      <AccordionTrigger className="text-xs font-semibold text-primary py-2 hover:no-underline">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          Knowledge Base Documents — Required for AI
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <p className="text-[10px] text-muted-foreground mb-1.5">These documents teach the AI agents about your business. Upload during onboarding.</p>
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />Business description / About Us content</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />Service list with descriptions and pricing</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />FAQ document (common customer questions)</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />Business hours and holiday schedule</li>
                          <li className="flex items-start gap-1"><Check className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />Service area / zip codes</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

              </div>
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
                  {/* Platform Admin - Login only (no signup) */}
                  {mode === 'platform_admin' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@platform.com"
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
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Platform Admin accounts are created manually by existing administrators.
                      </p>
                    </form>
                  ) : (
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                    <TabsList className="w-full mb-6">
                      <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
                      <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
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
                          {mode === 'company' && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-300">
                                  <span className="font-medium text-blue-200">Google Calendar Integration:</span>{' '}
                                  Use the same email as your Google account to enable calendar sync.
                                </p>
                              </div>
                            </div>
                          )}
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
                          <PasswordStrengthIndicator 
                            password={password} 
                            onValidationChange={handlePasswordValidationChange}
                          />
                        </div>
                        <TermsAgreementCheckbox 
                          checked={termsAgreed} 
                          onCheckedChange={setTermsAgreed} 
                        />
                        {mode === 'company' && (
                          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                            <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Required Acknowledgments
                            </p>
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="ack-a2p"
                                checked={setupAcknowledged.a2p}
                                onCheckedChange={(v) => setSetupAcknowledged(prev => ({ ...prev, a2p: v === true }))}
                                className="mt-0.5"
                              />
                              <label htmlFor="ack-a2p" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                I understand <span className="font-medium text-foreground">A2P 10DLC SMS registration</span> is required and takes <span className="font-medium text-amber-400">2–4 weeks</span> for carrier approval before SMS works.
                              </label>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="ack-costs"
                                checked={setupAcknowledged.costs}
                                onCheckedChange={(v) => setSetupAcknowledged(prev => ({ ...prev, costs: v === true }))}
                                className="mt-0.5"
                              />
                              <label htmlFor="ack-costs" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                I acknowledge that <span className="font-medium text-foreground">SignalWire, ElevenLabs, and Resend</span> costs are <span className="font-medium text-foreground">separate from my subscription</span> and billed directly by each provider.
                              </label>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id="ack-kb"
                                checked={setupAcknowledged.knowledgeBase}
                                onCheckedChange={(v) => setSetupAcknowledged(prev => ({ ...prev, knowledgeBase: v === true }))}
                                className="mt-0.5"
                              />
                              <label htmlFor="ack-kb" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                I will provide <span className="font-medium text-foreground">knowledge base documents</span> (service list, FAQs, business info) during onboarding so the AI agents can function properly.
                              </label>
                            </div>
                          </div>
                        )}
                        <Button 
                          type="submit" 
                          className="w-full gradient-primary" 
                          disabled={isLoading || !termsAgreed || (mode === 'company' && (!setupAcknowledged.a2p || !setupAcknowledged.costs || !setupAcknowledged.knowledgeBase))}
                        >
                          {isLoading ? 'Creating account...' : mode === 'company' 
                            ? (selectedTier ? `Subscribe to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}` : 'Start Free Trial')
                            : 'Create Account'}
                        </Button>
                        {mode === 'company' && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            {selectedTier 
                              ? 'You will be redirected to Stripe to complete payment'
                              : '30 days free • No credit card required • Cancel anytime'}
                          </p>
                        )}
                      </form>
                    </TabsContent>
                  </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Billing/Onboarding Notices - Only show for company mode */}
          {mode === 'company' && (
            <div className="mt-8 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                  <Headphones className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold text-blue-400 text-sm mb-2">Concierge Onboarding</h4>
                <p className="text-xs text-foreground">
                  We'll configure all 3rd party integrations for a one-time fee <span className="font-bold text-blue-300">starting at $299</span>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="font-semibold text-amber-500 text-sm mb-2">Billing Requirement</h4>
                <p className="text-xs text-foreground">
                  A valid credit card must be on file for your Aura Intercept subscription and all connected 3rd party accounts.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-cyan-500" />
                </div>
                <h4 className="font-semibold text-cyan-500 text-sm mb-2">Invoice Payments</h4>
                <p className="text-xs text-foreground">
                  Connect your own Stripe account to process customer payments. We don't handle payments on your behalf.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
