import { useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { findAgentDefinition } from '@/lib/agentCatalog';
import { useAgentHealthMetrics, type HealthRange } from '@/hooks/useAgentHealthMetrics';

const RANGES: Array<{ id: HealthRange; label: string }> = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
];

/** Format a millisecond duration the way a person reads it. */
function ms(value: number): string {
  if (!value) return '—';
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

function agentLabel(type: string): string {
  return findAgentDefinition(type)?.name ?? type;
}

/**
 * Per-agent speed and reliability, plus any open health alerts.
 * Data comes from the daily rollup written by the background worker.
 */
export function AgentHealthPanel({ companyId }: { companyId: string }) {
  const [range, setRange] = useState<HealthRange>('7d');
  const { data, isLoading } = useAgentHealthMetrics(companyId, range);

  const rows = data?.rows ?? [];
  const alerts = data?.alerts ?? [];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Speed and reliability</h3>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={range === r.id ? 'default' : 'outline'}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Alert key={a.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">{a.title}</AlertTitle>
              <AlertDescription className="text-xs">{a.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agent activity recorded for this period yet. Numbers appear here once your agents
          start handling requests.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Slowest (95%)</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Handoffs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.agentType}>
                  <TableCell className="font-medium">{agentLabel(row.agentType)}</TableCell>
                  <TableCell className="text-right">{row.requests}</TableCell>
                  <TableCell className="text-right">{ms(row.avgMs)}</TableCell>
                  <TableCell className="text-right">{ms(row.p95Ms)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.successRate >= 95 ? 'secondary' : 'destructive'}>
                      {row.successRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.handoffs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
