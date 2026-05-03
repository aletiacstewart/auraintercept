import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { ResolvedWorkspace } from '@/lib/workspace/types';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

export function CustomConsole({ workspace }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Custom Workspace"
        description="Your industry uses a custom workflow. Configure consoles in Settings → Industry Config."
        featureColor="config"
      />
      <Card className="p-6 surface-elevated-dark">
        <p className="text-card-foreground/80">
          Industry: <span className="font-medium">{workspace.industryName}</span>
        </p>
        <p className="mt-2 text-card-foreground/70 text-sm">
          Active consoles: {workspace.activeConsoles.join(', ') || 'none'}
        </p>
      </Card>
    </div>
  );
}