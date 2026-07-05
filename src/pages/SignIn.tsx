import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Shield, UserCircle, Users } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'platform_admin' | 'company' | 'employee' | 'customer';
const VALID_MODES: AuthMode[] = ['platform_admin', 'company', 'employee', 'customer'];

const MODE_META: Record<AuthMode, { title: string; description: string; icon: typeof Building2 }> = {
  platform_admin: { title: 'Platform Admin', description: 'Access the platform administration dashboard', icon: Shield },
  employee: { title: 'Employee Portal', description: 'Sign in to your employee dashboard', icon: Users },
  customer: { title: 'Customer Portal', description: 'Access your service history and appointments', icon: UserCircle },
  company: { title: 'Company Portal', description: 'Sign in to your Aura Intercept account', icon: Building2 },
};

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const rawMode = searchParams.get('mode');
  const mode: AuthMode = rawMode && VALID_MODES.includes(rawMode as AuthMode) ? (rawMode as AuthMode) : 'company';
  const source = searchParams.get('source');
  const nextRaw = searchParams.get('next');
  // Only accept same-origin relative paths, per app-mcp-server-authoring redirect rules.
  const nextPath = nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : null;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const meta = MODE_META[mode];
  const Icon = meta.icon;

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

    if (authData.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      toast({ title: 'Welcome back!', description: 'Redirecting...' });

      if (nextPath) {
        navigate(nextPath, { replace: true });
      } else if (roleData?.role === 'customer') {
        navigate('/customer');
      } else {
        navigate('/dashboard');
      }
    }

    setIsLoading(false);
  };

  const signUpHref = `/signup${mode !== 'company' ? `?mode=${mode}` : ''}`;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-2xl gradient-primary p-0.5 shadow-glow">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Aura Intercept" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Aura Intercept</h1>
              <p className="text-sm text-muted-foreground">Smart Agents, Automated Service</p>
              {source === 'qr' && (
                <p className="mt-2 text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                  Mode: {mode} | Source: {source}
                </p>
              )}
            </div>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex flex-wrap justify-center gap-2 text-sm mb-4">
                <Button variant={mode === 'customer' ? 'default' : 'ghost'} size="sm"
                  className={mode === 'customer' ? 'gradient-primary' : ''}
                  onClick={() => navigate('/signin?mode=customer')}>
                  <UserCircle className="w-4 h-4 mr-1" /> Customer
                </Button>
                <Button variant={mode === 'employee' ? 'default' : 'ghost'} size="sm"
                  className={mode === 'employee' ? 'gradient-primary' : ''}
                  onClick={() => navigate('/signin?mode=employee')}>
                  <Users className="w-4 h-4 mr-1" /> Employee
                </Button>
                <Button variant={mode === 'company' ? 'default' : 'ghost'} size="sm"
                  className={mode === 'company' ? 'gradient-primary' : ''}
                  onClick={() => navigate('/signin?mode=company')}>
                  <Building2 className="w-4 h-4 mr-1" /> Company
                </Button>
                <Button variant={mode === 'platform_admin' ? 'default' : 'ghost'} size="sm"
                  className={mode === 'platform_admin' ? 'gradient-primary' : ''}
                  onClick={() => navigate('/signin?mode=platform_admin')}>
                  <Shield className="w-4 h-4 mr-1" /> Platform Admin
                </Button>
              </div>
              <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">{meta.title}</CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="flex justify-end">
                  <ForgotPasswordDialog />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {mode === 'platform_admin' ? (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Platform Admin accounts are created manually by existing administrators.
                </p>
              ) : (
                <p className="text-sm text-center text-muted-foreground mt-6">
                  Don't have an account?{' '}
                  <Link to={signUpHref} className="text-primary font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}