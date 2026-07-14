import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kanban, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'repeat_customer', label: 'Repeat' },
] as const;
type StageKey = typeof STAGES[number]['key'];

interface PipelineRow {
  id: string;
  company_id: string;
  customer_profile_id: string | null;
  lead_id: string | null;
  stage: StageKey;
  deal_value_cents: number | null;
  next_action: string | null;
  next_action_due_at: string | null;
  last_activity_at: string | null;
  stage_changed_at: string;
  customer_name?: string | null;
}

export default function PipelineConsole() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
      .then(({ data }) => setCompanyId(data?.company_id ?? null));
  }, [user]);

  const fetchRows = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_pipeline')
      .select('*, customer_profiles(name)')
      .eq('company_id', companyId)
      .order('last_activity_at', { ascending: false, nullsFirst: false });
    if (error) {
      toast.error('Failed to load pipeline');
      setRows([]);
    } else {
      setRows(
        (data || []).map((r: any) => ({
          ...r,
          customer_name: r.customer_profiles?.name ?? null,
        })),
      );
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const rowsByStage = useMemo(() => {
    const map: Record<string, PipelineRow[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const r of rows) (map[r.stage] || (map[r.stage] = [])).push(r);
    return map;
  }, [rows]);

  const overdue = useMemo(
    () =>
      rows
        .filter(r => r.next_action_due_at && new Date(r.next_action_due_at) < new Date())
        .sort((a, b) => new Date(a.next_action_due_at!).getTime() - new Date(b.next_action_due_at!).getTime()),
    [rows],
  );

  const moveTo = async (rowId: string, newStage: StageKey) => {
    const prev = rows;
    setRows(rs => rs.map(r => (r.id === rowId ? { ...r, stage: newStage } : r)));
    const { error } = await supabase
      .from('customer_pipeline')
      .update({ stage: newStage, last_activity_at: new Date().toISOString() })
      .eq('id', rowId);
    if (error) {
      setRows(prev);
      toast.error('Move failed');
    } else {
      toast.success(`Moved to ${newStage}`);
    }
  };

  const clearNextAction = async (rowId: string) => {
    const prev = rows;
    setRows(rs => rs.map(r => (r.id === rowId ? { ...r, next_action: null, next_action_due_at: null } : r)));
    const { error } = await supabase
      .from('customer_pipeline')
      .update({ next_action: null, next_action_due_at: null })
      .eq('id', rowId);
    if (error) {
      setRows(prev);
      toast.error('Update failed');
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };
  const onDrop = (e: React.DragEvent, stage: StageKey) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) moveTo(id, stage);
  };
  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="business_management">
          <div className="space-y-6">
            <PageHeader
              icon={Kanban}
              title="Pipeline"
              description="Lead & deal tracking for your Lead Capture & Scoring operatives."
              featureColor="platform"
            />

            {overdue.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold">Needs attention ({overdue.length})</h3>
                </div>
                <ul className="space-y-2">
                  {overdue.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{r.customer_name || 'Unknown'}</span>
                        <span className="text-muted-foreground"> — {r.next_action}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          due {formatDistanceToNow(new Date(r.next_action_due_at!), { addSuffix: true })}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => clearNextAction(r.id)}>
                        <Check className="h-3 w-3 mr-1" />Mark done
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STAGES.map(s => (
                <div
                  key={s.key}
                  onDragOver={allowDrop}
                  onDrop={e => onDrop(e, s.key)}
                  className="rounded-lg border border-border bg-muted/30 p-2 min-h-[300px]"
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-sm font-semibold">{s.label}</span>
                    <Badge variant="secondary">{rowsByStage[s.key]?.length ?? 0}</Badge>
                  </div>
                  <div className="space-y-2">
                    {(rowsByStage[s.key] || []).map(r => (
                      <Card
                        key={r.id}
                        draggable
                        onDragStart={e => onDragStart(e, r.id)}
                        className="p-2 cursor-move text-xs"
                      >
                        <div className="font-medium truncate">{r.customer_name || 'Unknown'}</div>
                        {r.deal_value_cents != null && (
                          <div className="text-muted-foreground">
                            ${(r.deal_value_cents / 100).toLocaleString()}
                          </div>
                        )}
                        {r.last_activity_at && (
                          <div className="text-muted-foreground text-[10px]">
                            {formatDistanceToNow(new Date(r.last_activity_at), { addSuffix: true })}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!loading && rows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pipeline entries yet. Rows appear as leads are captured and quotes/jobs progress.
              </p>
            )}
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}