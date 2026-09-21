import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Loader2,
  RotateCcw,
  SkipForward,
  Workflow,
  X,
} from 'lucide-react';

/** One step inside a multi-step job. */
interface WorkflowStepState {
  key: string;
  label: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  attempts?: number;
  error?: string | null;
  result?: string | null;
}

interface WorkflowRunRow {
  id: string;
  workflow_key: string;
  title: string | null;
  status: 'running' | 'waiting' | 'escalated' | 'completed' | 'cancelled';
  current_step: number;
  steps: WorkflowStepState[];
  context: Record<string, any>;
  error_message: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<WorkflowRunRow['status'], string> = {
  running: 'In progress',
  waiting: 'Retrying',
  escalated: 'Needs attention',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

const STATUS_VARIANT: Record<WorkflowRunRow['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  waiting: 'secondary',
  escalated: 'destructive',
  completed: 'outline',
  cancelled: 'outline',
};

function StepIcon({ status }: { status: WorkflowStepState['status'] }) {
  if (status === 'completed') return <Check className="h-4 w-4 text-primary" aria-hidden />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />;
  if (status === 'skipped') return <SkipForward className="h-4 w-4 text-muted-foreground" aria-hidden />;
  if (status === 'failed') return <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

/**
 * Shows the multi-step jobs Aura is running for this company, step by step,
 * with retry / cancel controls when a job stops and needs a person.
 */
export function WorkflowRunsPanel({ companyId }: { companyId: string }) {
  const [runs, setRuns] = useState<WorkflowRunRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      setRuns([]);
      return;
    }
    setRuns((data as unknown as WorkflowRunRow[]) || []);
  }, [companyId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (runId: string, action: 'retry_step' | 'cancel_workflow') => {
    setBusyId(runId);
    try {
      const { error } = await supabase.functions.invoke('ai-orchestrator', {
        body: { action, companyId, payload: { run_id: runId } },
      });
      if (error) throw error;
      toast.success(action === 'retry_step' ? 'Trying that step again.' : 'Job cancelled.');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'That did not work. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (runs === null) {
    return (
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Workflow className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden />
          <div>
            <h3 className="font-semibold">Multi-step jobs</h3>
            <p className="text-sm text-muted-foreground">
              When Aura runs a whole job end to end — take the request, book it, assign someone,
              plan the route, tell the customer — you will see each step here as it happens.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="font-semibold">Multi-step jobs</h3>
      </div>

      {runs.map((run) => (
        <div key={run.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{run.title || run.workflow_key}</p>
              <p className="text-xs text-muted-foreground">
                {run.context?.customer?.name ? `For ${run.context.customer.name} · ` : ''}
                {new Date(run.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[run.status]}>{STATUS_LABEL[run.status]}</Badge>
          </div>

          <ol className="space-y-1.5">
            {(run.steps || []).map((step) => (
              <li key={step.key} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5"><StepIcon status={step.status} /></span>
                <span className={step.status === 'failed' ? 'text-destructive' : ''}>
                  {step.label}
                  {step.status === 'skipped' && (
                    <span className="text-muted-foreground"> — skipped</span>
                  )}
                  {step.error && step.status !== 'completed' && (
                    <span className="block text-xs text-muted-foreground">{step.error}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>

          {run.status === 'escalated' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <p className="text-sm text-destructive flex-1 min-w-[12rem]">
                {run.error_message || 'Aura could not finish this job.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === run.id}
                onClick={() => act(run.id, 'retry_step')}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden /> Try again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === run.id}
                onClick={() => act(run.id, 'cancel_workflow')}
              >
                <X className="h-4 w-4 mr-1.5" aria-hidden /> Cancel
              </Button>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

export default WorkflowRunsPanel;
