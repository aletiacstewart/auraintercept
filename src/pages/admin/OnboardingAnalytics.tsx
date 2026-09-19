import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface EventRow {
  event_type: string;
  company_id: string;
  metadata: { step?: string; durationMinutes?: number } | null;
  created_at: string;
}

const STEP_LABELS: Record<string, string> = {
  business_type: 'Business type',
  calendar: 'Calendar',
  communications: 'Calls, texts, email',
  team: 'Team',
  test_workflow: 'Test run',
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * Admin-only view of how new companies get through First Steps: how many start,
 * how many finish, how long it takes and where people drop off.
 */
export default function OnboardingAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-analytics'],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from('onboarding_analytics')
        .select('event_type, company_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const byType = (t: string) => rows.filter((r) => r.event_type === t);
    const companies = (t: string) => new Set(byType(t).map((r) => r.company_id));

    const started = companies('onboarding_started');
    const finished = companies('onboarding_finished');
    const durations = byType('onboarding_finished')
      .map((r) => Number(r.metadata?.durationMinutes ?? NaN))
      .filter((n) => Number.isFinite(n));
    const medianMinutes = durations.length
      ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
      : null;

    const stepData = Object.entries(STEP_LABELS).map(([id, label]) => ({
      step: label,
      completed: new Set(
        byType('onboarding_step_completed')
          .filter((r) => r.metadata?.step === id)
          .map((r) => r.company_id),
      ).size,
      skipped: new Set(
        byType('onboarding_step_skipped')
          .filter((r) => r.metadata?.step === id)
          .map((r) => r.company_id),
      ).size,
    }));

    return {
      started: started.size,
      finished: finished.size,
      completionRate: started.size ? Math.round((finished.size / started.size) * 100) : 0,
      medianMinutes,
      firstBooking: companies('first_booking_created').size,
      firstAgent: companies('first_agent_enabled').size,
      connections: byType('integration_connected').length,
      stepData,
    };
  }, [data]);

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Onboarding"
          description="How new companies get through First Steps, and where they stall."
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Started" value={String(stats.started)} hint="companies" />
              <StatCard
                label="Finished"
                value={`${stats.completionRate}%`}
                hint={`${stats.finished} of ${stats.started}`}
              />
              <StatCard
                label="Typical time to finish"
                value={stats.medianMinutes === null ? '—' : `${stats.medianMinutes} min`}
              />
              <StatCard
                label="Reached a first action"
                value={String(stats.firstBooking)}
                hint="booked or quoted"
              />
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Step by step</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.stepData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="step" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="skipped"
                      name="Skipped"
                      fill="hsl(var(--muted-foreground))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Turned on an agent" value={String(stats.firstAgent)} hint="companies" />
              <StatCard label="Connections set up" value={String(stats.connections)} />
              <StatCard label="Events recorded" value={String((data ?? []).length)} hint="most recent 1,000" />
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
