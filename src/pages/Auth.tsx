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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRY_LIST } from '@/lib/industryTemplates';
import { toCanonicalIndustryId, isCanonicalIndustryId } from '@/lib/industryIdAliases';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Bot, Building2, Users, Shield, Check, Zap, Phone, Mail, Mic, UserCircle, DollarSign, FileText, Calendar, Search, Headphones, Send, AlertTriangle } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { TermsAgreementCheckbox } from '@/components/auth/TermsAgreementCheckbox';
import { SmsOptInCheckbox } from '@/components/auth/SmsOptInCheckbox';
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
  const tierParam = searchParams.get('tier');
  const industryParam = searchParams.get('industry');
  
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
  const [selectedTier, setSelectedTier] = useState<'starter' | 'connect' | 'performance' | 'command' | null>(null);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  // 4-tier structure: Core, Boost, Pro, Elite
  const [passwordValidation, setPasswordValidation] = useState<ServerValidationResult | null>(null);
  const [setupAcknowledged, setSetupAcknowledged] = useState({ a2p: false, costs: false, knowledgeBase: false });
  const [wantsConcierge, setWantsConcierge] = useState(false);
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessIndustry, setBusinessIndustry] = useState('');
  const [complianceFiles, setComplianceFiles] = useState<File[]>([]);
  // TCPA / 10DLC opt-in for SMS sent BY Aura Intercept (platform messages)
  const [auraSmsOptIn, setAuraSmsOptIn] = useState(false);

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

  // Pre-select tier and industry from query params (deep-link from /for-business)
  useEffect(() => {
    if (tierParam && ['starter', 'connect', 'performance', 'command'].includes(tierParam)) {
      setSelectedTier(tierParam as 'starter' | 'connect' | 'performance' | 'command');
    }
    if (industryParam) {
      setBusinessIndustry(industryParam);
    }
  }, [tierParam, industryParam]);

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
      // Create company — honor the tier the user picked at signup (defaults to Core if skipped)
      // and the industry they selected. Both drive console/dashboard/agent unlocks downstream
      // (subscription_tier feeds tier gating; industry_vertical fires trg_seed_industry_pack_kb
      // and powers useIndustryPack everywhere). 90-day trial regardless of tier.
      const canonicalIndustry = toCanonicalIndustryId(businessIndustry);
      if (!canonicalIndustry || !isCanonicalIndustryId(canonicalIndustry)) {
        toast({
          title: 'Industry required',
          description: 'Please select your industry from the dropdown so we can set up the right console, agents, and templates.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      const validTiers = ['starter', 'connect', 'performance', 'command'] as const;
      const tierToPersist = (selectedTier && (validTiers as readonly string[]).includes(selectedTier))
        ? selectedTier
        : 'starter';
      const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug,
          address: companyAddress || null,
          phone: companyPhone || null,
          subscription_tier: tierToPersist,
          industry_vertical: canonicalIndustry,
          is_demo: false,
          trial_ends_at: trialEndsAt,
          aura_sms_opt_in: auraSmsOptIn,
          aura_sms_consent_at: auraSmsOptIn ? new Date().toISOString() : null,
          industry_config:
            canonicalIndustry === 'other' && customIndustryDescription.trim()
              ? { description: customIndustryDescription.trim() }
              : null,
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
          .update({
            company_id: companyData.id,
            full_name: fullName,
            phone: companyPhone || null,
            aura_sms_opt_in: auraSmsOptIn,
            aura_sms_consent_at: auraSmsOptIn ? new Date().toISOString() : null,
          })
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

      // Initialize the company's AI agent configuration based on the selected
      // plan + industry, so the dashboard, AI Operatives Hub, and consoles
      // immediately show the correct Aura Core/Boost/Pro/Elite agents instead
      // of an empty hub.
      try {
        await supabase.functions.invoke('initialize-company-agents', {
          body: { company_id: companyData.id },
        });
      } catch (initErr) {
        console.warn('AI agent initialization failed (non-fatal):', initErr);
      }

      // Upload compliance documents (DBA / EIN / formation papers) to private
      // storage and record metadata. Non-fatal: signup still succeeds if any
      // file fails — admin can re-upload later from settings.
      if (complianceFiles.length > 0) {
        const uploadFailures: string[] = [];
        for (const file of complianceFiles) {
          try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${companyData.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
            const { error: uploadErr } = await supabase.storage
              .from('compliance-docs')
              .upload(path, file, { contentType: file.type, upsert: false });
            if (uploadErr) {
              uploadFailures.push(file.name);
              continue;
            }
            const lower = file.name.toLowerCase();
            const docType: 'dba' | 'ein' | 'formation' | 'other' =
              lower.includes('dba') ? 'dba'
              : (lower.includes('ein') || lower.includes('tax')) ? 'ein'
              : (lower.includes('llc') || lower.includes('inc') || lower.includes('formation') || lower.includes('articles')) ? 'formation'
              : 'other';
            await supabase.from('company_compliance_documents').insert({
              company_id: companyData.id,
              uploaded_by: authData.user.id,
              file_path: path,
              file_name: file.name,
              mime_type: file.type || null,
              size_bytes: file.size,
              doc_type: docType,
              status: 'pending',
            });
          } catch (e) {
            uploadFailures.push(file.name);
          }
        }
        if (uploadFailures.length > 0) {
          toast({
            title: 'Some documents did not upload',
            description: `${uploadFailures.join(', ')} — please re-upload from Settings → Compliance.`,
            variant: 'destructive',
          });
        }
      }

      toast({ 
        title: 'Welcome! 🎉', 
        description: 'Your 90-day free trial has started. Enjoy full access to all features!' 
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
          description: 'Start your 90-day free trial',
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
                      <Calendar className="w-4 h-4 text-cyan-400" />
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
                      <h3 className="text-sm font-bold text-foreground">90-Day Free Trial — Full Access</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your <span className="font-semibold text-foreground">90-day free trial</span> activates the plan you select below — Core, Boost, Pro, or Elite — with all of that plan's agents, control centers, and integrations turned on for your industry. No credit card required. You can upgrade or downgrade anytime during the trial.
                    </p>
                </div>
                </div>

                {/* Beta Notice */}
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                      <Zap className="w-2.5 h-2.5" /> Beta
                    </span>
                    <span className="text-xs font-semibold text-foreground">We're in Beta!</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All users who join during the beta period receive <span className="font-semibold text-primary">90 days of free access</span> for testing. All we ask is your honest feedback to help us improve the platform.
                  </p>
                </div>

                {/* FCC 10DLC Notice */}
                <div className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-semibold text-warning mb-1">SMS — FCC 10DLC Compliance</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Our SMS system is currently undergoing FCC approval. <span className="font-medium text-foreground">10DLC (10-Digit Long Code)</span> is the US carrier registration standard for business SMS. Without 10DLC registration, messages sent over standard long-code numbers are likely to be filtered or blocked by carriers. SMS features will be fully activated once registration is approved (typically 2-4 weeks). <span className="font-medium text-foreground">Company Requirement:</span> Each company must provide their EIN, DBA, and LLC or Inc documentation so we can register your business for FCC 10DLC approval.
                      </p>
                    </div>
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

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-xs font-medium transition-colors ${!isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                  <button
                    type="button"
                    onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isAnnualBilling ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isAnnualBilling ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-xs font-medium transition-colors ${isAnnualBilling ? 'text-foreground' : 'text-muted-foreground'}`}>Annual</span>
                  {isAnnualBilling && <span className="text-[10px] text-green-500 font-semibold">Save ~20%</span>}
                </div>

{/* 4 Tier Rows - Compact Single Line */}
                <div className="space-y-1">
                  {[
                    { id: 'starter',     name: 'Aura Core',  sub: 'Solo operators • Restaurants • Single-location', monthlyPrice: '$197',   annualPrice: '$164', annualTotal: '$1,970', savings: '$394',   color: 'teal',   popular: false },
                    { id: 'connect',     name: 'Aura Boost', sub: 'HVAC • Plumbing • Field Service',               monthlyPrice: '$497',   annualPrice: '$414', annualTotal: '$4,970', savings: '$994',   color: 'primary', popular: true  },
                    { id: 'performance', name: 'Aura Pro',   sub: 'Growing companies • Multiple technicians',      monthlyPrice: '$997',   annualPrice: '$831', annualTotal: '$9,970', savings: '$1,994', color: 'purple',  popular: false },
                    { id: 'command',     name: 'Aura Elite', sub: 'Full Suite • Enterprise • Unlimited',       monthlyPrice: '$1,997', annualPrice: '$1,664', annualTotal: '$19,970', savings: '$3,994', color: 'amber', popular: false },
                  ].map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTier(selectedTier === t.id ? null : t.id as 'starter' | 'connect' | 'performance' | 'command')}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded border cursor-pointer transition-all relative ${
                        t.popular
                          ? selectedTier === t.id
                            ? 'border-primary bg-primary/10'
                            : 'border-primary/40 bg-primary/5 hover:border-primary'
                          : selectedTier === t.id
                            ? `border-${t.color}-500 bg-${t.color}-500/10`
                            : `border-border/40 bg-card/60 hover:border-${t.color}-500/40`
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3 h-3 shrink-0 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === t.id
                            ? t.popular ? 'border-primary bg-primary' : `border-${t.color}-500 bg-${t.color}-500`
                            : t.popular ? 'border-primary/50' : 'border-muted-foreground/40'
                        }`}>
                          {selectedTier === t.id && <Check className="w-1.5 h-1.5 text-white" />}
                        </div>
                        <span className={`text-xs font-semibold truncate ${t.popular ? 'text-foreground' : 'text-card-foreground'}`}>{t.name}</span>
                        {t.popular && <span className="text-[8px] px-1 py-0.5 rounded gradient-primary text-primary-foreground font-medium shrink-0">Popular</span>}
                        <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">— {t.sub}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-xs font-bold ${t.popular ? 'text-primary' : `text-${t.color}-500`}`}>
                          {isAnnualBilling ? t.annualPrice : t.monthlyPrice}
                          <span className="font-normal text-muted-foreground">/mo</span>
                        </span>
                        {isAnnualBilling && (
                          <span className="text-[9px] text-muted-foreground">({t.annualTotal}/yr)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selection Info */}
                {selectedTier && (
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-center text-foreground">
                      <span className="font-medium">Selected: {
                        selectedTier === 'starter' ? 'Aura Core' :
                        selectedTier === 'connect' ? 'Aura Boost' :
                        selectedTier === 'performance' ? 'Aura Pro' :
                        'Aura Elite'
                      }{isAnnualBilling ? ' (Annual)' : ' (Monthly)'}</span>
                    </p>
                  </div>
                )}

                {/* Annual Savings Note */}
                {isAnnualBilling && selectedTier && (
                  <p className="text-xs text-center text-green-500">
                    💰 Billed annually — save ${
                      { starter: '394', connect: '994', performance: '1,994', command: '3,994' }[selectedTier]
                    }/year
                  </p>
                )}
                {isAnnualBilling && !selectedTier && (
                  <p className="text-xs text-center text-green-500">
                    💰 Billed annually — save up to $3,994/year
                  </p>
                )}

                {/* Customer Info */}
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-[10px] text-center text-foreground">
                    <span className="font-medium text-green-600">Customers get free accounts</span> to engage with registered companies!
                  </p>
                </div>

                {/* 3rd Party Costs + Setup — Compact Accordion */}
                <Accordion type="single" collapsible className="border border-border/40 rounded-lg overflow-hidden">
                  <AccordionItem value="costs" className="border-0">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                        <span>3rd-Party Costs & Required Setup</span>
                        <span className="ml-1 text-[9px] font-normal text-muted-foreground">(est. $29–$211/mo separate)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      {/* Base/Free Limits Notice */}
                      <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                        <p className="text-[9px] text-amber-300 leading-relaxed">
                          <span className="font-semibold">⚠ All plans have base limits.</span> Limits below reflect each provider's free/intro tier (bundled into your plan). Any usage <span className="font-semibold">over these limits</span> is billed at the end of each month <span className="font-semibold">in addition to</span> your plan fee. 3rd-party fees may change at any time at the provider's discretion.
                        </p>
                      </div>
                      {/* Cost table */}
                      <div className="space-y-1 mb-3">
                        {[
                          { icon: <Shield className="w-2.5 h-2.5 text-amber-400" />, name: 'A2P 10DLC', cost: '$4+$15 one-time · $10/mo', limit: 'Base: 1 brand + 1 campaign', note: '⚠ 2–4 wk approval', color: 'text-amber-400' },
                          { icon: <Phone className="w-2.5 h-2.5 text-green-400" />, name: 'SignalWire', cost: 'Included in tier', limit: 'Base: ~$2/mo number + bundled minutes/SMS per tier', note: 'Boost+', color: 'text-green-400' },
                          { icon: <Mic className="w-2.5 h-2.5 text-purple-400" />, name: 'ElevenLabs', cost: 'Included in tier', limit: 'Free tier: 10k chars/mo (~10 min TTS)', note: 'Boost+', color: 'text-purple-400' },
                          { icon: <Mail className="w-2.5 h-2.5 text-cyan-400" />, name: 'Resend', cost: 'Included in tier', limit: 'Free tier: 3,000 emails/mo · 100/day', note: 'All tiers', color: 'text-cyan-400' },
                          { icon: <Calendar className="w-2.5 h-2.5 text-cyan-400" />, name: 'Google Calendar', cost: 'Free', limit: '1M API requests/day (free)', note: 'All tiers', color: 'text-cyan-400' },
                          { icon: <DollarSign className="w-2.5 h-2.5 text-amber-400" />, name: 'Stripe', cost: '2.9% + $0.30/txn', limit: 'No free tier — per-transaction only', note: 'Elite', color: 'text-amber-400' },
                          { icon: <Send className="w-2.5 h-2.5 text-pink-400" />, name: 'Social Media', cost: 'Free (OAuth)', limit: 'Per-platform API rate limits apply', note: 'Pro+', color: 'text-pink-400' },
                          { icon: <Search className="w-2.5 h-2.5 text-orange-400" />, name: 'Tavily AI', cost: 'Included in tier', limit: 'Free tier: 1,000 searches/mo', note: 'All tiers', color: 'text-orange-400' },
                        ].map(({ icon, name, cost, limit, note, color }) => (
                          <div key={name} className="py-1 border-b border-border/20 last:border-0">
                            <div className="flex items-center justify-between text-[9px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {icon}
                                <span className={`font-medium ${color}`}>{name}</span>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="text-foreground/80">{cost}</span>
                                <span className="text-muted-foreground ml-1">· {note}</span>
                              </div>
                            </div>
                            <p className="text-[8px] text-muted-foreground/80 mt-0.5 pl-4">{limit}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mb-3 text-[8px] italic text-muted-foreground/70 leading-relaxed">
                        Over-limit usage on any 3rd-party service will be invoiced at month-end in addition to your Aura plan fee. Provider fees and free-tier limits are set by each vendor and may change at any time.
                      </p>

                      {/* Setup docs — nested accordion */}
                      <div className="border border-primary/20 rounded-md overflow-hidden">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="setup-docs" className="border-0">
                            <AccordionTrigger className="px-2.5 py-1.5 hover:no-underline hover:bg-primary/5 text-[10px] font-semibold text-primary">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                Required Documents for Setup (click to expand)
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-2.5 pb-2">
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                                <div>
                                  <p className="font-semibold text-amber-400 mb-0.5">A2P 10DLC Docs</p>
                                  <p>• Business legal name + EIN</p>
                                  <p>• Business type (LLC/Corp/etc.)</p>
                                  <p>• SMS use-case + sample message</p>
                                  <p>• Est. monthly SMS volume</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-green-400 mb-0.5">SignalWire</p>
                                  <p>• Account at signalwire.com</p>
                                  <p>• Phone number (~$2/mo)</p>
                                  <p className="font-semibold text-purple-400 mb-0.5 mt-1">ElevenLabs</p>
                                  <p>• API key + voice selection</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-cyan-400 mb-0.5">Resend</p>
                                  <p>• Verified sending domain</p>
                                  <p>• API key</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-primary mb-0.5">AI Knowledge Base</p>
                                  <p>• About Us / business desc.</p>
                                  <p>• Services + pricing list</p>
                                  <p>• FAQ + business hours</p>
                                  <p>• Service area / zip codes</p>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

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

                        {/* Business Info — company mode only */}
                        {mode === 'company' && (
                          <div className="space-y-3 border border-border/30 rounded-lg p-3 bg-card/40">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Business Information</p>

                            {/* Address + Phone row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor="companyAddress" className="text-xs">Business Address</Label>
                                <Input
                                  id="companyAddress"
                                  type="text"
                                  placeholder="123 Main St, City, ST 12345"
                                  value={companyAddress}
                                  onChange={(e) => setCompanyAddress(e.target.value)}
                                  className="text-xs h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="companyPhone" className="text-xs">Business Phone</Label>
                                <Input
                                  id="companyPhone"
                                  type="tel"
                                  placeholder="(555) 555-5555"
                                  value={companyPhone}
                                  onChange={(e) => setCompanyPhone(e.target.value)}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>

                            {/* Business Type + Industry row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Business Type</Label>
                                <Select value={businessType} onValueChange={setBusinessType}>
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select type…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['LLC', 'Corporation (Corp)', 'S-Corporation (S-Corp)', 'C-Corporation (C-Corp)', 'Incorporated (Inc)', 'Partnership', 'Sole Proprietor', 'Other'].map(t => (
                                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Business Industry</Label>
                                <Select value={businessIndustry} onValueChange={setBusinessIndustry}>
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select industry…" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {INDUSTRY_LIST.map(ind => (
                                      <SelectItem key={ind.id} value={ind.id} className="text-xs">{ind.icon} {ind.label}</SelectItem>
                                    ))}
                                    <SelectItem value="other" className="text-xs">✨ Other / Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {businessIndustry === 'other' && (
                              <div className="space-y-1">
                                <Label className="text-xs">Describe Your Business</Label>
                                <p className="text-[11px] text-muted-foreground">
                                  In one sentence — what do you sell or schedule, and who is your customer? Aura uses this to tailor your console, agents, and scripts.
                                </p>
                                <Input
                                  placeholder="e.g. We run a mobile dog-grooming service for busy pet owners."
                                  value={customIndustryDescription}
                                  onChange={(e) => setCustomIndustryDescription(e.target.value)}
                                  className="text-xs h-8"
                                />
                              </div>
                            )}

                            {/* Compliance documents upload (combined) */}
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Compliance Documents <span className="text-destructive font-normal">(required for SMS/Text & API Approval)</span>
                              </Label>
                              <p className="text-[11px] text-muted-foreground">
                                Upload DBA, EIN/Tax ID, and LLC/Inc formation documents. You can select multiple files.
                              </p>
                              <label className="flex items-center gap-2 px-2 py-1.5 rounded border border-border/50 bg-card cursor-pointer hover:border-primary/40 transition-colors text-xs text-muted-foreground">
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {complianceFiles.length > 0
                                    ? `${complianceFiles.length} file${complianceFiles.length > 1 ? 's' : ''} selected`
                                    : 'Upload PDF/DOC/PNG… (multiple allowed)'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => setComplianceFiles(Array.from(e.target.files ?? []))}
                                />
                              </label>
                              {complianceFiles.length > 0 && (
                                <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-1">
                                  {complianceFiles.map((f, i) => (
                                    <li key={i} className="truncate">• {f.name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
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
                                <Calendar className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-cyan-300">
                                  <span className="font-medium text-cyan-200">Google Calendar Integration:</span>{' '}
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

                        {mode === 'company' && (
                          <SmsOptInCheckbox
                            checked={auraSmsOptIn}
                            onCheckedChange={setAuraSmsOptIn}
                            phone={companyPhone}
                            recipientLabel="my business"
                            id="aura-sms-opt-in-company"
                          />
                        )}

                        {/* Concierge Onboarding Optional Add-On */}
                        {mode === 'company' && (
                          <div
                            className={`rounded-lg border-2 p-3 cursor-pointer transition-all ${
                              wantsConcierge
                                ? 'border-primary bg-primary/10'
                                : 'border-border/40 bg-muted/20 hover:border-primary/40'
                            }`}
                            onClick={() => setWantsConcierge(v => !v)}
                          >
                            <div className="flex items-start gap-2.5">
                              <Checkbox
                                id="concierge-onboarding"
                                checked={wantsConcierge}
                                onCheckedChange={(v) => setWantsConcierge(v === true)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <label htmlFor="concierge-onboarding" className="flex items-center gap-1.5 cursor-pointer font-semibold text-xs text-foreground">
                                  <Headphones className="w-3.5 h-3.5 text-primary" />
                                  Add Concierge Onboarding
                                  <span className="ml-auto text-primary font-bold">
                                    {selectedTier === 'performance' || selectedTier === 'command' ? '$697' : '$397'}
                                  </span>
                                </label>
                                 <p className="text-[10px] text-muted-foreground mt-0.5">
                                   We'll configure all Aura Intercept setup &amp; 3rd party integrations for a one-time fee of <span className="font-semibold text-foreground">{selectedTier === 'performance' || selectedTier === 'command' ? '$697 (Pro & Elite)' : '$397 (Core & Boost)'}</span>. Assistance from primary owner or manager required for company details.
                                 </p>
                                 <p className="text-[9px] text-muted-foreground/60 mt-0.5 italic">
                                   Optional — can also be purchased later from your dashboard.
                                 </p>
                              </div>
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
                              : '90 days free • No credit card required • Cancel anytime'}
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
                  <Headphones className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="font-semibold text-cyan-400 text-sm mb-2">Concierge Onboarding</h4>
                 <p className="text-xs text-foreground">
                   We'll configure all Aura Intercept setup &amp; 3rd party integrations for a <span className="font-bold text-cyan-300">one-time fee of $397 (Core &amp; Boost) or $697 (Pro &amp; Elite)</span>. Assistance from primary owner or manager required for company details.
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
