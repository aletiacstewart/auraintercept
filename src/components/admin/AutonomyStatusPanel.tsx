import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface CronJob {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
}

const FRIENDLY: Record<string, string> = {
  'aura-appointment-reminders': 'Appointment Reminders',
  'aura-lead-followup-reminders': 'Lead Follow-Up Reminders',
  'aura-check-unsubscribe-alerts': 'Unsubscribe Alerts',
  'aura-trial-reminders': 'Trial Reminders',
  'aura-weekly-digest': 'Weekly Digest',
  'aura-monthly-digest': 'Monthly Digest',
  'aura-quarterly-digest': 'Quarterly Digest',
  'aura-cost-alerts': 'Cost Alerts',
  'aura-publish-social-content': 'Social Content Publisher',
  'aura-generate-blog-batch': 'Blog Batch Generator',
  'aura-cron-health-check': 'Autonomy Health Probe',
};

export function AutonomyStatusPanel() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['autonomy-cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_autonomy_cron_jobs' as any);
      if (error) throw error;
      return (data ?? []) as CronJob[];
    },
    refetchInterval: 60_000,
  });

  const total = data?.length ?? 0;
  const active = data?.filter((j) => j.active).length ?? 0;
  const failing = data?.filter((j) => j.last_status && j.last_status !== 'succeeded').length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Autonomy Status
          </CardTitle>
          <CardDescription>
            Background jobs that keep the platform running without human input.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Scheduled" value={total} icon={<Clock className="w-4 h-4" />} />
          <StatTile
            label="Active"
            value={active}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <StatTile
            label="Failing"
            value={failing}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            tone={failing > 0 ? 'warn' : 'ok'}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No autonomy jobs found. Background tasks may not be scheduled.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((job) => (
                <TableRow key={job.jobname}>
                  <TableCell className="font-medium">
                    {FRIENDLY[job.jobname] ?? job.jobname}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {job.schedule}
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.last_run_at
                      ? `${formatDistanceToNow(new Date(job.last_run_at))} ago`
                      : 'Not yet run'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={job.active} status={job.last_status} />
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

function StatTile({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'ok' | 'warn' | 'neutral';
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === 'warn' ? 'border-amber-500/40 bg-amber-500/5' : 'bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ active, status }: { active: boolean; status: string | null }) {
  if (!active) return <Badge variant="secondary">Paused</Badge>;
  if (!status) return <Badge variant="outline">Pending</Badge>;
  if (status === 'succeeded')
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
        Healthy
      </Badge>
    );
  return (
    <Badge variant="destructive" className="capitalize">
      {status}
    </Badge>
  );
}
