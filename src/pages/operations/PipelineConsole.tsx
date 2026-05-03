import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { TrendingUp, Target, DollarSign, AlertTriangle } from 'lucide-react';
import type { ResolvedWorkspace } from '@/lib/workspace/types';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

const STAGES = ['New Lead', 'Qualified', 'Demo / Showing', 'Proposal', 'Won'];

export function PipelineConsole({ workspace }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title={`${workspace.industryName} — Sales Pipeline`}
        description="Deal-stage console — no dispatch board, no truck map"
        featureColor="leads"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" /> New leads (week)
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Conversion rate
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Pipeline value
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" /> At-risk deals
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
      </div>
      <Card className="p-6 surface-elevated-dark">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {STAGES.map((s) => (
            <div
              key={s}
              className="rounded-md border border-border/50 bg-card/50 p-3 text-sm"
            >
              <div className="font-medium">{s}</div>
              <div className="mt-2 text-xs text-muted-foreground">No deals yet</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}