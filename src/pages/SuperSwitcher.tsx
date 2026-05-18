import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Crown, Building2, Users, UserCircle, ArrowLeftRight, ExternalLink, RefreshCcw, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperSwitcher, SUPER_LAST_INDUSTRY } from '@/hooks/useSuperSwitcher';
import { useToast } from '@/hooks/use-toast';

interface DemoCo {
  id: string;
  name: string;
  slug: string;
  industry_vertical: string;
  subscription_tier: string | null;
  primary_color: string | null;
}

interface PackRow {
  industry_id: string;
  label: string;
}

const TIER_LABEL: Record<string, string> = {
  starter: 'Core',
  connect: 'Boost',
  performance: 'Pro',
  command: 'Elite',
};

export default function SuperSwitcher() {
  const { userRole, loading } = useAuth();
  const { enter } = useSuperSwitcher();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<DemoCo[]>([]);
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string>(() => localStorage.getItem(SUPER_LAST_INDUSTRY) || '');
  const [loadingData, setLoadingData] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const isAdmin = userRole === 'platform_admin';

  useEffect(() => { document.title = 'Super Switcher · Aura Intercept'; }, []);

  const load = async () => {
    setLoadingData(true);
    const [{ data: cos }, { data: pk }] = await Promise.all([
      supabase.from('companies')
        .select('id,name,slug,industry_vertical,subscription_tier,primary_color')
        .eq('is_demo', true)
        .order('industry_vertical'),
      supabase.from('industry_template_packs')
        .select('industry_id,label')
        .eq('is_active', true)
        .order('industry_id'),
    ]);
    setCompanies((cos || []) as DemoCo[]);
    setPacks((pk || []) as PackRow[]);
    setLoadingData(false);
  };

  useEffect(() => { load(); }, []);

  const indexedCo = useMemo(() => {
    const m = new Map<string, DemoCo>();
    companies.forEach((c) => { if (c.industry_vertical) m.set(c.industry_vertical, c); });
    return m;
  }, [companies]);

  const visiblePacks = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return packs;
    return packs.filter((p) => p.label.toLowerCase().includes(q) || p.industry_id.includes(q));
  }, [packs, filter]);

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      const { error } = await supabase.functions.invoke('seed-demo-accounts-v2', { body: {} });
      if (error) throw error;
      toast({ title: 'Seeding complete', description: 'Demo accounts refreshed.' });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Seeding failed';
      toast({ title: 'Seeding failed', description: msg, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  const handleProvisionReps = async () => {
    setProvisioning(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-sales-rep-accounts', { body: {} });
      if (error) throw error;
      const created = (data?.created || []).length;
      const updated = (data?.updated || []).length;
      toast({ title: 'Sales-rep logins ready', description: `${created} created, ${updated} refreshed.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Provisioning failed';
      toast({ title: 'Provisioning failed', description: msg, variant: 'destructive' });
    } finally {
      setProvisioning(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (userRole !== 'platform_admin' && userRole !== 'demo_rep') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Crown className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Super Switcher Hub</h1>
            <p className="text-xs text-muted-foreground">One demo login, every industry, every console.</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Crown className="w-3 h-3" /> {isAdmin ? 'super_admin' : 'sales_rep'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => window.location.assign('/auth'))}>Sign out</Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-4 flex flex-wrap items-center gap-3">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Quick switcher</span>
          <span className="text-xs text-muted-foreground">Industry</span>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Pick an industry…" />
            </SelectTrigger>
            <SelectContent>
              {packs.map((p) => {
                const co = indexedCo.get(p.industry_id);
                return (
                  <SelectItem key={p.industry_id} value={p.industry_id}>
                    {p.industry_id} — {co?.name || `Demo ${p.label}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Role</span>
            <Button size="sm" variant="outline" disabled={!selected} onClick={() => enter(selected, 'company')}><Building2 className="w-3.5 h-3.5 mr-1" />Company</Button>
            <Button size="sm" variant="outline" disabled={!selected} onClick={() => enter(selected, 'employee')}><Users className="w-3.5 h-3.5 mr-1" />Employee</Button>
            <Button size="sm" variant="outline" disabled={!selected} onClick={() => enter(selected, 'customer')}><UserCircle className="w-3.5 h-3.5 mr-1" />Customer</Button>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Filter industries…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
          <Button variant="ghost" size="sm" onClick={load} disabled={loadingData}><RefreshCcw className={`w-3.5 h-3.5 mr-1 ${loadingData ? 'animate-spin' : ''}`} />Refresh</Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={handleSeedAll} disabled={seeding}>
                {seeding ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                Seed / repair all demos
              </Button>
              <Button variant="outline" size="sm" onClick={handleProvisionReps} disabled={provisioning}>
                {provisioning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 mr-1" />}
                Provision sales-rep logins
              </Button>
              <Link to="/dashboard/demo-seeder" className="text-xs text-primary hover:underline ml-auto inline-flex items-center gap-1">
                Demo seeder console <ExternalLink className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {loadingData ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading demo accounts…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visiblePacks.map((p) => {
              const co = indexedCo.get(p.industry_id);
              const seeded = !!co;
              const tier = co?.subscription_tier ? TIER_LABEL[co.subscription_tier] || co.subscription_tier : '—';
              return (
                <Card key={p.industry_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.label}</h3>
                      <p className="text-xs text-muted-foreground">{co?.name || 'Not seeded yet'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={seeded ? 'default' : 'outline'} className="text-[10px]">{seeded ? 'LIVE' : 'NOT SEEDED'}</Badge>
                      {seeded && <Badge variant="outline" className="text-[10px]">{tier}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="secondary" disabled={!seeded} onClick={() => enter(p.industry_id, 'company')}>
                      <Building2 className="w-3.5 h-3.5 mr-1" />Company
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!seeded} onClick={() => enter(p.industry_id, 'employee')}>
                      <Users className="w-3.5 h-3.5 mr-1" />Employee
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!seeded} onClick={() => enter(p.industry_id, 'customer')}>
                      <UserCircle className="w-3.5 h-3.5 mr-1" />Customer
                    </Button>
                  </div>
                  {seeded && co?.slug && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <Link to={`/book/${co.slug}`} className="hover:text-primary inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />Public booking</Link>
                      <span>·</span>
                      <span>{p.industry_id}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}