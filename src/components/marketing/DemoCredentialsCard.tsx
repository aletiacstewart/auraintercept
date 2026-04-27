import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, CheckCircle2, LayoutDashboard, Wrench, User, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DemoCredentialsResult {
  success: boolean;
  trial_id: string;
  expires_at: string;
  password: string;
  admin: { email: string; redirect: string };
  employee: { email: string; redirect: string };
  customer: { email: string; redirect: string };
}

const ROLE_META = {
  admin: { icon: LayoutDashboard, label: 'Owner Dashboard', tag: 'Owner / Admin' },
  employee: { icon: Wrench, label: 'Technician App', tag: 'Field Technician' },
  customer: { icon: User, label: 'Customer Portal', tag: 'Your Customer' },
};

interface DemoCredentialsCardProps {
  result: DemoCredentialsResult;
}

export function DemoCredentialsCard({ result }: DemoCredentialsCardProps) {
  const [signingIn, setSigningIn] = useState<string | null>(null);

  const expiresIn = (() => {
    const ms = new Date(result.expires_at).getTime() - Date.now();
    const hrs = Math.max(0, Math.floor(ms / 3600000));
    return `${hrs} hours`;
  })();

  const launchAs = async (role: 'admin' | 'employee' | 'customer') => {
    setSigningIn(role);
    const creds = result[role];
    try {
      // Sign out current user (if any) first to avoid collision
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: result.password,
      });
      if (error) throw error;
      window.location.href = creds.redirect;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      toast.error(msg);
      setSigningIn(null);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-primary/10 text-primary">
        <span className="font-medium">Demo expires in {expiresIn}</span>
        <span>Universal password: <code className="font-mono">{result.password}</code></span>
      </div>

      {(['admin', 'employee', 'customer'] as const).map((role) => {
        const meta = ROLE_META[role];
        const Icon = meta.icon;
        const creds = result[role];
        return (
          <Card key={role} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">{meta.label}</h4>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{meta.tag}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <code className="font-mono truncate">{creds.email}</code>
                  <Button variant="ghost" size="icon-xs" onClick={() => copy(creds.email, 'email')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  onClick={() => launchAs(role)}
                  disabled={signingIn !== null}
                >
                  {signingIn === role ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> Signing in...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" /> Open {meta.label}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      <p className="text-[11px] text-muted-foreground text-center">
        We've also emailed these credentials to you. After 48 hours the demo company is automatically deleted.
      </p>
    </div>
  );
}
