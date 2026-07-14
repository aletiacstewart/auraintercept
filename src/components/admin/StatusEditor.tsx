import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

type ServiceRow = {
  id: string;
  component: string;
  display_name: string;
  status: 'operational' | 'degraded' | 'down';
  note: string | null;
};

type IncidentRow = {
  id: string;
  title: string;
  description: string | null;
  severity: 'minor' | 'major' | 'critical';
  started_at: string;
  resolved_at: string | null;
};

export function StatusEditor() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState({ title: '', description: '', severity: 'minor' as const });

  const load = async () => {
    setLoading(true);
    const [{ data: svc }, { data: inc }] = await Promise.all([
      supabase.from('service_status').select('*').order('display_name'),
      supabase.from('status_incidents').select('*').order('started_at', { ascending: false }).limit(20),
    ]);
    setServices((svc as ServiceRow[]) || []);
    setIncidents((inc as IncidentRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateService = async (row: ServiceRow, patch: Partial<ServiceRow>) => {
    setSavingId(row.id);
    const { error } = await supabase.from('service_status').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else { toast.success('Updated'); load(); }
  };

  const createIncident = async () => {
    if (!newIncident.title.trim()) return toast.error('Title required');
    const { error } = await supabase.from('status_incidents').insert({
      title: newIncident.title.trim(),
      description: newIncident.description.trim() || null,
      severity: newIncident.severity,
    });
    if (error) return toast.error(error.message);
    setNewIncident({ title: '', description: '', severity: 'minor' });
    toast.success('Incident posted');
    load();
  };

  const resolveIncident = async (id: string) => {
    const { error } = await supabase.from('status_incidents').update({ resolved_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Marked resolved'); load(); }
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Service statuses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-3 border-b border-border pb-3 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.display_name}</div>
                <div className="text-xs text-muted-foreground">{s.component}</div>
              </div>
              <Select value={s.status} onValueChange={(v) => updateService(s, { status: v as ServiceRow['status'] })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="md:w-64"
                placeholder="Optional note"
                defaultValue={s.note || ''}
                onBlur={(e) => { if (e.target.value !== (s.note || '')) updateService(s, { note: e.target.value || null }); }}
              />
              {savingId === s.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Post an incident</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label>Title</Label>
              <Input value={newIncident.title} onChange={(e) => setNewIncident((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Elevated SMS delivery delays" />
            </div>
            <div className="space-y-1">
              <Label>Severity</Label>
              <Select value={newIncident.severity} onValueChange={(v: any) => setNewIncident((s) => ({ ...s, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={newIncident.description} onChange={(e) => setNewIncident((s) => ({ ...s, description: e.target.value }))} />
          </div>
          <Button onClick={createIncident}>Post incident</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent incidents</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {incidents.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
          {incidents.map((i) => (
            <div key={i.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.title}</div>
                {i.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(i.started_at).toLocaleString()} · {i.severity}
                  {i.resolved_at && ` · resolved ${new Date(i.resolved_at).toLocaleString()}`}
                </div>
              </div>
              {!i.resolved_at && (
                <Button size="sm" variant="outline" onClick={() => resolveIncident(i.id)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}