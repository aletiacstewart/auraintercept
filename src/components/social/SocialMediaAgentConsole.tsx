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

import { SocialFeedQueue } from '@/components/marketing/SocialFeedQueue';
import { MultiChannelGenerator } from '@/components/content-engine/MultiChannelGenerator';
import { ContentEngineDashboard } from '@/components/content-engine/ContentEngineDashboard';
import { ContentEngineCalendar } from '@/components/content-engine/ContentEngineCalendar';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { IndustryTemplateSelector } from '@/components/social/IndustryTemplateSelector';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Share2, 
} from 'lucide-react';

// Simplified quick actions - 2 clear entry points
const QUICK_ACTIONS = [
  { id: 'create-content', label: 'Create Content', icon: Share2, message: 'Open multi-channel content generator', featureColor: 'text-pink-400' },
  { id: 'my-posts', label: 'My Posts', icon: Share2, message: 'View saved drafts and posts', featureColor: 'text-pink-400' },
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

  const [contentEngineTab, setContentEngineTab] = useState('generator');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    setActiveTab('chat');
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string, actionId?: string) => {
    if (actionId === 'create-content') {
      setContentEngineTab('generator');
      setActiveTab('create-content');
      return;
    }
    if (actionId === 'my-posts') {
      setActiveTab('my-posts');
      return;
    }
    setActiveTab('chat');
    await sendMessage(message);
  };

  const handleHome = () => {
    clearMessages();
    setInputValue('');
    setActiveTab('chat');
    setLastAgent('creative_content');
  };

  const showWelcome = messages.length === 0 && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  const getActiveLabel = () => {
    if (activeTab === 'create-content') {
      const labels: Record<string, string> = {
        settings: 'Brand Voice',
        generator: 'Content Engine',
        dashboard: 'Dashboard',
        calendar: 'Calendar'
      };
      return labels[contentEngineTab] || 'Content Engine';
    }
    if (activeTab === 'my-posts') return 'My Posts';
    if (messages.length > 0) return agentStyle.label;
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  const { data: socialMetrics } = useSocialMetrics(effectiveCompanyId);
  const sm = socialMetrics;
  const { companyCreatedAt } = useCompanyUptime(effectiveCompanyId);

  const SOCIAL_AGENTS: CyberAgent[] = [
    { id: 'creative_content', name: 'Creative Content Agent', description: 'Social content, brand voice & multi-channel creation', icon: Share2, hsl: '330,80%,70%', status: 'active', metric1Value: sm?.postsScheduled ?? 0, metric1Label: 'Drafts', metric2Value: sm?.postsPublished ?? 0, metric2Label: 'Published' },
  ];

  return (
    <CyberConsoleLayout
      logoUrl={company?.logo_url}
      companyName={company?.name || 'Social Media Ops'}
      agentLabel={activeLabel}
      agentColor="text-pink-400"
      agentBgColor="bg-gradient-to-br from-pink-500/20 to-purple-500/20"
      subtitle="Social Media Ops"
      companyCreatedAt={companyCreatedAt}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      onHomeClick={handleHome}
      agents={SOCIAL_AGENTS}
      currentAgentId="creative_content"
      onAgentClick={() => setActiveTab('create-content')}
      quickActions={QUICK_ACTIONS}
      onQuickAction={handleQuickAction}
      useDefaultLogo={true}
    >
      {/* Create Content tab */}
      {activeTab === 'create-content' && (
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-2 py-3 sm:px-4 sm:py-4">
          {!effectiveCompanyId ? (
            <div className="max-w-md mx-auto text-center py-12 text-sm text-muted-foreground">
              Sign in to a company workspace to use the content engine.
            </div>
          ) : (
            <Tabs value={contentEngineTab} onValueChange={setContentEngineTab} className="min-w-0">
              <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
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
          )}
        </div>
      )}

      {/* My Posts tab */}
      {activeTab === 'my-posts' && (
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-2 py-3 sm:px-4 sm:py-4">
          {!effectiveCompanyId ? (
            <div className="max-w-md mx-auto text-center py-12 text-sm text-muted-foreground">
              Sign in to a company workspace to view your posts.
            </div>
          ) : (
            <SocialFeedQueue companyId={effectiveCompanyId} initialFilter="pending" />
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <>
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-2 pt-3 pb-32 sm:px-4 sm:pt-4">
            {showWelcome ? (
              <div className="space-y-6 animate-fade-in">
                {/* Hero: Multi-Channel Generator */}
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pink-500/10 mb-1">
                    <Share2 className="h-5 w-5 text-pink-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Create Content for All Platforms</h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Generate posts, captions, and visuals for every channel in one click — or ask Aura anything about your social strategy.
                  </p>
                </div>

                {/* Prominent Multi-Channel Generator */}
                {effectiveCompanyId && <MultiChannelGenerator />}

                {/* Secondary actions */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('my-posts')}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    View saved drafts & posts
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <IndustryTemplateSelector
                    onSelectTemplate={(template) => setInputValue(template)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Chat Messages */}
                {messages.map((msg, idx) => {
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
                {isLoading && (
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
            placeholder="Ask about content, captions, platforms..."
          />
        </>
      )}
    </CyberConsoleLayout>
  );
};
