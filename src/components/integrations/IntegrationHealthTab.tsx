import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useIntegrationHealth, type HealthStatus } from '@/hooks/useIntegrationHealth';
import { EmptyStateGuide } from '@/components/shared/EmptyStateGuide';

const NAMES: Record<string, string> = {
  google_calendar: 'Calendar',
  signalwire: 'Calls & Texts',
  resend: 'Email',
  elevenlabs: 'AI Voice',
  stripe: 'Payments',
  a2p_10dlc: 'Text message registration',
};

const STATUS_COPY: Record<HealthStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  connected: { label: 'Working', className: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
  degraded: { label: 'Needs attention', className: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  error: { label: 'Not working', className: 'text-destructive', icon: XCircle },
  not_configured: { label: 'Not connected', className: 'text-muted-foreground', icon: AlertTriangle },
};

function timeAgo(iso: string | null) {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function IntegrationHealthTab() {
  const { data, isLoading, recheck } = useIntegrationHealth();

  const runCheck = () => {
    recheck.mutate(undefined, {
      onSuccess: () => toast.success('Checked every connection'),
      onError: () => toast.error('Could not run the check just now'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          How each connection has been behaving over the last 30 days.
        </p>
        <Button size="sm" variant="outline" onClick={runCheck} disabled={recheck.isPending}>
          {recheck.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Check now
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyStateGuide
          title="Nothing checked yet"
          description="Once you connect a service, Aura tests it every night and records the results here."
          action={{ label: 'Check now', onClick: runCheck, icon: <RefreshCw className="h-5 w-5" /> }}
          tips={[
            'Connect at least one service on the Connections tab',
            'Checks run automatically overnight',
            'You will be alerted if something stops working',
          ]}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((row) => {
            const copy = STATUS_COPY[row.status] ?? STATUS_COPY.not_configured;
            const Icon = copy.icon;
            return (
              <Card key={row.integration_name} className="border-border/60">
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {NAMES[row.integration_name] ?? row.integration_name}
                    </span>
                    <span className={`flex items-center gap-1.5 text-sm ${copy.className}`}>
                      <Icon className="h-4 w-4" />
                      {copy.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[11px]">
                      Last worked {timeAgo(row.last_sync)}
                    </Badge>
                    {row.successRate !== null && (
                      <Badge variant="outline" className="text-[11px]">
                        {row.successRate}% reliable ({row.checks} checks)
                      </Badge>
                    )}
                  </div>
                  {row.error_message && (
                    <p className="text-xs text-destructive">{row.error_message}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default IntegrationHealthTab;
