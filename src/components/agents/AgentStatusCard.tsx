import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';
import { formatDuration, formatNumber, type AgentMetrics } from '@/hooks/useAgentPerformanceMetrics';

export interface EnabledAgentRow {
  type: string;
  name: string;
  is_enabled: boolean;
  needsSetup?: boolean;
  metrics: AgentMetrics;
}

interface AgentStatusCardProps {
  agent: EnabledAgentRow;
  canManage: boolean;
  onEdit: () => void;
  onViewPerformance: () => void;
  onTogglePause: () => void;
  onTest: () => void;
}

export function AgentStatusCard({
  agent,
  canManage,
  onEdit,
  onViewPerformance,
  onTogglePause,
  onTest,
}: AgentStatusCardProps) {
  const def = AGENT_REGISTRY[agent.type];
  const Icon = def?.icon;
  const statusText = !agent.is_enabled
    ? 'Paused'
    : agent.needsSetup
      ? 'Needs setup'
      : agent.metrics.totalInteractions > 0
        ? 'Active'
        : 'Active — no activity yet';

  return (
    <div className="border rounded-lg p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-muted', agent.is_enabled && 'feature-pulse-active')}>
              <Icon className={cn('h-4 w-4', def.color)} />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  !agent.is_enabled ? 'bg-muted-foreground' : agent.needsSetup ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
              <span className="text-xs text-muted-foreground">{statusText}</span>
              {def && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  {def.category.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Interactions</div>
            <div className="font-semibold">{formatNumber(agent.metrics.totalInteractions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Success rate</div>
            <div className="font-semibold text-emerald-500">
              {agent.metrics.totalInteractions > 0 ? `${agent.metrics.successRate}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg time</div>
            <div className="font-semibold">{formatDuration(agent.metrics.avgSeconds)}</div>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={onViewPerformance}>View Performance</DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem onClick={onTogglePause}>
              {agent.is_enabled ? 'Pause' : 'Resume'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onTest}>Test Agent</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default AgentStatusCard;
