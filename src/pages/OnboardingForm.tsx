import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CompanyOnboardingForm } from '@/components/onboarding/CompanyOnboardingForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GateState = 'checking' | 'locked' | 'unlocked';

export default function OnboardingFormPage() {
  const [params, setParams] = useSearchParams();
  const initialToken = params.get('token') || '';
  const [state, setState] = useState<GateState>('checking');
  const [token, setToken] = useState(initialToken);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const validate = async (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return false;
    try {
      const { data, error } = await supabase.functions.invoke('get-onboarding-invite', {
        body: { token: trimmed },
      });
      if (error || (data as any)?.error) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      // Platform admins bypass the token gate entirely.
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const { data: adminFlag } = await supabase.rpc('has_role', {
            _user_id: uid,
            _role: 'platform_admin',
          });
          if (adminFlag === true) {
            setIsAdmin(true);
            setState('unlocked');
            return;
          }
        }
      } catch {
        /* non-fatal — fall through to token gate */
      }

      if (!initialToken) {
        setState('locked');
        return;
      }
      const ok = await validate(initialToken);
      setState(ok ? 'unlocked' : 'locked');
      if (!ok) toast.error('Your onboarding link is invalid or expired. Paste your code below to continue.');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    const ok = await validate(input.trim());
    setSubmitting(false);
    if (!ok) {
      toast.error('That code is invalid or expired.');
      return;
    }
    setToken(input.trim());
    setParams({ token: input.trim() }, { replace: true });
    setState('unlocked');
    toast.success('Onboarding unlocked');
  };

  if (state === 'checking') {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'locked') {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Onboarding Access</CardTitle>
            <CardDescription>
              Your onboarding code was emailed to you right after signup. Paste it below to open your workbook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your onboarding code"
                  className="pl-9 font-mono"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !input.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Can't find it? Check your inbox for "Welcome to Aura Intercept" or email{' '}
                <a href="mailto:ai@auraintercept.ai" className="text-primary hover:underline">
                  ai@auraintercept.ai
                </a>
                .
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background py-8">
      {isAdmin && (
        <div className="max-w-2xl mx-auto px-4 mb-4 flex justify-center">
          <Badge variant="secondary" className="border-primary/40">
            <ShieldCheck className="w-3 h-3 mr-1" /> Platform admin preview — gate bypassed
          </Badge>
        </div>
      )}
      <CompanyOnboardingForm token={isAdmin ? null : token} />
    </div>
  );
}
