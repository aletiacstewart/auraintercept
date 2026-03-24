import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { useSocialMetrics } from '@/hooks/useConsoleAgentMetrics';
import { useCompanyUptime } from '@/hooks/useCompanyUptime';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CyberConsoleLayout } from '@/components/ai/chat/CyberConsoleLayout';
import type { CyberAgent } from '@/components/ai/chat/CyberConsoleLayout';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { SocialFeedQueue } from '@/components/marketing/SocialFeedQueue';
import { MultiChannelGenerator } from '@/components/content-engine/MultiChannelGenerator';
import { ContentEngineDashboard } from '@/components/content-engine/ContentEngineDashboard';
import { ContentEngineCalendar } from '@/components/content-engine/ContentEngineCalendar';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { IndustryTemplateSelector } from '@/components/social/IndustryTemplateSelector';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Share2, 
  Wand2,
  Inbox,
} from 'lucide-react';

// Simplified quick actions - 2 clear entry points
const QUICK_ACTIONS = [
  { id: 'create-content', label: 'Create Content', icon: Wand2, message: 'Open multi-channel content generator', featureColor: 'text-pink-400' },
  { id: 'my-posts', label: 'My Posts', icon: Inbox, message: 'View saved drafts and posts', featureColor: 'text-pink-400' },
];

// Tab configuration
const TABS = [
  { id: 'chat', label: 'Home', icon: Share2, featureColor: 'text-pink-400' },
  ...QUICK_ACTIONS.map(action => ({ id: action.id, label: action.label, icon: action.icon, featureColor: action.featureColor })),
];

interface SocialMediaAgentConsoleProps {
  companyId?: string;
}

export const SocialMediaAgentConsole: React.FC<SocialMediaAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId, user } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('creative_content');
  
  // Single visibility state
  const [showContentEngine, setShowContentEngine] = useState(false);
  const [contentEngineTab, setContentEngineTab] = useState('generator');
  const [showMyPosts, setShowMyPosts] = useState(false);

  // Company branding
  const { data: company } = useQuery({
    queryKey: ['company-branding', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name, logo_url, primary_color')
        .eq('id', effectiveCompanyId)
        .single();
      return data;
    },
    enabled: !!effectiveCompanyId,
  });

  const { messages, isLoading, currentAgent, sendMessage, clearMessages } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    userId: user?.id,
    initialAgent: 'creative_content',
    onAgentChange: (agent) => {
      setLastAgent(agent);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hideAllForms = () => {
    setShowContentEngine(false);
    setShowMyPosts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    hideAllForms();
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string, actionId?: string) => {
    if (actionId === 'create-content') {
      hideAllForms();
      setShowContentEngine(true);
      setContentEngineTab('generator');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'my-posts') {
      hideAllForms();
      setShowMyPosts(true);
      setActiveTab('chat');
      return;
    }
    
    hideAllForms();
    setActiveTab('chat');
    await sendMessage(message);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'chat') {
      hideAllForms();
    }
  };

  const handleHome = () => {
    clearMessages();
    hideAllForms();
    setInputValue('');
    setActiveTab('chat');
    setLastAgent('creative_content');
  };

  const isShowingForm = showContentEngine || showMyPosts;
  const showWelcome = messages.length === 0 && !isShowingForm && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  const getActiveLabel = () => {
    if (showContentEngine) {
      const labels: Record<string, string> = {
        settings: 'Brand Voice',
        generator: 'Content Engine',
        dashboard: 'Dashboard',
        calendar: 'Calendar'
      };
      return labels[contentEngineTab] || 'Content Engine';
    }
    if (showMyPosts) return 'My Posts';
    if (messages.length > 0) return agentStyle.label;
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  const { data: socialMetrics } = useSocialMetrics(effectiveCompanyId);
  const sm = socialMetrics;
  const { companyCreatedAt } = useCompanyUptime(effectiveCompanyId);

  const SOCIAL_AGENTS: CyberAgent[] = [
    { id: 'creative_content', name: 'Creative Content', description: 'Generates social & creative content', icon: Share2, hsl: '330,80%,70%', status: 'active', metric1Value: sm?.postsScheduled ?? 0, metric1Label: 'Drafts', metric2Value: sm?.postsPublished ?? 0, metric2Label: 'Published' },
    { id: 'brand_voice', name: 'Brand Voice Mgr', description: 'Maintains brand consistency', icon: Wand2, hsl: '270,72%,68%', status: 'standby', metric1Value: sm?.campaignsTotal ?? 0, metric1Label: 'Campaigns', metric2Value: sm?.campaignsActive ?? 0, metric2Label: 'Active' },
    { id: 'content_engine', name: 'Content Engine', description: 'Multi-channel content creation', icon: Inbox, hsl: '189,100%,65%', status: 'standby', metric1Value: sm?.postsScheduled ?? 0, metric1Label: 'Queued', metric2Value: sm?.customersReached ?? 0, metric2Label: 'Reached' },
  ];

  return (
    <CyberConsoleLayout
      logoUrl={company?.logo_url}
      companyName={company?.name || 'Social Media Ops'}
      agentLabel={activeLabel}
      agentColor="text-pink-400"
      agentBgColor="bg-gradient-to-br from-pink-500/20 to-purple-500/20"
      subtitle="Social Media Ops — Cyber-Sentry Edition"
      companyCreatedAt={companyCreatedAt}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        handleTabChange(tabId);
        if (tabId !== 'chat') {
          const action = QUICK_ACTIONS.find(a => a.id === tabId);
          if (action) handleQuickAction(action.message, action.id);
        }
      }}
      onHomeClick={handleHome}
      agents={SOCIAL_AGENTS}
      currentAgentId={
        showContentEngine ? (contentEngineTab === 'settings' ? 'brand_voice' : 'social_content') :
        showMyPosts ? 'scheduler' :
        currentAgent || lastAgent
      }
      onAgentClick={(agentId) => {
        const AGENT_TO_ACTION: Record<string, string> = {
          social_content: 'create-content',
          brand_voice: 'create-content',
          scheduler: 'my-posts',
        };
        const actionId = AGENT_TO_ACTION[agentId];
        if (actionId) {
          const action = QUICK_ACTIONS.find(a => a.id === actionId);
          if (action) {
            handleQuickAction(action.message, action.id);
            if (agentId === 'brand_voice') setContentEngineTab('settings');
          }
        }
      }}
      quickActions={QUICK_ACTIONS}
      onQuickAction={handleQuickAction}
      useDefaultLogo={true}
    >
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
            {showWelcome ? (
              <WelcomeScreen
                companyName={company?.name || 'Social Media'}
                title="Social Media Ops"
                subtitle="Create content for all your platforms, schedule posts, or ask me anything about your social strategy."
                actions={QUICK_ACTIONS}
                onAction={handleQuickAction}
                consoleType="social"
                headerAction={
                  <IndustryTemplateSelector
                    onSelectTemplate={(template) => {
                      setInputValue(template);
                    }}
                  />
                }
              />
            ) : (
              <div className="space-y-4">
                {/* Content Engine */}
                {showContentEngine && effectiveCompanyId && (
                  <div className="space-y-4">
                    <Tabs value={contentEngineTab} onValueChange={setContentEngineTab}>
                      <TabsList>
                        <TabsTrigger value="settings">Brand Voice</TabsTrigger>
                        <TabsTrigger value="generator">Generate</TabsTrigger>
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                      </TabsList>

                      <TabsContent value="settings">
                        <AIContentProfileManager />
                      </TabsContent>
                      <TabsContent value="generator">
                        <MultiChannelGenerator />
                      </TabsContent>
                      <TabsContent value="dashboard">
                        <ContentEngineDashboard />
                      </TabsContent>
                      <TabsContent value="calendar">
                        <ContentEngineCalendar />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* My Posts */}
                {showMyPosts && effectiveCompanyId && (
                  <SocialFeedQueue companyId={effectiveCompanyId} initialFilter="pending" />
                )}

                {/* Chat Messages */}
                {!isShowingForm && messages.map((msg, idx) => {
                  const msgAgentStyle = msg.agent ? getAgentStyle(msg.agent) : agentStyle;
                  const prevAgent = idx > 0 ? messages[idx - 1].agent : null;
                  const isHandoff = msg.role === 'assistant' && msg.agent !== prevAgent && idx > 0;
                  
                  return (
                    <ChatBubble
                      key={idx}
                      role={msg.role}
                      content={msg.content}
                      agentLabel={msgAgentStyle.label}
                      agentColor={msgAgentStyle.color}
                      agentBgColor={msgAgentStyle.bgColor}
                      isHandoff={isHandoff}
                    />
                  );
                })}
                {isLoading && !isShowingForm && (
                  <ChatBubble
                    role="assistant"
                    content=""
                    isLoading={true}
                    agentLabel={agentStyle.label}
                    agentColor={agentStyle.color}
                    agentBgColor={agentStyle.bgColor}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <FloatingInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onHome={handleHome}
            isLoading={isLoading}
            placeholder="Ask about posts, scheduling..."
          />
        </>
      )}
    </CyberConsoleLayout>
  );
};
