import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentType } from '@/lib/agentTypes';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';

export interface DiscoveryMemberAgent {
  type: string;
  name: string;
  is_enabled: boolean;
  available: boolean;
  lockReason?: string;
}

interface AgentDiscoveryCardProps {
  agent: AgentType;
  members: DiscoveryMemberAgent[];
  canManage: boolean;
  /** Connections this job needs that the company has not set up yet. */
  missingIntegrations?: string[];
  onEnable: () => void;
  onToggleMember: (agentType: string, enabled: boolean) => void;
  onLearnMore: (agentType: string) => void;
  /** Sends the user to the Connections page to set a missing service up. */
  onConnect?: (integration: string) => void;
}

/**
 * One plain-English job (e.g. "Appointment Scheduler") shown as a card.
 * Expanding it reveals the individual operatives that do the work, each with
 * its own switch — the 24-agent model stays fully visible and controllable.
 */
export function AgentDiscoveryCard({
  agent,
  members,
  canManage,
  missingIntegrations = [],
  onEnable,
  onToggleMember,
  onLearnMore,
  onConnect,
}: AgentDiscoveryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const enabledCount = members.filter((m) => m.is_enabled).length;
  const allEnabled = members.length > 0 && enabledCount === members.length;
  const anyAvailable = members.some((m) => m.available);
  const blockedByConnection = missingIntegrations.length > 0;

  return (
    <Card className={cn('flex flex-col', allEnabled && 'border-primary/40')}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span>{agent.name}</span>
          <Badge variant={allEnabled ? 'default' : 'secondary'} className="text-[10px]">
            {enabledCount}/{members.length} on
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>

        <div className="mb-3 space-y-1">
          <p className="text-xs font-semibold">What it handles</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {agent.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {agent.requiredIntegrations.map((i) => {
            const missing = missingIntegrations.includes(i);
            return (
              <Badge
                key={i}
                variant={missing ? 'destructive' : 'outline'}
                className="text-[10px] capitalize"
              >
                {missing ? `Set up ${i}` : `Uses ${i}`}
              </Badge>
            );
          })}
        </div>

        {blockedByConnection && (
          <p className="mb-3 text-xs text-muted-foreground">
            Turn this on after you set up {missingIntegrations.join(' and ')}.{' '}
            {onConnect && (
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => onConnect(missingIntegrations[0])}
              >
                Set it up now
              </button>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline mb-2"
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          {expanded ? 'Hide' : 'Show'} the {members.length} agents inside
        </button>

        {expanded && (
          <div className="mb-3 space-y-1.5 rounded-md border border-border/60 p-2">
            {members.map((m) => (
              <div key={m.type} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {AGENT_REGISTRY[m.type]?.description ?? ''}
                  </p>
                </div>
                {m.available && canManage ? (
                  <Switch
                    checked={m.is_enabled}
                    onCheckedChange={(v) => onToggleMember(m.type, v)}
                    className="scale-75 shrink-0"
                  />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => onLearnMore(members[0]?.type)}>
            Learn More
          </Button>
          <Button
            size="sm"
            disabled={allEnabled || !anyAvailable || !canManage || blockedByConnection}
            title={blockedByConnection ? `Needs ${missingIntegrations.join(' and ')}` : undefined}
            onClick={onEnable}
          >
            {allEnabled ? 'Active' : 'Enable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentDiscoveryCard;
