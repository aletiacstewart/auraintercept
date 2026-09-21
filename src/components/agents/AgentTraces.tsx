import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { findAgentDefinition } from '@/lib/agentCatalog';
import { Activity, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type Range = '1h' | '24h' | '7d';
const RANGE_MS: Record<Range, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

interface LogRow {
  id: string;
  trace_id: string;
  agent_type: string;
  action: string;
  span_name: string;
  span_id: string | null;
  parent_span_id: string | null;
  status: string;
  success: boolean;
  duration_ms: number | null;
  created_at: string;
  error_message: string | null;
}

interface Trace {
  trace_id: string;
  spans: LogRow[];
  startedAt: string;
  totalMs: number;
  hasError: boolean;
  agentTypes: string[];
}

function agentLabel(type: string): string {
  return findAgentDefinition(type)?.name ?? type;
}

/** Group agent log rows by trace_id and compute each trace's span tree. */
function groupTraces(rows: LogRow[]): Trace[] {
  const byTrace = new Map<string, LogRow[]>();
  for (const r of rows) {
    if (!r.trace_id) continue;
    const arr = byTrace.get(r.trace_id) ?? [];
    arr.push(r);
    byTrace.set(r.trace_id, arr);
  }
  const traces: Trace[] = [];
  for (const [trace_id, spans] of byTrace) {
    spans.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const start = spans[0]?.created_at ?? '';
    const total = spans.reduce((m, s) => m + (s.duration_ms ?? 0), 0);
    traces.push({
      trace_id,
      spans,
      startedAt: start,
      totalMs: total,
      hasError: spans.some((s) => s.status === 'error' || s.success === false),
      agentTypes: Array.from(new Set(spans.map((s) => s.agent_type).filter(Boolean))),
    });
  }
  return traces.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

function ms(value: number | null): string {
  if (value == null) return '—';
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

/**
 * Distributed-trace viewer. Groups traced agent log rows by trace_id and renders
 * each trace as a waterfall of spans, so you can see a request travel across
 * agents. Data comes from the spans the agent chat tracer flushes into
 * `ai_agent_logs` (trace_id / span_id / parent_span_id).
 */
export function AgentTraces({ companyId }: { companyId: string }) {
  const [range, setRange] = useState<Range>('24h');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'error' | 'ok'>('all');
  const [selected, setSelected] = useState<Trace | null>(null);
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery<LogRow[]>({
    queryKey: ['agent-traces', companyId, range],
    staleTime: 15_000,
    queryFn: async () => {
      const since = new Date(Date.now() - RANGE_MS[range]).toISOString();
      const { data, error } = await supabase
        .from('ai_agent_logs')
        .select(
          'id, trace_id, agent_type, action, span_name, span_id, parent_span_id, status, success, duration_ms, created_at, error_message',
        )
        .eq('company_id', companyId)
        .not('trace_id', 'is', null)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const allTraces = groupTraces(rows ?? []);
  const agentOptions = Array.from(
    new Set(allTraces.flatMap((t) => t.agentTypes)),
  ).sort();

  const traces = allTraces.filter((t) => {
    if (agentFilter !== 'all' && !t.agentTypes.includes(agentFilter)) return false;
    if (statusFilter === 'error' && !t.hasError) return false;
    if (statusFilter === 'ok' && t.hasError) return false;
    return true;
  });

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Request traces</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {(['1h', '24h', '7d'] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? 'default' : 'outline'}
                onClick={() => setRange(r)}
              >
                {r === '1h' ? '1 hour' : r === '24h' ? '24 hours' : '7 days'}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ['agent-traces'] })}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Agent</span>
          <select
            className="h-8 rounded border bg-background px-2 text-xs"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          >
            <option value="all">All agents</option>
            {agentOptions.map((a) => (
              <option key={a} value={a}>
                {agentLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="flex gap-1">
            {(['all', 'ok', 'error'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s === 'ok' ? 'OK' : 'Errors'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : traces.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No traced requests in this window yet.</p>
          <p className="text-xs">
            Traces appear here when agents run with distributed tracing on.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {traces.slice(0, 50).map((t) => {
            const maxMs = t.totalMs || 1;
            return (
              <button
                key={t.trace_id}
                onClick={() => setSelected(t)}
                className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.trace_id.slice(0, 8)}
                    </span>
                    {t.agentTypes.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">
                        {agentLabel(a)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.hasError ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        error
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        ok
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {ms(t.totalMs)} · {format(new Date(t.startedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
                {/* waterfall */}
                <div className="space-y-1">
                  {t.spans.map((s) => {
                    const widthPct = Math.max(
                      2,
                      Math.min(100, ((s.duration_ms ?? 0) / maxMs) * 100),
                    );
                    const isError = s.status === 'error' || s.success === false;
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">
                          {s.span_name || s.action}
                        </span>
                        <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                          <div
                            className={`h-full rounded ${
                              isError ? 'bg-destructive' : 'bg-primary/70'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                          {ms(s.duration_ms)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm">
              {selected?.trace_id ?? ''}
            </SheetTitle>
            <SheetDescription>
              {selected?.spans.length ?? 0} spans · {ms(selected?.totalMs ?? 0)} total
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-2 px-4 pb-6">
              {selected.spans.map((s) => {
                const isError = s.status === 'error' || s.success === false;
                return (
                  <div
                    key={s.id}
                    className={`border-l-2 pl-3 py-2 ${
                      isError ? 'border-destructive' : 'border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {s.span_name || s.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ms(s.duration_ms)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {agentLabel(s.agent_type)}
                      </Badge>
                      <Badge
                        variant={isError ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {s.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), 'h:mm:ss a')}
                      </span>
                    </div>
                    {s.error_message && (
                      <p className="text-xs text-destructive mt-1 break-words">
                        {s.error_message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
