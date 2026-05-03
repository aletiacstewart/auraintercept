import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { TrendingUp, Target, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ResolvedWorkspace } from '@/lib/workspace/types';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

const STAGES = [
  { key: 'new', label: 'New Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'demo', label: 'Demo / Showing' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
];

export function PipelineConsole({ workspace, companyId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newWeek, setNewWeek] = useState<number | null>(null);
  const [atRisk, setAtRisk] = useState<number | null>(null);

  useEffect(() => {
    const wkAgo = new Date(); wkAgo.setDate(wkAgo.getDate() - 7);
    (async () => {
      const [allRes, wkRes, riskRes] = await Promise.all([
        supabase.from('leads').select('status').eq('company_id', companyId),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('company_id', companyId).gte('created_at', wkAgo.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('company_id', companyId).eq('priority', 'high'),
      ]);
      const map: Record<string, number> = {};
      (allRes.data ?? []).forEach((r: any) => {
        const k = (r.status ?? 'new').toLowerCase();
        map[k] = (map[k] ?? 0) + 1;
      });
      setCounts(map);
      setNewWeek(wkRes.count ?? 0);
      setAtRisk(riskRes.count ?? 0);
    })();
  }, [companyId]);

  const fmt = (v: number | null) => (v === null ? '…' : String(v));
  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);
  const wonCount = counts['won'] ?? counts['converted'] ?? 0;
  const conversion = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title={`${workspace.industryName} — Sales Pipeline`}
        description="Deal-stage console — no dispatch board, no truck map"
        featureColor="leads"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" /> New leads (week)
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(newWeek)}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Conversion rate
          </div>
          <div className="mt-2 text-3xl font-semibold">{conversion}%</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Total leads
          </div>
          <div className="mt-2 text-3xl font-semibold">{totalLeads}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" /> High-priority
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(atRisk)}</div>
        </Card>
      </div>
      <Card className="p-6 surface-elevated-dark">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {STAGES.map((s) => (
            <div
              key={s.key}
              className="rounded-md border border-border/50 bg-card/50 p-3 text-sm"
            >
              <div className="font-medium">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold">{counts[s.key] ?? 0}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}