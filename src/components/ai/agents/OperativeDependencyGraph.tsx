import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  GitBranch, 
  ArrowRight,
  Users,
  Truck,
  Briefcase,
  Megaphone,
  BarChart3,
  Share2,
  ChevronDown,
  Globe,
  Palette,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentInfo } from '@/hooks/useAIAgentOrchestrator';

interface OperativeDependencyGraphProps {
  agents: AgentInfo[];
}

interface DependencyNode {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  dependencies: string[];
}

interface FlowConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  agents: string[];
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  customer_engagement: { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  field_operations: { icon: Truck, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  business_operations: { icon: Briefcase, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  marketing_sales: { icon: Megaphone, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  analytics_reports: { icon: BarChart3, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  social_media: { icon: Share2, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling',
  followup: 'Follow-up',
  review: 'Review',
  dispatch: 'Dispatch',
  route: 'Route',
  eta: 'ETA',
  checkin: 'Check-in',
  admin: 'Admin',
  quoting: 'Quoting',
  invoice: 'Invoice',
  inventory: 'Inventory',
  campaign: 'Campaign',
  lead: 'Lead',
  marketing: 'Marketing',
  social_content: 'Content',
  social_scheduler: 'Scheduler',
  social_analytics: 'Analytics',
  creative: 'Creative',
  web_presence: 'Web Presence',
  insights: 'Insights',
  performance: 'Performance',
  revenue: 'Revenue',
  forecast: 'Forecast',
};

// Define the dependency structure - Keep in sync with subscriptionAgentConfig.ts AGENT_DEPENDENCIES
const DEPENDENCY_MAP: Record<string, string[]> = {
  // Customer Portal
  triage: [], // Root - no dependencies
  booking: ['triage'],
  followup: ['triage'],
  review: ['triage'],
  // Field Operations
  dispatch: ['triage', 'booking'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  // Business Operations
  admin: [],
  quoting: ['triage'],
  invoice: ['quoting'],
  inventory: [],
  // Marketing & Sales
  campaign: [],
  lead: [],
  marketing: ['campaign'],
  // Social Media & Web Presence
  social_content: [],
  social_scheduler: ['social_content'],
  social_analytics: ['social_content'],
  creative: [],
  web_presence: ['creative'],
  // Analytics
  insights: [],
  performance: ['insights'],
  revenue: ['insights'],
  forecast: ['insights', 'revenue'],
};

// Flow configurations for dropdown sections
const FLOW_CONFIGS: FlowConfig[] = [
  {
    id: 'customer',
    title: 'Customer Flow',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    agents: ['triage', 'booking', 'followup', 'review'],
  },
  {
    id: 'field_operations',
    title: 'Field Operations Flow',
    icon: Truck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    agents: ['dispatch', 'route', 'eta', 'checkin'],
  },
  {
    id: 'business_operations',
    title: 'Business Operations Flow',
    icon: Briefcase,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    agents: ['admin', 'quoting', 'invoice', 'inventory'],
  },
  {
    id: 'marketing',
    title: 'Marketing Flow',
    icon: Megaphone,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    agents: ['campaign', 'lead', 'marketing'],
  },
  {
    id: 'social_media',
    title: 'Social Media Flow',
    icon: Share2,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    agents: ['social_content', 'social_scheduler', 'social_analytics'],
  },
  {
    id: 'analytics',
    title: 'Analytics Flow',
    icon: BarChart3,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    agents: ['insights', 'performance', 'revenue', 'forecast'],
  },
  {
    id: 'content_engine',
    title: 'Content Engine',
    icon: Palette,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    agents: ['creative'],
  },
  {
    id: 'web_presence',
    title: 'Web Presence',
    icon: Globe,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    agents: ['creative', 'web_presence'],
  },
];

export function OperativeDependencyGraph({ agents }: OperativeDependencyGraphProps) {
  const [openFlows, setOpenFlows] = useState<string[]>(['customer']);
  const agentMap = useMemo(() => new Map(agents.map(a => [a.type, a])), [agents]);

  // Group agents by category
  const groupedAgents = useMemo(() => {
    const groups: Record<string, DependencyNode[]> = {};
    
    agents.forEach(agent => {
      if (!groups[agent.category]) {
        groups[agent.category] = [];
      }
      groups[agent.category].push({
        id: agent.type,
        name: AGENT_DISPLAY_NAMES[agent.type] || agent.type,
        category: agent.category,
        enabled: agent.is_enabled || false,
        dependencies: DEPENDENCY_MAP[agent.type] || [],
      });
    });

    return groups;
  }, [agents]);

  // Calculate which dependencies are missing for each agent
  const getMissingDeps = (agentType: string): string[] => {
    const deps = DEPENDENCY_MAP[agentType] || [];
    return deps.filter(dep => !agentMap.get(dep)?.is_enabled);
  };

  const renderDependencyArrows = (agentType: string) => {
    const deps = DEPENDENCY_MAP[agentType] || [];
    if (deps.length === 0) return null;

    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
        <span>←</span>
        {deps.map((dep, i) => {
          const depEnabled = agentMap.get(dep)?.is_enabled;
          return (
            <span key={dep} className={cn(
              "px-1 rounded",
              depEnabled ? "text-emerald-500" : "text-amber-500"
            )}>
              {AGENT_DISPLAY_NAMES[dep]}
              {i < deps.length - 1 && ', '}
            </span>
          );
        })}
      </div>
    );
  };

  const toggleFlow = (flowId: string) => {
    setOpenFlows(prev => 
      prev.includes(flowId) 
        ? prev.filter(id => id !== flowId)
        : [...prev, flowId]
    );
  };

  const renderFlowBadges = (flowAgents: string[]) => {
    return (
      <div className="flex items-center gap-2 flex-wrap py-2">
        {flowAgents.map((type, i, arr) => {
          const agent = agentMap.get(type);
          const isEnabled = agent?.is_enabled;

          return (
            <div key={type} className="flex items-center gap-2">
              <Badge 
                variant={isEnabled ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  isEnabled && "bg-primary/20 text-primary border border-primary/30"
                )}
              >
                {AGENT_DISPLAY_NAMES[type]}
              </Badge>
              {i < arr.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getFlowActiveCount = (flowAgents: string[]) => {
    const activeCount = flowAgents.filter(type => agentMap.get(type)?.is_enabled).length;
    return { active: activeCount, total: flowAgents.length };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-5 w-5 text-primary" />
          Operative Dependencies
        </CardTitle>
        <CardDescription>
          Visual overview of how operatives depend on each other
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted-foreground/30" />
              <span className="text-muted-foreground">Inactive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-amber-500 border-dashed" />
              <span className="text-muted-foreground">Missing Dependencies</span>
            </div>
          </div>

          {/* Category Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedAgents).map(([category, nodes]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.customer_engagement;
              const Icon = config.icon;

              return (
                <div key={category} className={cn("rounded-lg border p-4", config.bgColor)}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className="text-sm font-semibold capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {nodes.filter(n => n.enabled).length}/{nodes.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {nodes.map((node) => {
                      const missingDeps = getMissingDeps(node.id);
                      const hasMissingDeps = missingDeps.length > 0 && node.enabled;

                      return (
                        <div
                          key={node.id}
                          className={cn(
                            "p-2 rounded-md text-sm transition-colors",
                            node.enabled 
                              ? "bg-background border" 
                              : "bg-muted/50 opacity-60",
                            hasMissingDeps && "border-amber-500 border-dashed"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{node.name}</span>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              node.enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                            )} />
                          </div>
                          {renderDependencyArrows(node.id)}
                          {hasMissingDeps && (
                            <div className="text-[10px] text-amber-500 mt-1">
                              ⚠ Enable: {missingDeps.map(d => AGENT_DISPLAY_NAMES[d]).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow Dropdowns */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Operational Flows
            </h4>
            
            {FLOW_CONFIGS.map((flow) => {
              const Icon = flow.icon;
              const isOpen = openFlows.includes(flow.id);
              const { active, total } = getFlowActiveCount(flow.agents);

              return (
                <Collapsible 
                  key={flow.id} 
                  open={isOpen} 
                  onOpenChange={() => toggleFlow(flow.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between w-full px-4 py-2.5 rounded-lg border transition-colors",
                      "hover:bg-muted/50",
                      isOpen ? flow.bgColor : "bg-background"
                    )}>
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-4 w-4", flow.color)} />
                        <span className="text-sm font-medium">{flow.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {active}/{total}
                        </Badge>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className={cn(
                      "px-4 py-3 mt-1 rounded-lg border-l-2",
                      flow.bgColor
                    )} style={{ borderLeftColor: `hsl(var(--${flow.color.replace('text-', '').replace('-500', '')}))` }}>
                      {renderFlowBadges(flow.agents)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}