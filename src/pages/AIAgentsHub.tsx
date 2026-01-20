import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentWorkflowMonitor } from '@/components/ai/agents/AgentWorkflowMonitor';
import { BatchAgentActivation } from '@/components/ai/agents/BatchAgentActivation';
import { JobStatusMonitor } from '@/components/ai/agents/JobStatusMonitor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Users, 
  Truck, 
  Briefcase, 
  Megaphone, 
  BarChart3,
  Settings,
  Play,
  ChevronRight,
  Zap,
  Activity,
  Rocket,
  ClipboardList,
  Lock,
  Sparkles,
  AlertCircle,
  Info,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasFullAccess, canManageAIAgents } from '@/lib/accessControl';

const CATEGORY_INFO: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  colorClass: string;
  cssVar: string;
}> = {
  customer_engagement: { 
    label: 'Customer Portal', 
    icon: Users, 
    colorClass: 'text-feature-customers',
    cssVar: '--feature-customers'
  },
  field_operations: { 
    label: 'Field Operations', 
    icon: Truck, 
    colorClass: 'text-feature-fieldops',
    cssVar: '--feature-fieldops'
  },
  business_operations: { 
    label: 'Business Operations', 
    icon: Briefcase, 
    colorClass: 'text-feature-analytics',
    cssVar: '--feature-analytics'
  },
  marketing_sales: { 
    label: 'Marketing & Sales', 
    icon: Megaphone, 
    colorClass: 'text-feature-marketing',
    cssVar: '--feature-marketing'
  },
  analytics_reports: { 
    label: 'Analytics & Reports', 
    icon: BarChart3, 
    colorClass: 'text-feature-overview',
    cssVar: '--feature-overview'
  },
};


const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1',
  2: 'Phase 2',
  3: 'Phase 3',
  4: 'Phase 4',
  5: 'Phase 5',
};

// Map job types to agent types they can access
const JOB_TYPE_TO_AGENTS: Record<string, string[]> = {
  technician: ['dispatch', 'route', 'eta', 'checkin', 'inventory'],
  booking_agent: ['triage', 'booking', 'followup', 'review'],
  dispatch: ['dispatch', 'route', 'eta', 'triage'],
  customer_service: ['triage', 'followup', 'review', 'booking'],
  manager: ['triage', 'followup', 'review', 'booking'], // Same as customer_service
  billing: ['quoting', 'invoice', 'warranty'],
  marketing: ['campaign'],
  inventory: ['inventory', 'warranty'],
  analytics: ['insights', 'forecast'],
};

// Agent name mapping for display
const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  warranty: 'Warranty Agent',
  campaign: 'Campaign Agent',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
};

export default function AIAgentsHub() {
  const { agents, groupedAgents, loading, toggleAgent, companyId, refetch } = useAIAgentOrchestrator();
  const { userRole, user } = useAuth();
  const { 
    subscriptionTier, 
    canAccessAgent, 
    getAgentRequiredTier, 
    getAgentDependencies, 
    getTierInfo,
    inTrial,
    getAvailableAgents 
  } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('agents');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [autoActivationDone, setAutoActivationDone] = useState(false);

  // Fetch employee's job assignments
  const { data: userJobAssignments } = useQuery({
    queryKey: ['user-job-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_job_assignments')
        .select('job_type')
        .eq('employee_id', user.id);
      
      if (error) throw error;
      return data?.map(d => d.job_type) || [];
    },
    enabled: !!user?.id && userRole === 'employee',
  });

  // Employees with full access can view AI Agents Hub
  const hasHubAccess = hasFullAccess(userRole, userJobAssignments || []);
  
  // Only platform_admin and company_admin can manage agents
  const canManageAgents = canManageAIAgents(userRole);

  // Auto-activate agents based on subscription tier
  useEffect(() => {
    if (!companyId || !canManageAgents || autoActivationDone || loading) return;
    
    const autoActivateAgents = async () => {
      const availableAgents = getAvailableAgents();
      const agentsToActivate = agents.filter(
        agent => availableAgents.includes(agent.type) && !agent.is_enabled
      );
      
      if (agentsToActivate.length > 0) {
        for (const agent of agentsToActivate) {
          await toggleAgent(agent.type, true);
        }
        toast.success(`${agentsToActivate.length} agents auto-activated for your ${getTierInfo(subscriptionTier).label} plan!`);
        await refetch();
      }
      
      setAutoActivationDone(true);
    };
    
    // Only auto-activate on first load if subscription is active
    if (subscriptionTier !== 'free' || inTrial) {
      autoActivateAgents();
    } else {
      setAutoActivationDone(true);
    }
  }, [companyId, canManageAgents, loading, subscriptionTier, inTrial]);

  // Agents hidden from non-platform-admin roles
  const HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN = ['inventory', 'warranty', 'campaign'];
  
  // Categories hidden from non-platform-admin roles
  const HIDDEN_CATEGORIES_FOR_NON_PLATFORM_ADMIN = ['marketing_sales'];

  // Filter agents based on job roles for employees
  // For company_admin, show ALL agents (tier locking handled in UI)
  // Only filter for employees based on job roles
  const accessibleAgents = useMemo(() => {
    // Platform admins see all agents
    if (userRole === 'platform_admin') {
      return agents;
    }
    
    // Company admins see ALL agents (including locked ones for visibility)
    // Only hide marketing_sales category which is platform-only
    if (userRole === 'company_admin') {
      return agents.filter(a => 
        !HIDDEN_CATEGORIES_FOR_NON_PLATFORM_ADMIN.includes(a.category)
      );
    }
    
    // Employees see only agents matching their job roles, excluding hidden agents and categories
    if (userJobAssignments && userJobAssignments.length > 0) {
      const allowedAgentTypes = new Set<string>();
      userJobAssignments.forEach(jobType => {
        const agentTypes = JOB_TYPE_TO_AGENTS[jobType] || [];
        agentTypes.forEach(at => allowedAgentTypes.add(at));
      });
      return agents.filter(a => 
        allowedAgentTypes.has(a.type) && 
        !HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN.includes(a.type) &&
        !HIDDEN_CATEGORIES_FOR_NON_PLATFORM_ADMIN.includes(a.category)
      );
    }
    
    // No job roles assigned - show nothing
    return [];
  }, [agents, userRole, userJobAssignments]);

  const enabledCount = accessibleAgents.filter(a => a.is_enabled).length;
  const totalCount = accessibleAgents.length;

  const filteredAgents = activeCategory === 'all' 
    ? accessibleAgents 
    : accessibleAgents.filter(a => a.category === activeCategory);

  const handleAgentClick = (agentType: string) => {
    navigate(`/dashboard/ai-agents/${agentType}`);
  };

  const handleActivatePhase = async (agentTypes: string[]) => {
    if (!companyId) return;
    
    for (const agentType of agentTypes) {
      const existingAgent = agents.find(a => a.type === agentType);
      if (!existingAgent?.is_enabled) {
        await toggleAgent(agentType, true);
      }
    }
    await refetch();
  };

  const handleActivateAll = async () => {
    if (!companyId) return;
    
    // Only activate agents available in the subscription
    const availableAgents = getAvailableAgents();
    
    for (const agent of agents) {
      if (!agent.is_enabled && availableAgents.includes(agent.type)) {
        await toggleAgent(agent.type, true);
      }
    }
    await refetch();
    toast.success('All available agents activated successfully!');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Count available agents in subscription
  const availableAgentTypes = getAvailableAgents();
  const lockedAgentCount = accessibleAgents.filter(a => !availableAgentTypes.includes(a.type)).length;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={Bot}
          title="AI Agents Hub"
          description={canManageAgents 
            ? '18 specialized AI agents powering your business automation'
            : `${totalCount} AI agents available based on your job roles`}
          featureColor="config"
          action={
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{enabledCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Agents Active</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard/ai-agent')}>
                <Settings className="h-4 w-4 mr-2" />
                Global Settings
              </Button>
            </div>
          }
        />

        {/* Subscription Tier Info Banner */}
        {canManageAgents && (
          <Alert className={subscriptionTier === 'free' ? 'border-amber-500/30 bg-amber-500/10' : 'border-primary/30 bg-primary/5'}>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {inTrial ? (
                  <>You're in trial mode with full access to all agents.</>
                ) : (
                  <>
                    Your <strong>{getTierInfo(subscriptionTier).label}</strong> plan includes {availableAgentTypes.length} AI agents.
                    {lockedAgentCount > 0 && ` ${lockedAgentCount} agents require an upgrade.`}
                  </>
                )}
              </span>
              {subscriptionTier !== 'command' && !inTrial && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/subscription')}
                  className="ml-4"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Upgrade Plan
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}


        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-auto p-2 bg-muted/30 rounded-2xl border border-border gap-1 flex-wrap">
            <TabsTrigger value="agents" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Bot className="h-3.5 w-3.5" />
              Agents
            </TabsTrigger>
            {canManageAgents && (
              <TabsTrigger value="activate" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Rocket className="h-3.5 w-3.5" />
                Quick Start
              </TabsTrigger>
            )}
            <TabsTrigger value="monitor" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Activity className="h-3.5 w-3.5" />
              Monitor
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(CATEGORY_INFO).map(([key, { label, icon: Icon, colorClass }]) => {
                const categoryAgents = accessibleAgents.filter(a => a.category === key);
                if (categoryAgents.length === 0) return null;
                const enabled = categoryAgents.filter(a => a.is_enabled).length;
                return (
                  <Card 
                    key={key} 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeCategory === key ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          enabled > 0 && "feature-pulse-active"
                        )}
                        style={{ 
                          backgroundColor: `hsl(var(${CATEGORY_INFO[key].cssVar}) / 0.15)` 
                        }}>
                          <Icon className={`h-5 w-5 ${colorClass}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {enabled}/{categoryAgents.length} active
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Category Filter Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList>
                <TabsTrigger value="all">All Agents</TabsTrigger>
                {Object.entries(CATEGORY_INFO).map(([key, { label }]) => {
                  const hasAgentsInCategory = accessibleAgents.some(a => a.category === key);
                  if (!hasAgentsInCategory) return null;
                  return <TabsTrigger key={key} value={key}>{label}</TabsTrigger>;
                })}
              </TabsList>

              <TabsContent value={activeCategory} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAgents.map((agent) => {
                    const isAvailableInTier = canAccessAgent(agent.type);
                    const requiredTier = getAgentRequiredTier(agent.type);
                    const dependencies = getAgentDependencies(agent.type);
                    const missingDependencies = dependencies.filter(
                      dep => !agents.find(a => a.type === dep)?.is_enabled
                    );
                    
                    return (
                      <AgentCard
                        key={agent.type}
                        agent={agent}
                        onToggle={(enabled) => toggleAgent(agent.type, enabled)}
                        onClick={() => handleAgentClick(agent.type)}
                        canManage={canManageAgents}
                        isAvailableInTier={isAvailableInTier}
                        requiredTier={requiredTier}
                        missingDependencies={missingDependencies}
                        getTierInfo={getTierInfo}
                      />
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>

            {/* Empty State */}
            {filteredAgents.length === 0 && (
              <Card className="p-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Agents Available</h3>
                <p className="text-muted-foreground">
                  {userRole === 'employee' 
                    ? 'No AI agents are assigned to your job roles. Contact your admin to get access.'
                    : 'Select a different category to view available agents.'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="activate">
            <BatchAgentActivation
              agents={agents}
              onActivatePhase={handleActivatePhase}
              onActivateAll={handleActivateAll}
            />
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-4">
            {companyId ? (
              <AgentWorkflowMonitor companyId={companyId} />
            ) : (
              <Card className="p-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

interface AgentCardProps {
  agent: AgentInfo;
  onToggle: (enabled: boolean) => void;
  onClick: () => void;
  canManage: boolean;
  isAvailableInTier: boolean;
  requiredTier: string | null;
  missingDependencies: string[];
  getTierInfo: (tier: string) => { label: string; price: string; description: string };
}

function AgentCard({ 
  agent, 
  onToggle, 
  onClick,
  canManage,
  isAvailableInTier,
  requiredTier,
  missingDependencies,
  getTierInfo,
}: AgentCardProps) {
  const categoryInfo = CATEGORY_INFO[agent.category];
  const Icon = categoryInfo?.icon || Bot;
  const navigate = useNavigate();
  const { getAgentDependencies } = useSubscription();

  const tierInfo = requiredTier ? getTierInfo(requiredTier) : null;
  
  // Get ALL dependencies for this agent (not just missing ones)
  const allDependencies = getAgentDependencies(agent.type);
  const allDependencyNames = allDependencies.map(dep => AGENT_NAMES[dep] || dep);

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all relative",
      !isAvailableInTier && "opacity-80 border-dashed border-muted-foreground/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "p-2 rounded-lg",
                agent.is_enabled && isAvailableInTier && "feature-pulse-active",
                !isAvailableInTier && "opacity-50"
              )}
              style={{ 
                backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)` 
              }}
            >
              <Icon className={cn(
                `h-5 w-5 ${categoryInfo?.colorClass || 'text-primary'}`,
                !isAvailableInTier && "opacity-50"
              )} />
            </div>
            <div>
              <CardTitle className={cn(
                "text-lg tracking-wide",
                !isAvailableInTier && "opacity-70"
              )}>{agent.name}</CardTitle>
              <CardDescription className="text-xs text-white/70">
                {PHASE_LABELS[agent.phase]}
              </CardDescription>
            </div>
          </div>
          
          {/* Toggle or Lock */}
          {isAvailableInTier && canManage ? (
            <Switch 
              checked={agent.is_enabled} 
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded",
                  !isAvailableInTier 
                    ? "bg-amber-500/10 border border-amber-500/30" 
                    : "text-muted-foreground"
                )}>
                  <Lock className={cn(
                    "h-4 w-4",
                    !isAvailableInTier ? "text-amber-500" : "text-muted-foreground"
                  )} />
                  {!isAvailableInTier && (
                    <span className="text-xs font-medium text-amber-500">Locked</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {!isAvailableInTier 
                    ? `Upgrade to ${tierInfo?.label || 'a higher plan'} to access this agent`
                    : 'Only admins can toggle agents'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAvailableInTier ? (
              <Badge 
                variant={agent.is_enabled ? 'default' : 'secondary'}
                style={agent.is_enabled ? {
                  backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)`,
                  color: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}))`,
                  borderColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.3)`,
                } : undefined}
                className={agent.is_enabled ? 'border' : ''}
              >
                {agent.is_enabled ? (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  'Disabled'
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                <Lock className="h-3 w-3 mr-1" />
                Upgrade to {tierInfo?.label}
              </Badge>
            )}
            <Badge variant="outline" className="text-white/70 border-white/30">{agent.category.replace('_', ' ')}</Badge>
          </div>

          {/* Always show dependencies if any exist */}
          {allDependencyNames.length > 0 && (
            <div className={cn(
              "flex items-start gap-2 p-2 rounded border",
              isAvailableInTier && missingDependencies.length > 0
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-muted/30 border-border/50"
            )}>
              <Info className={cn(
                "h-4 w-4 flex-shrink-0 mt-0.5",
                isAvailableInTier && missingDependencies.length > 0
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )} />
              <p className={cn(
                "text-xs",
                isAvailableInTier && missingDependencies.length > 0
                  ? "text-amber-200"
                  : "text-muted-foreground"
              )}>
                <span className="font-medium">Requires:</span> {allDependencyNames.join(', ')}
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {isAvailableInTier ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClick}
                  className={categoryInfo?.colorClass || 'text-primary'}
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
              </>
            ) : (
              <Button 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard/subscription');
                }}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Access
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
