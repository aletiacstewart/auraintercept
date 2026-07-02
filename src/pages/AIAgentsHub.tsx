import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasFullAccess, canManageAIAgents } from '@/lib/accessControl';
import { formatDistanceToNow } from 'date-fns';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { SPECIALIST_DESCRIPTIONS, isSpecialistOperative } from '@/lib/subscriptionAgentConfig';
import { Stethoscope } from 'lucide-react';

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
  industry_specialist: {
    label: 'Specialist Operatives',
    icon: Stethoscope,
    colorClass: 'text-feature-analytics',
    cssVar: '--feature-analytics',
  },
};

// Core agents that should always be visible & recommended first.
// These match the Aura Core ($697) operative set in TIER_AGENT_CONFIG so that
// "Enable Core Agents" activates the agents Aura Core actually includes.
const CORE_AGENT_TYPES = new Set([
  'triage',
  'customer_journey',
  'outreach',
  'creative_content',
  'web_presence',
]);

// ROI hint text per agent
const AGENT_ROI_HINTS: Record<string, string> = {
  triage: 'Handles 60-70% of first contacts',
  customer_journey: 'Saves ~8 hrs/week on follow-ups',
  dispatch: 'Saves ~10 hrs/week on scheduling',
  business_finance: 'Saves ~6 hrs/week on quoting & invoicing',
  outreach: 'Boosts lead conversion by ~25%',
  creative_content: 'Creates content 10× faster',
  web_presence: 'Keeps your site fresh automatically',
  field_navigation: 'Reduces drive time by ~15%',
  analytics_intelligence: 'Surfaces insights you would miss',
  admin: 'Automates routine admin tasks',
  diagnostic: 'Photo + symptom triage',
  permit_code: 'Local code & permit guidance',
  site_survey: 'Pre-install measurements & takeoff',
  insurance_claim: 'Claim-ready damage reports',
};

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1',
  2: 'Phase 2',
  3: 'Phase 3',
  4: 'Phase 4',
  5: 'Phase 5',
};

// Map job types to agent types they can access (10 consolidated operatives)
const JOB_TYPE_TO_AGENTS: Record<string, string[]> = {
  technician: ['dispatch', 'field_navigation', 'business_finance'],
  booking_agent: ['triage', 'customer_journey'],
  dispatch: ['dispatch', 'field_navigation', 'triage'],
  customer_service: ['triage', 'customer_journey'],
  manager: ['triage', 'customer_journey', 'analytics_intelligence'],
  billing: ['business_finance'],
  marketing: ['outreach', 'creative_content', 'web_presence'],
  analytics: ['analytics_intelligence'],
  inventory: ['business_finance'],
};

// Agent name mapping for display — 10 Consolidated Operatives
const AGENT_NAMES: Record<string, string> = {
  // Customer Portal (2)
  triage: 'AI Receptionist',
  customer_journey: 'Customer Journey Agent',
  // Field Operations (2)
  dispatch: 'Dispatch/GPS Console',
  field_navigation: 'Field Navigation Agent',
  // Business Operations (2)
  admin: 'Admin Agent',
  business_finance: 'Business Finance Agent',
  // Outreach & Sales (1)
  outreach: 'Outreach Agent',
  // Social Media & Creative (1)
  creative_content: 'Creative Content Agent',
  // Creative & Web Presence (1)
  web_presence: 'Web Presence Agent',
  // Analytics & Reports (1)
  analytics_intelligence: 'Analytics Intelligence Agent',
  // Industry Specialists (4)
  diagnostic: 'Diagnostic Specialist',
  permit_code: 'Permit & Code Specialist',
  site_survey: 'Site Survey & Quote Specialist',
  insurance_claim: 'Insurance Claim Specialist',
};

export default function AIAgentsHub() {
  const { agents, loading, toggleAgent, companyId, refetch } = useAIAgentOrchestrator();
  const { userRole, user } = useAuth();
  const { pack: industryPack } = useIndustryPack(companyId);
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSpecialists, setShowSpecialists] = useState(true);

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
    // Platform admins see all agents enabled in-memory via the orchestrator;
    // we don't auto-write to ai_agent_configs for them.
    if (userRole === 'platform_admin') {
      setAutoActivationDone(true);
      return;
    }
    
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
  }, [companyId, canManageAgents, loading, subscriptionTier, inTrial, userRole]);

  // Agents hidden from non-platform-admin roles
  // Use canonical operative IDs (legacy 'inventory'/'campaign' map to these via LEGACY_AGENT_MAP).
  const HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN = ['business_finance', 'outreach', 'inventory', 'campaign'];
  
  // No categories are hidden from company admins — Outreach & Sales is part of
  // the Aura Core operative set, so it must be visible to every paid customer.
  const HIDDEN_CATEGORIES_FOR_NON_PLATFORM_ADMIN: string[] = [];

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

  // Split agents into Core and Advanced
  const specialistAgents = filteredAgents.filter(a => isSpecialistOperative(a.type));
  const nonSpecialistAgents = filteredAgents.filter(a => !isSpecialistOperative(a.type));
  const coreAgents = nonSpecialistAgents.filter(a => CORE_AGENT_TYPES.has(a.type));
  const advancedAgents = nonSpecialistAgents.filter(a => !CORE_AGENT_TYPES.has(a.type));

  // Industry-pack opted-in specialists for the current company
  const industrySpecialists = new Set(industryPack?.extra_operatives ?? []);
  const isPlatformAdmin = userRole === 'platform_admin';

  const handleEnableRecommended = async () => {
    if (!companyId) return;
    const availableAgents = getAvailableAgents();
    const coreToEnable = agents.filter(
      a => CORE_AGENT_TYPES.has(a.type) && !a.is_enabled && availableAgents.includes(a.type)
    );
    for (const agent of coreToEnable) {
      await toggleAgent(agent.type, true);
    }
    await refetch();
    if (coreToEnable.length > 0) {
      toast.success(`${coreToEnable.length} core agents activated!`);
    } else {
      toast.info('All core agents are already active.');
    }
  };
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
            ? '10 consolidated AI operatives powering your business automation'
            : `${totalCount} AI operatives available based on your job roles`}
          featureColor="config"
          action={
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{enabledCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Operatives Active</p>
              </div>
              <HowToUseModal {...HOW_TO_USE.aiOperativesHub} />
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
                  <>
                    Trial mode on your <strong>{getTierInfo(subscriptionTier).label}</strong> plan —
                    showing the {availableAgentTypes.length} AI operatives included in your selected tier.
                  </>
                ) : subscriptionTier === 'command' ? (
                  <>Your <strong>Aura Elite</strong> plan includes all 24 AI Operatives.</>
                ) : (
                  <>
                    Your <strong>{getTierInfo(subscriptionTier).label}</strong> plan includes {availableAgentTypes.length} AI operatives.
                    {lockedAgentCount > 0 && ` ${lockedAgentCount} additional operatives unlock with an upgrade.`}
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

              <TabsContent value={activeCategory} className="mt-6 space-y-6">
                {/* Enable Recommended Button */}
                {canManageAgents && coreAgents.some(a => !a.is_enabled) && (
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable Recommended for My Business</p>
                      <p className="text-xs text-muted-foreground">Activate the 4 core agents to start automating immediately</p>
                    </div>
                    <Button size="sm" onClick={handleEnableRecommended} className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Enable Core Agents
                    </Button>
                  </div>
                )}

                {/* Core Agents Section */}
                {coreAgents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">Core Agents</h3>
                      <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {coreAgents.map((agent) => {
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
                            roiHint={AGENT_ROI_HINTS[agent.type]}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Advanced Agents Section */}
                {advancedAgents.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      <ChevronRight className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-90')} />
                      Advanced Agents ({advancedAgents.length})
                    </button>
                    {showAdvanced && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {advancedAgents.map((agent) => {
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
                              roiHint={AGENT_ROI_HINTS[agent.type]}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Specialist Operatives Section — industry-specific, Pro/Elite tier */}
                {specialistAgents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowSpecialists(!showSpecialists)}
                        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        <ChevronRight className={cn('h-4 w-4 transition-transform', showSpecialists && 'rotate-90')} />
                        Specialist Operatives ({specialistAgents.length})
                        <Badge variant="secondary" className="text-[10px]">Industry-Specific</Badge>
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-consoles/specialists')}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Open Specialist Console
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1 ml-6">
                      Auto-activated based on your industry. Requires Aura Pro or Elite.
                    </p>
                    {showSpecialists && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {specialistAgents.map((agent) => {
                          // Platform admins always see specialists as fully unlocked.
                          const tierAvailable = isPlatformAdmin || canAccessAgent(agent.type);
                          const inIndustry = isPlatformAdmin || industrySpecialists.has(agent.type);
                          const isAvailableInTier = tierAvailable && inIndustry;
                          const requiredTier = getAgentRequiredTier(agent.type);
                          return (
                            <AgentCard
                              key={agent.type}
                              agent={agent}
                              onToggle={(enabled) => toggleAgent(agent.type, enabled)}
                              onClick={() => handleAgentClick(agent.type)}
                              canManage={canManageAgents}
                              isAvailableInTier={isAvailableInTier}
                              requiredTier={!tierAvailable ? requiredTier : null}
                              missingDependencies={[]}
                              getTierInfo={getTierInfo}
                              latestEvent={latestEvents?.[agent.type] || null}
                              onReviewClick={() => setActiveTab('review')}
                              roiHint={AGENT_ROI_HINTS[agent.type]}
                              industryLockReason={
                                tierAvailable && !inIndustry
                                  ? `Not part of your industry pack. ${SPECIALIST_DESCRIPTIONS[agent.type as keyof typeof SPECIALIST_DESCRIPTIONS] ?? ''}`
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
  roiHint?: string;
  industryLockReason?: string;
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
  roiHint,
  industryLockReason,
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
      "hover:shadow-md transition-all relative",
      !isAvailableInTier && "opacity-80 border-dashed border-muted-foreground/30"
    )}>
      <CardContent className="p-2.5">
        {/* Row 1: Icon + Name + Toggle */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div 
              className={cn(
                "p-1 rounded shrink-0",
                agent.is_enabled && isAvailableInTier && "feature-pulse-active",
                !isAvailableInTier && "opacity-50"
              )}
              style={{ backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)` }}
            >
              <Icon className={cn(`h-3.5 w-3.5 ${categoryInfo?.colorClass || 'text-primary'}`, !isAvailableInTier && "opacity-50")} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-xs font-semibold leading-tight truncate", !isAvailableInTier && "opacity-70")}>{agent.name}</p>
              <p className="text-[10px] text-muted-foreground">{PHASE_LABELS[agent.phase]}</p>
            </div>
          </div>
          
          {isAvailableInTier && canManage ? (
            <Switch checked={agent.is_enabled} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} className="scale-75 shrink-0" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded", !isAvailableInTier ? "bg-amber-500/10 border border-amber-500/30" : "text-muted-foreground")}>
                  <Lock className={cn("h-3 w-3", !isAvailableInTier ? "text-amber-500" : "text-muted-foreground")} />
                  {!isAvailableInTier && <span className="text-[10px] font-medium text-amber-500">Locked</span>}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {industryLockReason
                    ? industryLockReason
                    : !isAvailableInTier
                      ? `Upgrade to ${tierInfo?.label || 'a higher plan'}`
                      : 'Only admins can toggle agents'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Row 2: Status + Decision Mode */}
        <div className="flex items-center gap-1 flex-wrap mb-1">
          {isAvailableInTier ? (
            <Badge
              variant={agent.is_enabled ? 'default' : 'secondary'}
              style={agent.is_enabled ? {
                backgroundColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.15)`,
                color: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}))`,
                borderColor: `hsl(var(${categoryInfo?.cssVar || '--feature-platform'}) / 0.3)`,
              } : undefined}
              className={cn("text-[10px] px-1.5 py-0 h-4", agent.is_enabled && 'border')}
            >
              {agent.is_enabled ? <><Zap className="h-2 w-2 mr-0.5" />Active</> : 'Off'}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0 h-4">
              <Lock className="h-2 w-2 mr-0.5" />{industryLockReason ? 'Industry' : tierInfo?.label}
            </Badge>
          )}
          {agent.is_enabled && latestEvent && <DecisionModeBadge mode={latestEvent.decision_mode} size="sm" />}
          <Badge variant="outline" className="text-card-foreground border-border/50 text-[10px] px-1.5 py-0 h-4 w-fit">{agent.category.replace('_', ' ')}</Badge>
          {roiHint && (
            <Badge variant="outline" className="text-primary/80 border-primary/20 bg-primary/5 text-[10px] px-1.5 py-0 h-4">
              {roiHint}
            </Badge>
          )}
        </div>

        {/* Row 3: Confidence + Time (only if active) */}
        {agent.is_enabled && latestEvent && (
          <div className="flex items-center gap-2 text-[10px] mb-1">
            <ConfidenceIndicator score={latestEvent.confidence_score} size="sm" showLabel />
            {timeAgo && <span className="text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{timeAgo}</span>}
          </div>
        )}

        {/* Dependencies (compact) */}
        {allDependencyNames.length > 0 && (
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-1 rounded border text-[10px] mb-1",
            isAvailableInTier && missingDependencies.length > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/30 border-border/50"
          )}>
            <Info className={cn("h-3 w-3 shrink-0", isAvailableInTier && missingDependencies.length > 0 ? "text-amber-500" : "text-muted-foreground")} />
            <p className="text-card-foreground leading-tight truncate">
              <span className={cn("font-medium", isAvailableInTier && missingDependencies.length > 0 ? "text-amber-400" : "text-primary")}>Requires:</span> {allDependencyNames.join(', ')}
            </p>
          </div>
        )}

        {/* Needs Review */}
        {agent.is_enabled && latestEvent?.requires_human_review && (
          <div className="flex items-center justify-between gap-2 px-1.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 mb-1">
            <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1"><Eye className="h-3 w-3" />Needs Review</span>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onReviewClick(); }} className="h-4 text-[10px] px-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20">View</Button>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between pt-0.5">
          {isAvailableInTier ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClick} className={cn("h-6 text-[11px] px-1.5", categoryInfo?.colorClass || 'text-primary')}>
                Configure<ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
              {agent.is_enabled && (
                <Button variant="outline" size="sm" onClick={onClick} className="h-6 text-[11px] px-2">
                  <Play className="h-2.5 w-2.5 mr-1" />Test
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/dashboard/subscription'); }} className="w-full h-6 text-[11px]">
              <Sparkles className="h-3 w-3 mr-1" />Upgrade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
