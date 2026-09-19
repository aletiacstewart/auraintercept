import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgentTestConsole } from '@/components/ai/agents/AgentTestConsole';

interface AgentTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentType: string;
  agentName: string;
  isEnabled: boolean;
  companyId: string | null;
}

/**
 * Lightweight test window. Replaces the old full-page test console —
 * same engine, opened from the agent hub without leaving the page.
 */
export function AgentTestModal({
  open,
  onOpenChange,
  agentType,
  agentName,
  isEnabled,
  companyId,
}: AgentTestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Test {agentName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <AgentTestConsole
            agentType={agentType}
            agentName={agentName}
            isEnabled={isEnabled}
            companyId={companyId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
