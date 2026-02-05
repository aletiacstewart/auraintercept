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
import { AgentAnalyticsDashboard } from '@/components/ai/agents/AgentAnalyticsDashboard';
import { ConversationHistoryBrowser } from '@/components/ai/agents/ConversationHistoryBrowser';
import { OperativeDependencyGraph } from '@/components/ai/agents/OperativeDependencyGraph';
import { AgentReviewQueue } from '@/components/ai/agents/AgentReviewQueue';
import { AIAgentTestSuite } from '@/components/ai/AIAgentTestSuite';
import { useAgentReviewCount } from '@/hooks/useAgentReviewCount';
import { useAgentLatestEvents } from '@/hooks/useAgentLatestEvents';
import { DecisionModeBadge } from '@/components/ai/agents/DecisionModeBadge';
import { ConfidenceIndicator } from '@/components/ai/agents/ConfidenceIndicator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Users, 
  Truck, 
  Briefcase, 
  Megaphone, 
  Settings,
  Play,
  ChevronRight,
  Zap,
  Activity,
  Rocket,
  BarChart3,
  MessageSquare,
  Lock,
  Sparkles,
  Info,
  Globe,
  Eye,
  Clock,
  FlaskConical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasFullAccess, canManageAIAgents } from '@/lib/accessControl';
import { formatDistanceToNow } from 'date-fns';

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
    label: 'Outreach & Sales Ops', 
    icon: Megaphone, 
    colorClass: 'text-feature-marketing',
    cssVar: '--feature-marketing'
  },
  social_media: { 
    label: 'Social Media Ops',
    icon: Activity, 
    colorClass: 'text-pink-400',
    cssVar: '--feature-marketing'
  },
  creative_web_presence: { 
    label: 'Creative & Web Presence',
    icon: Globe, 
    colorClass: 'text-purple-400',
    cssVar: '--feature-analytics'
  },
  analytics_reports: { 
    label: 'Analytics & Reports', 
    icon: Activity, 
    colorClass: 'text-feature-analytics',
    cssVar: '--feature-analytics'
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
  manager: ['triage', 'followup', 'review', 'booking', 'insights', 'performance', 'revenue', 'forecast'], // Includes analytics
  billing: ['quoting', 'invoice'],
  marketing: ['campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence'],
  analytics: ['insights', 'performance', 'revenue', 'forecast'], // Analytics role
  inventory: ['inventory'],
};

// Agent name mapping for display
// 24 User-Facing Agents - Keep in sync with subscriptionAgentConfig.ts
const AGENT_NAMES: Record<string, string> = {
  // Customer Portal (4)
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  // Field Operations (4)
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  // Business Operations (4)
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  // Marketing & Sales (3)
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  marketing: 'Marketing Agent',
  // Social Media (3)
  social_content: 'Social Media Agent',
  social_scheduler: 'Social Media Scheduler',
  social_analytics: 'Social Media Analytics',
  // Analytics & Reports (4)
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  // Content Engine (1)
  creative: 'Creative Agent',
  // Web Presence (1)
  web_presence: 'Web Presence Agent',
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
  const { count: reviewCount } = useAgentReviewCount();
  
  // Fetch latest events for each agent (for status indicators)
  const agentTypes = useMemo(() => agents.map(a => a.type), [agents]);
  const { data: latestEvents } = useAgentLatestEvents(companyId, agentTypes);
  
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
  const HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN = ['inventory', 'campaign'];
  
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
          title="AI Operatives Hub"
          description={canManageAgents 
            ? '24 specialized AI operatives powering your business automation'
            : `${totalCount} AI operatives available based on your job roles`}
          featureColor="config"
          action={
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{enabledCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Operatives Active</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard/ai-agent')}>
                <Settings className="h-4 w-4 mr-2" />
                Global Settings
              </Button>
            </div>
          }
        />

        {/* Subscription Tier Info Banner - hide for platform_admin who has full access */}
        {canManageAgents && userRole !== 'platform_admin' && (
          <Alert className={subscriptionTier === 'free' ? 'border-amber-500/30 bg-amber-500/10' : 'border-primary/30 bg-primary/5'}>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {inTrial ? (
                  <>You're in trial mode with full access to all agents.</>
                ) : subscriptionTier === 'command' ? (
                  <>Your <strong>Command</strong> plan includes all 24 AI agents.</>
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
          <TabsList>
            <TabsTrigger value="agents" className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              Operatives
            </TabsTrigger>
            {canManageAgents && (
              <TabsTrigger value="activate" className="flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" />
                Quick Start
              </TabsTrigger>
            )}
            <TabsTrigger value="monitor" className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Review
              {reviewCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                  {reviewCount}
                </Badge>
              )}
            </TabsTrigger>
            {canManageAgents && (
              <TabsTrigger value="testing" className="flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                Testing
              </TabsTrigger>
            )}
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          enabled > 0 && "feature-pulse-active"
                        )}
                        style={{ 
                          backgroundColor: `hsl(var(${CATEGORY_INFO[key].cssVar}) / 0.15)` 
                        }}>
                          <Icon className={`h-4 w-4 ${colorClass}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{label}</p>
                          <p className="text-[10px] text-muted-foreground">
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
                <TabsTrigger value="all">All Operatives</TabsTrigger>
                {Object.entries(CATEGORY_INFO).map(([key, { label }]) => {
                  const hasAgentsInCategory = accessibleAgents.some(a => a.category === key);
                  if (!hasAgentsInCategory) return null;
                  return <TabsTrigger key={key} value={key}>{label}</TabsTrigger>;
                })}
              </TabsList>

              <TabsContent value={activeCategory} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                        latestEvent={latestEvents?.[agent.type] || null}
                        onReviewClick={() => setActiveTab('review')}
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
                <h3 className="text-lg font-semibold mb-2">No Operatives Available</h3>
                <p className="text-muted-foreground">
                  {userRole === 'employee' 
                    ? 'No AI operatives are assigned to your job roles. Contact your admin to get access.'
                    : 'Select a different category to view available operatives.'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="activate" className="space-y-6">
            <BatchAgentActivation
              agents={agents}
              onActivatePhase={handleActivatePhase}
              onActivateAll={handleActivateAll}
            />
            <OperativeDependencyGraph agents={agents} />
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {companyId ? (
              <AgentAnalyticsDashboard companyId={companyId} />
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {companyId ? (
              <ConversationHistoryBrowser companyId={companyId} />
            ) : (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              </Card>
            )}
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-4">
            {companyId ? (
              <AgentReviewQueue companyId={companyId} />
            ) : (
              <Card className="p-12 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              </Card>
            )}
          </TabsContent>

          {/* Testing Tab */}
          {canManageAgents && (
            <TabsContent value="testing" className="space-y-4">
              <AIAgentTestSuite />
            </TabsContent>
          )}
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
  latestEvent: {
    id: string;
    decision_mode: 'auto' | 'review' | 'escalate';
    confidence_score: number | null;
    action_description: string | null;
    created_at: string;
    requires_human_review: boolean;
  } | null;
  onReviewClick: () => void;
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
  latestEvent,
  onReviewClick,
}: AgentCardProps) {
  const categoryInfo = CATEGORY_INFO[agent.category];
  const Icon = categoryInfo?.icon || Bot;
  const navigate = useNavigate();
  const { getAgentDependencies } = useSubscription();

  const tierInfo = requiredTier ? getTierInfo(requiredTier) : null;
  
  // Get ALL dependencies for this agent (not just missing ones)
  const allDependencies = getAgentDependencies(agent.type);
  const allDependencyNames = allDependencies.map(dep => AGENT_NAMES[dep] || dep);

  // Format time ago
  const timeAgo = latestEvent?.created_at 
    ? formatDistanceToNow(new Date(latestEvent.created_at), { addSuffix: true })
    : null;

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all relative",
      !isAvailableInTier && "opacity-80 border-dashed border-muted-foreground/30"
    )}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className={cn(
                "p-1.5 rounded-lg shrink-0",
                agent.is_enabled && isAvailableInTier && "feature-pulse-active",
                !isAvailableInTier && "opacity-50"
              )}
              style={{ 
                backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)` 
              }}
            >
              <Icon className={cn(
                `h-4 w-4 ${categoryInfo?.colorClass || 'text-primary'}`,
                !isAvailableInTier && "opacity-50"
              )} />
            </div>
            <div className="min-w-0">
              <CardTitle className={cn(
                "text-sm font-semibold leading-tight truncate",
                !isAvailableInTier && "opacity-70"
              )}>{agent.name}</CardTitle>
              <CardDescription className="text-[10px] text-card-foreground/60">
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
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {/* Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAvailableInTier ? (
              <Badge 
                variant={agent.is_enabled ? 'default' : 'secondary'}
                style={agent.is_enabled ? {
                  backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)`,
                  color: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}))`,
                  borderColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.3)`,
                } : undefined}
                className={cn("text-[10px] px-1.5 py-0", agent.is_enabled && 'border')}
              >
                {agent.is_enabled ? (
                  <>
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Active
                  </>
                ) : (
                  'Off'
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0">
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                {tierInfo?.label}
              </Badge>
            )}
            
            {/* Decision Mode Badge - only show for active agents with events */}
            {agent.is_enabled && latestEvent && (
              <DecisionModeBadge mode={latestEvent.decision_mode} size="sm" />
            )}
          </div>

          {/* Confidence & Last Action - only show for active agents */}
          {agent.is_enabled && latestEvent && (
            <div className="flex items-center gap-2 text-[10px]">
              <ConfidenceIndicator score={latestEvent.confidence_score} size="sm" showLabel />
              {timeAgo && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo}
                </span>
              )}
            </div>
          )}

          {/* Last Action Description */}
          {agent.is_enabled && latestEvent?.action_description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 italic">
              "{latestEvent.action_description}"
            </p>
          )}

          {/* Needs Review Alert */}
          {agent.is_enabled && latestEvent?.requires_human_review && (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Needs Review
              </span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewClick();
                }}
                className="h-5 text-[10px] px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
              >
                View
              </Button>
            </div>
          )}

          <Badge variant="outline" className="text-card-foreground border-border/50 text-[10px] px-1.5 py-0 w-fit">{agent.category.replace('_', ' ')}</Badge>

          {/* Always show dependencies if any exist */}
          {allDependencyNames.length > 0 && (
            <div className={cn(
              "flex items-start gap-1.5 px-2 py-1.5 rounded border text-[10px]",
              isAvailableInTier && missingDependencies.length > 0
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-muted/30 border-border/50"
            )}>
              <Info className={cn(
                "h-3 w-3 flex-shrink-0 mt-0.5",
                isAvailableInTier && missingDependencies.length > 0
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )} />
              <p className="text-card-foreground leading-tight">
                <span className={cn(
                  "font-medium",
                  isAvailableInTier && missingDependencies.length > 0
                    ? "text-amber-400"
                    : "text-primary"
                )}>Requires:</span> {allDependencyNames.join(', ')}
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            {isAvailableInTier ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClick}
                  className={cn("h-7 text-xs px-2", categoryInfo?.colorClass || 'text-primary')}
                >
                  Configure
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
                {agent.is_enabled && (
                  <Button variant="outline" size="sm" onClick={onClick} className="h-7 text-xs px-2">
                    <Play className="h-2.5 w-2.5 mr-1" />
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
                className="w-full h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
