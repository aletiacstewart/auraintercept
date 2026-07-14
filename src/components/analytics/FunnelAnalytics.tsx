import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics, FUNNEL_STAGES } from '@/hooks/useFunnelAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

export function FunnelAnalytics() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, error } = useFunnelAnalytics(days);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Signup Funnel</h2>
          <p className="text-sm text-muted-foreground">
            Anonymous visitor journey on the public marketing site. Sessions stitched via
            localStorage.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v, 10))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Failed to load funnel data: {(error as Error).message}
          </CardContent>
        </Card>
      ) : !data ? null : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Conversion by stage</CardTitle>
              <CardDescription>
                {data.totalSessions.toLocaleString()} unique sessions in the selected window
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.stageCounts}
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'Sessions']}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="sessions" position="top" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {data.stageCounts.map((s) => (
                  <div
                    key={s.stage}
                    className="rounded-md border border-border/60 bg-muted/30 p-2 text-center"
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-primary font-mono">{s.sessions.toLocaleString()}</div>
                    {s.conversionFromPrev !== null && (
                      <div className="text-muted-foreground">{s.conversionFromPrev}% from prev</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top industries</CardTitle>
              <CardDescription>Sessions reaching each stage, by industry (top 10)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byIndustry.length === 0 ? (
                <p className="text-sm text-muted-foreground">No industry data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Industry</TableHead>
                        {FUNNEL_STAGES.map((s) => (
                          <TableHead key={s} className="text-right whitespace-nowrap">
                            {s.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byIndustry.map((row) => (
                        <TableRow key={row.industry}>
                          <TableCell className="font-medium">{row.industry}</TableCell>
                          {FUNNEL_STAGES.map((s) => (
                            <TableCell key={s} className="text-right font-mono">
                              {row.counts[s] ?? 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attribution</CardTitle>
              <CardDescription>Sessions grouped by UTM source or referrer host</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byAttribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attribution data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byAttribution.map((row) => (
                      <TableRow key={row.source}>
                        <TableCell className="font-medium">{row.source}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.sessions.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <CancellationReasonsPanel />
    </div>
  );
}

const REASON_LABEL: Record<string, string> = {
  too_expensive: 'Too expensive',
  missing_feature: 'Missing a feature I need',
  switching: 'Switching to another tool',
  no_time: 'Not enough time to set up',
  other: 'Other',
};

function CancellationReasonsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['cancellation-reasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('cancellation_reason')
        .not('cancellation_reason', 'is', null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const r = (row.cancellation_reason as string | null) ?? 'other';
        counts.set(r, (counts.get(r) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const total = (data ?? []).reduce((sum, r) => sum + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancellation reasons</CardTitle>
        <CardDescription>
          Why customers canceled — captured in the in-app cancel dialog before Stripe portal handoff.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cancellations recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.reason}>
                  <TableCell className="font-medium">
                    {REASON_LABEL[row.reason] ?? row.reason}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.count}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {total > 0 ? `${Math.round((row.count / total) * 100)}%` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}