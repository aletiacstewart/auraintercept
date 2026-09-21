import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Activity,
  BarChart3,
  Bot,
  Compass,
  Eye,
  Info,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

import { useAIAgentOrchestrator } from '@/hooks/useAIAgentOrchestrator';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectedIntegrations } from '@/hooks/useConnectedIntegrations';
import { onboarding as track } from '@/lib/analytics';
import { useSubscription } from '@/hooks/useSubscription';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useAgentReviewCount } from '@/hooks/useAgentReviewCount';
import {
  useAgentPerformanceMetrics,
  formatDuration,
  formatNumber,
  type AgentMetrics,
} from '@/hooks/useAgentPerformanceMetrics';
import { hasFullAccess, canManageAIAgents } from '@/lib/accessControl';
import { isSpecialistOperative } from '@/lib/subscriptionAgentConfig';
import { AGENT_TYPES, type AgentType } from '@/lib/agentTypes';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';

import { AgentDiscoveryCard } from '@/components/agents/AgentDiscoveryCard';
import { AgentStatusCard } from '@/components/agents/AgentStatusCard';
import { AgentConfigModal } from '@/components/agents/AgentConfigModal';
import { AgentTestModal } from '@/components/agents/AgentTestModal';
import { SpecialistOperativesPanel } from '@/components/agents/SpecialistOperativesPanel';
import { AgentWorkflowMonitor } from '@/components/ai/agents/AgentWorkflowMonitor';
import { WorkflowRunsPanel } from '@/components/agents/WorkflowRunsPanel';
import { BatchAgentActivation } from '@/components/ai/agents/BatchAgentActivation';
import { AgentAnalyticsDashboard } from '@/components/ai/agents/AgentAnalyticsDashboard';
import { AgentHealthPanel } from '@/components/agents/AgentHealthPanel';
import { ConversationHistoryBrowser } from '@/components/ai/agents/ConversationHistoryBrowser';
import { OperativeDependencyGraph } from '@/components/ai/agents/OperativeDependencyGraph';
import { AgentReviewQueue } from '@/components/ai/agents/AgentReviewQueue';
import { AIAgentTestSuite } from '@/components/ai/AIAgentTestSuite';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';

const EMPTY_METRICS: AgentMetrics = { totalInteractions: 0, successRate: 0, avgSeconds: null };

// Agents an employee may see, by job assignment.
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

/**
 * Job types describe the work in plain English. Every operative that is not
 * listed by a job type still needs a home, so anything left over is grouped
 * into an "Everything else" pseudo job type — nothing is hidden.
 */
const OTHER_JOB: AgentType = {
  id: 'other',
  name: 'Back-Office & Web',
  description: 'Admin work, quotes and invoices, content, website and reporting agents.',
  features: ['Admin tasks', 'Quotes & invoices', 'Content & website', 'Reporting'],
  requiredIntegrations: ['email'],
  industryFit: ['All'],
  agents: [],
};

export default function AIAgentsHub() {
  const { agents, loading, toggleAgent, updateAgentSettings, companyId, refetch } = useAIAgentOrchestrator();
  const { userRole, user } = useAuth();
  const navigate = useNavigate();
  const { agentId: routeAgentId } = useParams<{ agentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pack: industryPack } = useIndustryPack(companyId);
  const {
    subscriptionTier,
    canAccessAgent,
    getTierInfo,
    inTrial,
    getAvailableAgents,
  } = useSubscription();
  const { count: reviewCount } = useAgentReviewCount();
  const { data: metrics } = useAgentPerformanceMetrics(companyId);
  const { missing: missingFor } = useConnectedIntegrations(companyId);

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') ?? 'discover');
  const [configAgent, setConfigAgent] = useState<string | null>(null);
  const [testAgent, setTestAgent] = useState<string | null>(null);

  // Deep links: /dashboard/ai-agents/:agentId(/settings) opens the setup window.
  useEffect(() => {
    if (routeAgentId && AGENT_REGISTRY[routeAgentId]) {
      setConfigAgent(routeAgentId);
    }
  }, [routeAgentId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const { data: userJobAssignments } = useQuery({
    queryKey: ['user-job-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_job_assignments')
        .select('job_type')
        .eq('employee_id', user.id);
      if (error) throw error;
      return data?.map((d) => d.job_type) || [];
    },
    enabled: !!user?.id && userRole === 'employee',
  });

  const hasHubAccess = hasFullAccess(userRole, userJobAssignments || []);
  const canManageAgents = canManageAIAgents(userRole);
  const isPlatformAdmin = userRole === 'platform_admin';

  const accessibleAgents = useMemo(() => {
    if (userRole === 'platform_admin' || userRole === 'company_admin') return agents;
    if (userJobAssignments && userJobAssignments.length > 0) {
      const allowed = new Set<string>();
      userJobAssignments.forEach((job) => (JOB_TYPE_TO_AGENTS[job] || []).forEach((a) => allowed.add(a)));
      return agents.filter((a) => allowed.has(a.type));
    }
    return [];
  }, [agents, userRole, userJobAssignments]);

  const availableAgentTypes = getAvailableAgents();
  const industrySpecialists = useMemo(
    () => new Set(industryPack?.extra_operatives ?? []),
    [industryPack],
  );

  const isAvailable = (type: string) => {
    if (isPlatformAdmin) return true;
    if (isSpecialistOperative(type)) {
      return canAccessAgent(type) && industrySpecialists.has(type);
    }
    return canAccessAgent(type);
  };

  const nonSpecialists = accessibleAgents.filter((a) => !isSpecialistOperative(a.type));
  const enabledAgents = accessibleAgents.filter((a) => a.is_enabled);

  // Group the real operatives under the plain-English job types.
  const jobGroups = useMemo(() => {
    const claimed = new Set<string>();
    const groups: { job: AgentType; members: typeof nonSpecialists }[] = [];
    for (const job of Object.values(AGENT_TYPES) as AgentType[]) {
      const members = nonSpecialists.filter((a) => job.agents.includes(a.type));
      members.forEach((m) => claimed.add(m.type));
      if (members.length > 0) groups.push({ job, members });
    }
    const leftovers = nonSpecialists.filter((a) => !claimed.has(a.type));
    if (leftovers.length > 0) {
      groups.push({ job: { ...OTHER_JOB, agents: leftovers.map((l) => l.type) }, members: leftovers });
    }
    return groups;
  }, [nonSpecialists]);

  const handleEnableJob = async (members: { type: string; is_enabled: boolean }[]) => {
    const toEnable = members.filter((m) => !m.is_enabled && isAvailable(m.type));
    if (toEnable.length === 0) {
      toast.info('Those agents are already on, or need a plan upgrade.');
      return;
    }
    for (const m of toEnable) {
      await toggleAgent(m.type, true);
      void track.agentEnabled({ userId: user?.id, companyId }, m.type);
    }
    await refetch();
    toast.success(`${toEnable.length} agent${toEnable.length > 1 ? 's' : ''} turned on.`);
  };

  const configAgentData = configAgent ? agents.find((a) => a.type === configAgent) : undefined;
  const testAgentData = testAgent ? agents.find((a) => a.type === testAgent) : undefined;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasHubAccess) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents assigned to you</h3>
            <p className="text-muted-foreground">
              Ask your administrator to assign AI agents to your role.
            </p>
          </Card>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const totals = metrics?.totals ?? EMPTY_METRICS;
  const lockedCount = accessibleAgents.filter((a) => !isAvailable(a.type)).length;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Bot}
            title="Agents"
            description="Discover what your AI agents can do, see how they are performing, and set them up — all in one place."
            featureColor="platform"
            action={
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {enabledAgents.length}/{accessibleAgents.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Agents active</p>
                </div>
                <HowToUseModal {...HOW_TO_USE.aiOperativesHub} />
              </div>
            }
          />

          {canManageAgents && !isPlatformAdmin && (
            <Alert className={subscriptionTier === 'free' ? 'border-amber-500/30 bg-amber-500/10' : 'border-primary/30 bg-primary/5'}>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {inTrial ? (
                    <>
                      Trial on your <strong>{getTierInfo(subscriptionTier).label}</strong> plan — showing the{' '}
                      {availableAgentTypes.length} agents included.
                    </>
                  ) : (
                    <>
                      Your <strong>{getTierInfo(subscriptionTier).label}</strong> plan includes{' '}
                      {availableAgentTypes.length} agents.
                      {lockedCount > 0 && ` ${lockedCount} more unlock with an upgrade.`}
                    </>
                  )}
                </span>
                {subscriptionTier !== 'command' && !inTrial && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/subscription')}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Upgrade Plan
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="discover" className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="my-agents" className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                My Agents
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="approvals" className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Approvals
                {reviewCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    {reviewCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversations
              </TabsTrigger>
            </TabsList>

            {/* ---------------- Discover ---------------- */}
            <TabsContent value="discover" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobGroups.map(({ job, members }) => (
                  <AgentDiscoveryCard
                    key={job.id}
                    agent={job}
                    canManage={canManageAgents}
                    members={members.map((m) => ({
                      type: m.type,
                      name: m.name,
                      is_enabled: m.is_enabled,
                      available: isAvailable(m.type),
                    }))}
                    missingIntegrations={
                      isPlatformAdmin ? [] : missingFor(job.requiredIntegrations)
                    }
                    onConnect={() => navigate('/dashboard/integrations')}
                    onEnable={() => handleEnableJob(members)}
                    onToggleMember={async (type, enabled) => {
                      await toggleAgent(type, enabled);
                      await refetch();
                    }}
                    onLearnMore={(type) => type && setConfigAgent(type)}
                  />
                ))}
              </div>

              <SpecialistOperativesPanel />
            </TabsContent>

            {/* ---------------- My Agents ---------------- */}
            <TabsContent value="my-agents" className="space-y-3 mt-6">
              {enabledAgents.length === 0 ? (
                <Card className="p-12 text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No agents are on yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Pick a job in Discover and switch on the agents that do it.
                  </p>
                  <Button onClick={() => handleTabChange('discover')}>Go to Discover</Button>
                </Card>
              ) : (
                enabledAgents.map((agent) => (
                  <AgentStatusCard
                    key={agent.type}
                    canManage={canManageAgents}
                    agent={{
                      type: agent.type,
                      name: agent.name,
                      is_enabled: agent.is_enabled,
                      needsSetup: Object.keys(agent.settings || {}).length === 0,
                      metrics: metrics?.byAgent[agent.type] ?? EMPTY_METRICS,
                    }}
                    onEdit={() => setConfigAgent(agent.type)}
                    onViewPerformance={() => handleTabChange('performance')}
                    onTogglePause={async () => {
                      await toggleAgent(agent.type, !agent.is_enabled);
                      await refetch();
                    }}
                    onTest={() => setTestAgent(agent.type)}
                  />
                ))
              )}
            </TabsContent>

            {/* ---------------- Performance ---------------- */}
            <TabsContent value="performance" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Interactions (30 days)</p>
                  <p className="text-2xl font-bold">{formatNumber(totals.totalInteractions)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Success rate</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {totals.totalInteractions > 0 ? `${totals.successRate}%` : '—'}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Average handling time</p>
                  <p className="text-2xl font-bold">{formatDuration(totals.avgSeconds)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">Agents active</p>
                  <p className="text-2xl font-bold">{enabledAgents.length}</p>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/analytics?tab=overview')}>
                  View detailed report
                </Button>
              </div>
              {companyId && <AgentHealthPanel companyId={companyId} />}
              {companyId && <AgentAnalyticsDashboard companyId={companyId} />}
            </TabsContent>

            {/* ---------------- Approvals ---------------- */}
            <TabsContent value="approvals" className="space-y-4 mt-6">
              {companyId ? (
                <AgentReviewQueue companyId={companyId} />
              ) : (
                <Card className="p-12 text-center">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Loading…</h3>
                </Card>
              )}
            </TabsContent>

            {/* ---------------- Activity ---------------- */}
            <TabsContent value="activity" className="space-y-4 mt-6">
              {companyId && <WorkflowRunsPanel companyId={companyId} />}
              {companyId && <AgentWorkflowMonitor companyId={companyId} />}
              {canManageAgents && (
                <BatchAgentActivation
                  agents={agents}
                  onActivatePhase={async (types) => {
                    for (const t of types) {
                      if (!agents.find((a) => a.type === t)?.is_enabled) await toggleAgent(t, true);
                    }
                    await refetch();
                  }}
                  onActivateAll={async () => {
                    for (const a of agents) {
                      if (!a.is_enabled && isAvailable(a.type)) await toggleAgent(a.type, true);
                    }
                    await refetch();
                    toast.success('All available agents activated.');
                  }}
                />
              )}
              <OperativeDependencyGraph agents={agents} />
              {isPlatformAdmin && <AIAgentTestSuite />}
            </TabsContent>

            {/* ---------------- Conversations ---------------- */}
            <TabsContent value="conversations" className="space-y-4 mt-6">
              {companyId ? (
                <ConversationHistoryBrowser companyId={companyId} />
              ) : (
                <Card className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Loading…</h3>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      <AgentConfigModal
        open={!!configAgent}
        onOpenChange={(open) => {
          if (!open) {
            setConfigAgent(null);
            if (routeAgentId) navigate('/dashboard/ai-agents', { replace: true });
          }
        }}
        agentType={configAgent}
        isEnabled={!!configAgentData?.is_enabled}
        settings={configAgentData?.settings ?? {}}
        companyId={companyId}
        canManage={canManageAgents}
        onToggle={async (enabled) => {
          if (!configAgent) return;
          await toggleAgent(configAgent, enabled);
          await refetch();
        }}
        onSave={async (settings) => {
          if (!configAgent) return;
          await updateAgentSettings(configAgent, settings);
        }}
      />

      <AgentTestModal
        open={!!testAgent}
        onOpenChange={(open) => !open && setTestAgent(null)}
        agentType={testAgent ?? ''}
        agentName={testAgentData?.name ?? ''}
        isEnabled={!!testAgentData?.is_enabled}
        companyId={companyId}
      />
    </DashboardLayout>
  );
}
