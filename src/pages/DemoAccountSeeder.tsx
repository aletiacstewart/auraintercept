import { useState } from 'react';
import { Sparkles, Loader2, Copy, CheckCircle2 } from 'lucide-react';
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
  tier?: string;
  company_id?: string;
  users?: {
    admin: { email: string; created: boolean };
    employee: { email: string; created: boolean };
    customer: { email: string; created: boolean };
  };
  error?: string;
}

const TIER_INFO = [
  { key: 'core', label: 'Aura Core', price: '$197/mo', company: 'Demo Core' },
  { key: 'boost', label: 'Aura Boost', price: '$497/mo', company: 'Demo Boost' },
  { key: 'pro', label: 'Aura Pro', price: '$997/mo', company: 'Demo Pro' },
  { key: 'elite', label: 'Aura Elite', price: '$1,997/mo', company: 'Demo Elite' },
];

const PASSWORD = 'aidemo*!';

export default function DemoAccountSeeder() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SeedResult[] | null>(null);

  const runSeed = async () => {
    setRunning(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-accounts-v2');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Seeding failed');
      setResults(data.results as SeedResult[]);
      toast.success('Demo accounts seeded successfully');
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

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Sparkles}
          title="Demo Account Seeder"
          description="Recreate the 4-tier demo environment: 4 companies × (admin + employee + customer) = 12 accounts, plus realistic demo data per tier."
        />

        <Card>
          <CardHeader>
            <CardTitle>What this creates</CardTitle>
            <CardDescription>
              Universal password for all 12 accounts: <code className="font-mono bg-muted px-2 py-1 rounded">{PASSWORD}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {TIER_INFO.map((t) => (
                <div key={t.key} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{t.label}</div>
                    <Badge variant="outline">{t.price}</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground font-mono">
                    <div>{t.key}company@demo.com</div>
                    <div>{t.key}employee@demo.com</div>
                    <div>{t.key}customer@demo.com</div>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertDescription>
                Re-running is safe. Existing demo users get their password reset; companies are upserted; demo data
                (appointments, leads, campaigns, blog posts, quotes, invoices, inventory) is wiped and re-seeded for each tier.
              </AlertDescription>
            </Alert>

            <Button onClick={runSeed} disabled={running} size="lg" className="w-full">
              {running ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding 4 tiers…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Seed All Demo Accounts</>
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
              {results.map((r) => (
                <div key={r.tier} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {r.ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <span className="text-destructive">✗</span>}
                      <span className="font-semibold capitalize">{r.tier}</span>
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
              ))}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
