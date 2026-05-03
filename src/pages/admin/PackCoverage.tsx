import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ShieldCheck, BarChart3 } from 'lucide-react';

interface PackRow {
  industry_id: string;
  cluster: string;
  label: string;
  terminology: any;
  agent_prompt_deltas: any;
  kb_seed_documents: any[];
  service_catalog: any[];
  console_visibility: any;
}

const PARITY = { kb: 3, services: 4, terminology: 5 };

export default function PackCoverage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pack-coverage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_template_packs')
        .select('industry_id, cluster, label, terminology, agent_prompt_deltas, kb_seed_documents, service_catalog, console_visibility')
        .eq('is_active', true)
        .order('cluster')
        .order('industry_id');
      if (error) throw error;
      return (data ?? []) as unknown as PackRow[];
    },
  });

  const rows = data ?? [];
  const totals = {
    packs: rows.length,
    fullKB: rows.filter((r) => (r.kb_seed_documents?.length ?? 0) >= PARITY.kb).length,
    fullSvc: rows.filter((r) => (r.service_catalog?.length ?? 0) >= PARITY.services).length,
    fullTerm: rows.filter((r) => Object.keys(r.terminology ?? {}).length >= PARITY.terminology).length,
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={ShieldCheck}
          title="Industry Pack Coverage"
          description="Audit terminology, KB seeds, prompt deltas and service catalogs across all 28 packs."
          featureColor="config"
        />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total packs', value: totals.packs },
            { label: `KB ≥${PARITY.kb} docs`, value: `${totals.fullKB}/${totals.packs}` },
            { label: `Services ≥${PARITY.services}`, value: `${totals.fullSvc}/${totals.packs}` },
            { label: `Terminology ≥${PARITY.terminology}`, value: `${totals.fullTerm}/${totals.packs}` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-semibold mt-1">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Pack</th>
                  <th className="text-left p-3">Cluster</th>
                  <th className="text-center p-3">Terminology</th>
                  <th className="text-center p-3">KB seeds</th>
                  <th className="text-center p-3">Services</th>
                  <th className="text-center p-3">Prompt deltas</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {rows.map((r) => {
                  const term = Object.keys(r.terminology ?? {}).length;
                  const kb = r.kb_seed_documents?.length ?? 0;
                  const svc = r.service_catalog?.length ?? 0;
                  const deltas = Object.keys(r.agent_prompt_deltas ?? {}).length;
                  const cell = (val: number, ok: boolean) => (
                    <span className={`inline-flex items-center gap-1 ${ok ? 'text-primary' : 'text-amber-500'}`}>
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {val}
                    </span>
                  );
                  return (
                    <tr key={r.industry_id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="p-3 font-medium">{r.label}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px] uppercase">{r.cluster}</Badge></td>
                      <td className="p-3 text-center">{cell(term, term >= PARITY.terminology)}</td>
                      <td className="p-3 text-center">{cell(kb, kb >= PARITY.kb)}</td>
                      <td className="p-3 text-center">{cell(svc, svc >= PARITY.services)}</td>
                      <td className="p-3 text-center">{cell(deltas, deltas >= 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Marketing playbooks live in <code className="px-1 bg-muted rounded">src/lib/industryMarketingPlaybooks.ts</code>; voice greetings in <code className="px-1 bg-muted rounded">src/lib/industryVoiceGreetings.ts</code>.
        </p>
      </PageContainer>
    </DashboardLayout>
  );
}
