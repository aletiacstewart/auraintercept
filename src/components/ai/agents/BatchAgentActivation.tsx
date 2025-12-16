import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Users, 
  Truck, 
  Briefcase, 
  Megaphone, 
  BarChart3,
  Rocket,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AgentInfo } from '@/hooks/useAIAgentOrchestrator';

const PHASE_CONFIG = [
  {
    phase: 1,
    name: 'Customer Engagement',
    description: 'Core customer interaction agents',
    icon: Users,
    color: 'text-blue-500',
    agents: ['triage', 'booking', 'followup', 'review'],
  },
  {
    phase: 2,
    name: 'Field Operations',
    description: 'Dispatch and route management',
    icon: Truck,
    color: 'text-green-500',
    agents: ['dispatch', 'route', 'eta', 'checkin'],
  },
  {
    phase: 3,
    name: 'Business Operations',
    description: 'Quotes, invoices, and inventory',
    icon: Briefcase,
    color: 'text-purple-500',
    agents: ['quoting', 'invoice', 'inventory', 'warranty'],
  },
  {
    phase: 4,
    name: 'Marketing & Sales',
    description: 'Promotions and customer retention',
    icon: Megaphone,
    color: 'text-orange-500',
    agents: ['promo', 'referral', 'winback', 'seasonal'],
  },
  {
    phase: 5,
    name: 'Analytics & Insights',
    description: 'Business intelligence and forecasting',
    icon: BarChart3,
    color: 'text-cyan-500',
    agents: ['insights', 'forecast'],
  },
];

interface BatchAgentActivationProps {
  agents: AgentInfo[];
  onActivatePhase: (agentTypes: string[]) => Promise<void>;
  onActivateAll: () => Promise<void>;
}

export function BatchAgentActivation({ agents, onActivatePhase, onActivateAll }: BatchAgentActivationProps) {
  const [selectedPhases, setSelectedPhases] = useState<number[]>([]);
  const [activating, setActivating] = useState(false);
  const [progress, setProgress] = useState(0);

  const agentMap = new Map(agents.map(a => [a.type, a]));

  const togglePhase = (phase: number) => {
    setSelectedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const getPhaseStatus = (phaseAgents: string[]) => {
    const enabled = phaseAgents.filter(type => agentMap.get(type)?.is_enabled).length;
    return { enabled, total: phaseAgents.length };
  };

  const handleActivateSelected = async () => {
    if (selectedPhases.length === 0) {
      toast.error('Please select at least one phase to activate');
      return;
    }

    setActivating(true);
    setProgress(0);

    try {
      const totalPhases = selectedPhases.length;
      for (let i = 0; i < totalPhases; i++) {
        const phase = selectedPhases[i];
        const phaseConfig = PHASE_CONFIG.find(p => p.phase === phase);
        if (phaseConfig) {
          await onActivatePhase(phaseConfig.agents);
          setProgress(((i + 1) / totalPhases) * 100);
        }
      }
      toast.success(`Activated ${selectedPhases.length} phase(s) successfully`);
      setSelectedPhases([]);
    } catch (error) {
      toast.error('Failed to activate some agents');
    } finally {
      setActivating(false);
      setProgress(0);
    }
  };

  const handleActivateAll = async () => {
    setActivating(true);
    setProgress(0);

    try {
      const totalPhases = PHASE_CONFIG.length;
      for (let i = 0; i < totalPhases; i++) {
        const phaseConfig = PHASE_CONFIG[i];
        await onActivatePhase(phaseConfig.agents);
        setProgress(((i + 1) / totalPhases) * 100);
      }
      toast.success('All agents activated successfully!');
    } catch (error) {
      toast.error('Failed to activate all agents');
    } finally {
      setActivating(false);
      setProgress(0);
    }
  };

  const totalEnabled = agents.filter(a => a.is_enabled).length;
  const totalAgents = agents.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Quick Activation
            </CardTitle>
            <CardDescription>Activate agents by phase or all at once</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalEnabled}/{totalAgents}</div>
            <div className="text-sm text-muted-foreground">Agents Active</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {activating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Activating agents... {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Phase Selection */}
        <div className="space-y-3">
          {PHASE_CONFIG.map((phase) => {
            const status = getPhaseStatus(phase.agents);
            const Icon = phase.icon;
            const isSelected = selectedPhases.includes(phase.phase);
            const isFullyActive = status.enabled === status.total;

            return (
              <div
                key={phase.phase}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                } ${isFullyActive ? 'opacity-60' : ''}`}
                onClick={() => !isFullyActive && togglePhase(phase.phase)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={isSelected || isFullyActive}
                    disabled={isFullyActive}
                    onCheckedChange={() => !isFullyActive && togglePhase(phase.phase)}
                  />
                  <Icon className={`h-5 w-5 ${phase.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Phase {phase.phase}: {phase.name}</span>
                      {isFullyActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                  <Badge variant="outline">
                    {status.enabled}/{status.total} active
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 ml-10">
                  {phase.agents.map(agentType => {
                    const agent = agentMap.get(agentType);
                    return (
                      <Badge 
                        key={agentType}
                        variant={agent?.is_enabled ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {agentType}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleActivateSelected}
            disabled={activating || selectedPhases.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Activate Selected ({selectedPhases.length})
          </Button>
          <Button
            className="flex-1"
            onClick={handleActivateAll}
            disabled={activating || totalEnabled === totalAgents}
          >
            <Rocket className="h-4 w-4 mr-2" />
            Activate All Agents
          </Button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-muted-foreground">
            Activating agents will enable AI-powered automation. Make sure to configure each agent's 
            settings after activation for optimal performance.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
