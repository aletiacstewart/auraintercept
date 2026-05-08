import { useState } from 'react';
import { Sparkles, Loader2, Copy, CheckCircle2, Building2, Crown } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SeedResult {
  ok: boolean;
  industry?: string;
  label?: string;
  tier?: string;
  company_id?: string;
  users?: {
    admin: { email: string; created: boolean };
    employee: { email: string; created: boolean };
    customer: { email: string; created: boolean };
  };
  error?: string;
}

const PASSWORD = 'aidemo*!';

const INDUSTRIES_BY_TIER: Record<string, Array<{ key: string; label: string }>> = {
  core: [
    { key: 'beauty_wellness', label: 'Beauty & Wellness' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'real_estate', label: 'Real Estate' },
    { key: 'personal_assistant', label: 'Personal Assistant' },
  ],
  boost: [
    { key: 'handyman', label: 'Handyman & Cleaning' },
    { key: 'auto_care', label: 'Auto Care' },
    { key: 'appliance_repair', label: 'Appliance Repair' },
    { key: 'pest_control', label: 'Pest Control' },
    { key: 'fencing', label: 'Fencing & Decking' },
  ],
  pro: [
    { key: 'security_systems', label: 'Security Systems' },
    { key: 'pool_spa', label: 'Pool & Spa' },
    { key: 'landscape', label: 'Landscape & Trees' },
    { key: 'solar', label: 'Solar' },
  ],
  elite: [
    { key: 'hvac', label: 'HVAC' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'plumbing', label: 'Plumbing' },
    { key: 'roofing', label: 'Roofing' },
    { key: 'construction', label: 'Construction' },
  ],
};

const TIER_META: Record<string, { name: string; price: string; color: string }> = {
  core:  { name: 'Aura Core',  price: '$197/mo',   color: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
  boost: { name: 'Aura Boost', price: '$497/mo',   color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
  pro:   { name: 'Aura Pro',   price: '$997/mo',   color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  elite: { name: 'Aura Elite', price: '$1,997/mo', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

export default function DemoAccountSeeder() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SeedResult[] | null>(null);
  const [seedingTenant, setSeedingTenant] = useState(false);
  const [seedingSuper, setSeedingSuper] = useState(false);

  const runSeedSuperAdmin = async () => {
    setSeedingSuper(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-super-admin');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Failed');
      toast.success(`Super-admin ready: ${data.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSeedingSuper(false);
    }
  };

  const runSeed = async () => {
    setRunning(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-accounts-v2');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Seeding failed');
      setResults(data.results as SeedResult[]);
      toast.success(`Seeded ${data.total} industry demo companies`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Seeding failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(`Copied ${email}`);
  };

  const runAuraInterceptSeed = async () => {
    setSeedingTenant(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-aura-intercept');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Seed failed');
      toast.success(`Aura Intercept tenant ready — ${data.personas?.length ?? 0} accounts. Password: aiagent*!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setSeedingTenant(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Sparkles}
          title="Demo Account Seeder"
          description="Recreate the 18-industry demo environment: 18 companies × (admin + employee + customer) = 54 accounts, with industry-specific demo data per company."
        />

        <Card>
          <CardHeader>
            <CardTitle>What this creates</CardTitle>
            <CardDescription>
              Universal password for all 54 accounts: <code className="font-mono bg-muted px-2 py-1 rounded">{PASSWORD}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(INDUSTRIES_BY_TIER).map(([tierKey, industries]) => {
              const meta = TIER_META[tierKey];
              return (
                <div key={tierKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={meta.color}>{meta.name}</Badge>
                    <span className="text-xs text-muted-foreground">{meta.price} · {industries.length} industries</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {industries.map((ind) => {
                      const ek = ind.key.replace(/_/g, '');
                      return (
                        <div key={ind.key} className="border rounded-lg p-3 bg-muted/20">
                          <div className="font-semibold text-sm mb-1">Demo {ind.label}</div>
                          <div className="text-[10px] space-y-0.5 text-muted-foreground font-mono">
                            <div>{ek}admin@demo.com</div>
                            <div>{ek}employee@demo.com</div>
                            <div>{ek}customer@demo.com</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <Alert>
              <AlertDescription>
                Re-running is safe. Existing demo users have their password reset; companies upsert by slug; demo data
                (appointments, leads, campaigns, blog posts, quotes, invoices, inventory) is wiped and re-seeded with
                industry-specific content. Old tier-based demo accounts (corecompany@, boostemployee@, etc.) are
                cleaned up automatically on first run.
              </AlertDescription>
            </Alert>

            <Button onClick={runSeed} disabled={running} size="lg" className="w-full">
              {running ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding 18 industries…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Seed All Demo Accounts</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Aura Intercept Tenant</CardTitle>
            <CardDescription>
              Real Elite-tier company on the platform (not demo). Password: <code className="font-mono bg-muted px-2 py-1 rounded">aiagent*!</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs space-y-1 font-mono text-muted-foreground">
              <div>auraintercept@gmail.com · company_admin</div>
              <div>support@auraintercept.ai · employee + technician</div>
              <div>sales@auraintercept.ai · employee + technician</div>
            </div>
            <Alert>
              <AlertDescription>
                Sets up the real Aura Intercept workspace so prospect companies can reach you via the platform's chat,
                voice, SMS, public booking, and customer portal. Idempotent — safe to re-run; passwords are reset each run.
                Does NOT touch <code>ai@auraintercept.ai</code> (your platform_admin).
              </AlertDescription>
            </Alert>
            <Button onClick={runAuraInterceptSeed} disabled={seedingTenant} size="lg" className="w-full" variant="secondary">
              {seedingTenant ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding tenant…</>
              ) : (
                <><Building2 className="mr-2 h-4 w-4" /> Seed Aura Intercept Tenant</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5" /> Super Admin (Switcher Hub)</CardTitle>
            <CardDescription>
              Creates <code className="font-mono bg-muted px-2 py-1 rounded">superadmin@auraintercept.ai</code> with platform_admin role.
              Password is the <code>SUPER_ADMIN_PASSWORD</code> secret. Sign in with that account to land on
              <code className="ml-1">/super-switcher</code> and jump into any demo company / employee / customer in one click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runSeedSuperAdmin} disabled={seedingSuper} size="lg" className="w-full" variant="outline">
              {seedingSuper ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating super-admin…</>
              ) : (
                <><Crown className="mr-2 h-4 w-4" /> Create / Reset Super Admin</>
              )}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Click any email to copy. Password: {PASSWORD}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((r) => {
                const meta = r.tier ? TIER_META[r.tier] : null;
                return (
                  <div key={r.industry} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {r.ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <span className="text-destructive">✗</span>}
                        <span className="font-semibold">Demo {r.label ?? r.industry}</span>
                        {meta && <Badge variant="outline" className={meta.color}>{meta.name}</Badge>}
                      </div>
                      {r.ok && <Badge variant="secondary">{r.company_id?.slice(0, 8)}…</Badge>}
                    </div>
                    {r.ok && r.users ? (
                      <div className="space-y-1.5">
                        {Object.entries(r.users).map(([role, u]) => (
                          <button
                            key={role}
                            onClick={() => copyEmail(u.email)}
                            className="flex items-center justify-between w-full text-sm bg-muted/50 hover:bg-muted px-3 py-2 rounded font-mono"
                          >
                            <span>{u.email}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={u.created ? 'default' : 'outline'} className="text-[10px]">
                                {u.created ? 'NEW' : 'EXISTS'}
                              </Badge>
                              <Copy className="h-3 w-3" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-destructive">{r.error}</div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
