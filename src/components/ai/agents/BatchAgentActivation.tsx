import { useState, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

const PHASE_CONFIG = [
  {
    phase: 1,
    name: 'Customer Portal',
    description: 'AI Receptionist + Customer Journey Agent (Scheduling, Follow-up, Review)',
    icon: Users,
    color: 'text-blue-500',
    agents: ['triage', 'customer_journey'],
  },
  {
    phase: 2,
    name: 'Field Operations',
    description: 'Dispatch + Field Navigation Agent (Route, ETA, Check-in)',
    icon: Truck,
    color: 'text-green-500',
    agents: ['dispatch', 'field_navigation'],
  },
  {
    phase: 3,
    name: 'Business Operations',
    description: 'Admin + Business Finance Agent (Quoting, Invoice, Inventory)',
    icon: Briefcase,
    color: 'text-purple-500',
    agents: ['admin', 'business_finance'],
  },
  {
    phase: 4,
    name: 'Outreach & Sales Ops',
    description: 'Outreach Agent (Campaigns, Leads, Marketing)',
    icon: Megaphone,
    color: 'text-orange-500',
    agents: ['outreach'],
  },
  {
    phase: 5,
    name: 'Social Media & Web Presence',
    description: 'Creative Content Agent + Web Presence Agent',
    icon: BarChart3,
    color: 'text-pink-500',
    agents: ['creative_content', 'web_presence'],
  },
  {
    phase: 6,
    name: 'Analytics & Intelligence',
    description: 'Analytics Intelligence Agent (Insights, Performance, Revenue, Forecast)',
    icon: BarChart3,
    color: 'text-cyan-500',
    agents: ['analytics_intelligence'],
  },
];

// Agents hidden from non-platform-admin roles
const HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN = ['business_finance', 'outreach'];

// Phases hidden entirely from non-platform-admin roles
const HIDDEN_PHASES_FOR_NON_PLATFORM_ADMIN = [4, 6]; // Outreach & Sales, Analytics & Intelligence

interface BatchAgentActivationProps {
  agents: AgentInfo[];
  onActivatePhase: (agentTypes: string[]) => Promise<void>;
  onActivateAll: () => Promise<void>;
}

export function BatchAgentActivation({ agents, onActivatePhase, onActivateAll }: BatchAgentActivationProps) {
  const { userRole } = useAuth();
  const [selectedPhases, setSelectedPhases] = useState<number[]>([]);
  const [activating, setActivating] = useState(false);
  const [progress, setProgress] = useState(0);

  const agentMap = new Map(agents.map(a => [a.type, a]));

  // Filter phases and agents based on user role
  const filteredPhaseConfig = useMemo(() => {
    if (userRole === 'platform_admin') {
      return PHASE_CONFIG;
    }

    // Filter out hidden phases for company_admin and employee
    return PHASE_CONFIG
      .filter(phase => !HIDDEN_PHASES_FOR_NON_PLATFORM_ADMIN.includes(phase.phase))
      .map(phase => ({
        ...phase,
        agents: phase.agents.filter(agent => !HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN.includes(agent))
      }))
      .filter(phase => phase.agents.length > 0); // Remove phases with no visible agents
  }, [userRole]);

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
        const phaseConfig = filteredPhaseConfig.find(p => p.phase === phase);
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
      const totalPhases = filteredPhaseConfig.length;
      for (let i = 0; i < totalPhases; i++) {
        const phaseConfig = filteredPhaseConfig[i];
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

  // Calculate totals based on filtered agents for non-platform-admin
  const visibleAgentTypes = new Set(filteredPhaseConfig.flatMap(p => p.agents));
  const visibleAgents = agents.filter(a => visibleAgentTypes.has(a.type));
  const totalEnabled = visibleAgents.filter(a => a.is_enabled).length;
  const totalAgents = visibleAgents.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Quick Activation
            </CardTitle>
            <CardDescription>Activate operatives by phase or all at once</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalEnabled}/{totalAgents}</div>
            <div className="text-sm text-muted-foreground">Operatives Active</div>
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
          {filteredPhaseConfig.map((phase) => {
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
                    <p className="text-sm text-white/70">{phase.description}</p>
                  </div>
                  <Badge variant="outline" className="text-white border-white/30">
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
            Activate All Operatives
          </Button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-muted-foreground">
            Activating operatives will enable AI-powered automation. Make sure to configure each operative's
            settings after activation for optimal performance.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
