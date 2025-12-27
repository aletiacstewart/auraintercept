import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, 
  Truck, 
  Navigation, 
  Clock, 
  CheckSquare,
  ChevronRight,
  Zap,
  Play,
  Lock
} from 'lucide-react';

const FIELD_OPS_AGENT_ICONS: Record<string, React.ElementType> = {
  dispatch: Truck,
  route: Navigation,
  eta: Clock,
  checkin: CheckSquare,
};

const FIELD_OPS_AGENT_DESCRIPTIONS: Record<string, string> = {
  dispatch: 'Assigns technicians to jobs and manages dispatching workflow',
  route: 'Optimizes routes and provides navigation for field technicians',
  eta: 'Calculates and communicates estimated arrival times to customers',
  checkin: 'Manages arrival confirmations and job check-in processes',
};

interface FieldOpsAgentGridProps {
  className?: string;
}

export function FieldOpsAgentGrid({ className }: FieldOpsAgentGridProps) {
  const { agents, loading, toggleAgent, companyId } = useAIAgentOrchestrator();
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const canManageAgents = userRole === 'platform_admin' || userRole === 'company_admin';

  // Filter only field operations agents
  const fieldOpsAgents = useMemo(() => {
    return agents.filter(agent => agent.category === 'field_operations');
  }, [agents]);

  const enabledCount = fieldOpsAgents.filter(a => a.is_enabled).length;
  const totalCount = fieldOpsAgents.length;

  const handleAgentClick = (agentType: string) => {
    navigate(`/dashboard/ai-agents/${agentType}`);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Truck className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">Field Operations Agents</h3>
            <p className="text-sm text-muted-foreground">
              AI agents for dispatching, routing, and field service management
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {enabledCount}/{totalCount} Active
        </Badge>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldOpsAgents.map((agent) => (
          <AgentCard
            key={agent.type}
            agent={agent}
            onToggle={(enabled) => toggleAgent(agent.type, enabled)}
            onClick={() => handleAgentClick(agent.type)}
            canManage={canManageAgents}
          />
        ))}
      </div>

      {/* Empty State */}
      {fieldOpsAgents.length === 0 && (
        <Card className="p-12 text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Field Operations Agents</h3>
          <p className="text-muted-foreground">
            Field operations agents are not yet configured for this company.
          </p>
        </Card>
      )}
    </div>
  );
}

function AgentCard({ 
  agent, 
  onToggle, 
  onClick,
  canManage = true
}: { 
  agent: AgentInfo; 
  onToggle: (enabled: boolean) => void;
  onClick: () => void;
  canManage?: boolean;
}) {
  const Icon = FIELD_OPS_AGENT_ICONS[agent.type] || Bot;
  const description = FIELD_OPS_AGENT_DESCRIPTIONS[agent.type] || '';

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Icon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-xs">
                Phase {agent.phase}
              </CardDescription>
            </div>
          </div>
          {canManage ? (
            <Switch 
              checked={agent.is_enabled} 
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Only admins can toggle agents</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="flex items-center gap-2">
            <Badge variant={agent.is_enabled ? 'default' : 'secondary'}>
              {agent.is_enabled ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                'Disabled'
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClick}
              className="text-primary"
            >
              Configure
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {agent.is_enabled && (
              <Button variant="outline" size="sm" onClick={onClick}>
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
