import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  getReportableIntakeFields,
  pickDefaultIntakeField,
  chartKindForField,
} from '@/lib/intakeAnalytics';
import {
  getAnalyticsPresetsForPack,
  pickInitialPreset,
  type IndustryAnalyticsPreset,
} from '@/lib/industryAnalyticsPresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ClipboardList, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--secondary) / 0.6)',
];

type Source = 'appointments' | 'leads';
type Range = '30d' | '90d' | 'all';
type View = 'distribution' | 'trend' | 'completeness';

interface DistributionRow { bucket: string; count: number }
interface TimeseriesRow { period: string; count: number; distinct_values: number }
interface CompletenessRow { field: string; total: number; filled: number; pct: number }

function rangeToSince(range: Range): string | null {
  if (range === 'all') return null;
  const days = range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface IntakeAnalyticsProps {
  companyId: string;
}

export function IntakeAnalytics({ companyId }: IntakeAnalyticsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pack, loading: packLoading } = useIndustryPack(companyId);

  const [source, setSource] = useState<Source>(
    (searchParams.get('source') as Source) === 'leads' ? 'leads' : 'appointments',
  );
  const [range, setRange] = useState<Range>('90d');

  const fields = useMemo(() => getReportableIntakeFields(pack), [pack]);
  const presets = useMemo(
    () => getAnalyticsPresetsForPack(pack, fields),
    [pack, fields],
  );
  const initialPreset = useMemo(() => pickInitialPreset(presets), [presets]);
  const initialField =
    searchParams.get('field') ??
    initialPreset?.field ??
    pickDefaultIntakeField(fields)?.name ??
    '';
  const [fieldName, setFieldName] = useState<string>(initialField);

  // If the URL didn't dictate a source/view but the chosen preset does,
  // honor the preset's defaults on first mount only.
  useEffect(() => {
    if (!initialPreset) return;
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if (!searchParams.get('source') && initialPreset.source) {
      params.set('source', initialPreset.source);
      setSource(initialPreset.source);
      changed = true;
    }
    if (!searchParams.get('view') && initialPreset.view) {
      params.set('view', initialPreset.view);
      changed = true;
    }
    if (changed) setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreset?.id]);

  const activeField = fields.find((f) => f.name === fieldName) ?? null;

  // Deep-link "view" param drives auto-focus on a specific card.
  const requestedView = searchParams.get('view') as View | null;
  const distRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const completenessRef = useRef<HTMLDivElement>(null);
  const [highlightView, setHighlightView] = useState<View | null>(null);

  useEffect(() => {
    if (!requestedView) return;
    const ref =
      requestedView === 'trend'
        ? trendRef
        : requestedView === 'completeness'
          ? completenessRef
          : distRef;
    // Wait one frame so the cards have laid out.
    const id = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightView(requestedView);
      window.setTimeout(() => setHighlightView(null), 2200);
    }, 80);
    return () => window.clearTimeout(id);
  }, [requestedView]);

  const ringFor = (view: View) =>
    highlightView === view ? 'ring-2 ring-primary/40 transition-shadow' : '';

  const updateParams = (next: Partial<{ source: Source; field: string }>) => {
    const params = new URLSearchParams(searchParams);
    if (next.source) params.set('source', next.source);
    if (next.field) params.set('field', next.field);
    setSearchParams(params, { replace: true });
  };

  const applyPreset = (preset: IndustryAnalyticsPreset) => {
    setSource(preset.source);
    if (preset.field) setFieldName(preset.field);
    const params = new URLSearchParams(searchParams);
    params.set('source', preset.source);
    if (preset.field) params.set('field', preset.field);
    params.set('view', preset.view);
    setSearchParams(params, { replace: true });
    // Mirror the existing deep-link auto-scroll/highlight behaviour.
    const ref =
      preset.view === 'trend'
        ? trendRef
        : preset.view === 'completeness'
          ? completenessRef
          : distRef;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightView(preset.view);
      window.setTimeout(() => setHighlightView(null), 2200);
    }, 80);
  };

  const distributionQuery = useQuery({
    queryKey: ['intake-distribution', source, fieldName, range],
    enabled: !!fieldName,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('intake_field_distribution', {
        p_source: source,
        p_field: fieldName,
        p_since: rangeToSince(range),
      });
      if (error) throw error;
      return (data || []) as DistributionRow[];
    },
  });

  const timeseriesQuery = useQuery({
    queryKey: ['intake-timeseries', source, fieldName],
    enabled: !!fieldName,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('intake_field_timeseries', {
        p_source: source,
        p_field: fieldName,
        p_months: 12,
      });
      if (error) throw error;
      return (data || []) as TimeseriesRow[];
    },
  });

  const completenessQuery = useQuery({
    queryKey: ['intake-completeness', source],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('intake_field_completeness', {
        p_source: source,
      });
      if (error) throw error;
      return (data || []) as CompletenessRow[];
    },
  });

  if (packLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  const hasFields = fields.length > 0;

  if (!hasFields) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Industry Intake Reporting
          </CardTitle>
          <CardDescription>
            No industry intake fields configured for this company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Industry intake reporting unlocks once your company is on an
            industry template pack with vertical-specific questions
            (e.g. HVAC system age, Real Estate pre-approval). Pick an industry
            in your settings and the booking agent will start capturing
            structured data automatically.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard/settings">Configure industry</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Per-vertical analytics presets */}
      {presets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Suggested views{pack?.label ? ` for ${pack.label}` : ''}
            </CardTitle>
            <CardDescription className="text-xs">
              One-click shortcuts curated for your industry. Click any chip to
              jump straight to the matching chart.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => applyPreset(p)}
                  title={p.description ?? p.label}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Source</label>
              <Select
                value={source}
                onValueChange={(v) => {
                  const next = v as Source;
                  setSource(next);
                  updateParams({ source: next });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Field</label>
              <Select
                value={fieldName}
                onValueChange={(v) => {
                  setFieldName(v);
                  updateParams({ field: v });
                }}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Pick an intake field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      <span className="flex items-center gap-2">
                        {f.label}
                        <Badge variant="outline" className="text-[10px]">
                          {f.type}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Range</label>
              <div className="flex gap-1">
                {(['30d', '90d', 'all'] as Range[]).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={range === r ? 'default' : 'outline'}
                    onClick={() => setRange(r)}
                  >
                    {r === 'all' ? 'All time' : `Last ${r}`}
                  </Button>
                ))}
              </div>
            </div>

            {pack?.label && (
              <div className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {pack.label} pack
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <Card ref={distRef} className={ringFor('distribution')}>
          <CardHeader>
            <CardTitle className="text-base">
              {activeField?.label ?? 'Field'} distribution
            </CardTitle>
            <CardDescription>
              How {source} are distributed across captured values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distributionQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (distributionQuery.data ?? []).length === 0 ? (
              <EmptyState message="No data captured for this field yet." />
            ) : (
              <DistributionChart
                data={distributionQuery.data ?? []}
                kind={activeField ? chartKindForField(activeField.type) : 'bar'}
              />
            )}
          </CardContent>
        </Card>

        {/* Timeseries */}
        <Card ref={trendRef} className={ringFor('trend')}>
          <CardHeader>
            <CardTitle className="text-base">Capture trend (12 mo)</CardTitle>
            <CardDescription>
              How often this field is being captured each month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeseriesQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (timeseriesQuery.data ?? []).length === 0 ? (
              <EmptyState message="No history yet for this field." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeseriesQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(v) => {
                      try { return format(parseISO(String(v)), 'MMM yy'); } catch { return String(v); }
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completeness */}
      <Card ref={completenessRef} className={ringFor('completeness')}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Intake completeness
          </CardTitle>
          <CardDescription>
            Fields with low fill rates may be questions Aura is dropping or
            customers are skipping. Lowest fill first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completenessQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (completenessQuery.data ?? []).length === 0 ? (
            <EmptyState message="No intake records yet for this source." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Field</th>
                    <th className="py-2 pr-4">Filled</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2">Fill rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(completenessQuery.data ?? []).map((row) => {
                    const labeled = fields.find((f) => f.name === row.field);
                    return (
                      <tr
                        key={row.field}
                        className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => {
                          setFieldName(row.field);
                          updateParams({ field: row.field });
                        }}
                      >
                        <td className="py-2 pr-4">{labeled?.label ?? row.field}</td>
                        <td className="py-2 pr-4">{row.filled}</td>
                        <td className="py-2 pr-4">{row.total}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.min(100, Number(row.pct) || 0)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums">
                              {Number(row.pct).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DistributionChart({
  data,
  kind,
}: {
  data: DistributionRow[];
  kind: 'bar' | 'donut' | 'histogram' | 'timeseries' | 'table';
}) {
  if (kind === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="bucket"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}