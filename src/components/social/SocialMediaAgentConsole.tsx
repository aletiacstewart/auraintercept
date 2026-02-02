import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassHeader } from '@/components/ai/chat/GlassHeader';
import { MobileTabNav } from '@/components/ai/chat/MobileTabNav';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { SocialContentWizard } from './SocialContentWizard';
import { SocialFeedQueue } from '@/components/marketing/SocialFeedQueue';
import { SocialContentCalendar } from './SocialContentCalendar';
import { SocialBatchWizard } from './SocialBatchWizard';
import { SocialScheduleQueue } from './SocialScheduleQueue';
import { MultiChannelGenerator } from '@/components/content-engine/MultiChannelGenerator';
import { ContentEngineDashboard } from '@/components/content-engine/ContentEngineDashboard';
import { ContentEngineCalendar } from '@/components/content-engine/ContentEngineCalendar';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Share2, 
  Wand2,
} from 'lucide-react';

// Simplified quick actions - consolidated into 2 main sections
const QUICK_ACTIONS = [
  { id: 'social-posts', label: 'Social Posts', icon: Share2, message: 'Manage social posts', featureColor: 'text-pink-400' },
  { id: 'content-engine', label: 'Content Engine', icon: Wand2, message: 'Open multi-channel generator', featureColor: 'text-pink-400' },
];

// Tab configuration - simplified to 3 main tabs
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
  const [lastAgent, setLastAgent] = useState<string>('social_content');
  
  // Consolidated visibility states
  const [showSocialPosts, setShowSocialPosts] = useState(false);
  const [socialPostsTab, setSocialPostsTab] = useState('create');
  const [showContentEngine, setShowContentEngine] = useState(false);
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
    initialAgent: 'social_content',
    onAgentChange: (agent) => {
      console.log('[Social Media] Agent changed to:', agent);
      setLastAgent(agent);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hideAllForms = () => {
    setShowSocialPosts(false);
    setShowContentEngine(false);
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
    if (actionId === 'social-posts') {
      hideAllForms();
      setShowSocialPosts(true);
      setSocialPostsTab('create');
      setActiveTab('chat');
      return;
    }
    if (actionId === 'content-engine') {
      hideAllForms();
      setShowContentEngine(true);
      setContentEngineTab('generator');
      setActiveTab('chat');
      return;
    }
    
    // Default: send message to AI
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
    setLastAgent('social_content');
  };

  const isShowingForm = showSocialPosts || showContentEngine;
  const showWelcome = messages.length === 0 && !isShowingForm && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type
  const getActiveLabel = () => {
    if (showSocialPosts) {
      const labels: Record<string, string> = {
        create: 'Create Post',
        batch: 'Batch Posts',
        drafts: 'Drafts',
        scheduled: 'Scheduled',
        calendar: 'Calendar'
      };
      return labels[socialPostsTab] || 'Social Posts';
    }
    if (showContentEngine) {
      const labels: Record<string, string> = {
        settings: 'Brand Voice',
        generator: 'Content Engine',
        dashboard: 'Dashboard',
        calendar: 'Calendar'
      };
      return labels[contentEngineTab] || 'Content Engine';
    }
    if (messages.length > 0) return agentStyle.label;
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-xl border-border/50 console-surface">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Social Media'}
        agentLabel={activeLabel}
        agentColor="text-pink-400"
        agentBgColor="bg-gradient-to-br from-pink-500/20 to-purple-500/20"
        useDefaultLogo={true}
      />

      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          handleTabChange(tabId);
          if (tabId !== 'chat') {
            const action = QUICK_ACTIONS.find(a => a.id === tabId);
            if (action) {
              handleQuickAction(action.message, action.id);
            }
          }
        }}
        onHomeClick={handleHome}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative console-surface">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
              {showWelcome ? (
                <WelcomeScreen
                  companyName={company?.name || 'Social Media'}
                  title="Social Media Ops"
                  subtitle="I can help you create, schedule, and manage social media content across all platforms. What would you like to do?"
                  actions={QUICK_ACTIONS}
                  onAction={handleQuickAction}
                  consoleType="social"
                />
              ) : (
                <div className="space-y-4">
                  {/* Social Posts - Consolidated with nested tabs */}
                  {showSocialPosts && effectiveCompanyId && (
                    <div className="space-y-4">
                      <Tabs value={socialPostsTab} onValueChange={setSocialPostsTab}>
                        <TabsList>
                          <TabsTrigger value="create">Create</TabsTrigger>
                          <TabsTrigger value="batch">Batch</TabsTrigger>
                          <TabsTrigger value="drafts">Drafts</TabsTrigger>
                          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                          <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="create">
                          <SocialContentWizard
                            companyId={effectiveCompanyId}
                            onCancel={handleHome}
                            onSuccess={() => {
                              setSocialPostsTab('drafts');
                            }}
                          />
                        </TabsContent>
                        <TabsContent value="batch">
                          <SocialBatchWizard
                            companyId={effectiveCompanyId}
                            onCancel={handleHome}
                            onSuccess={() => {
                              setSocialPostsTab('scheduled');
                            }}
                          />
                        </TabsContent>
                        <TabsContent value="drafts">
                          <SocialFeedQueue companyId={effectiveCompanyId} initialFilter="pending" />
                        </TabsContent>
                        <TabsContent value="scheduled">
                          <SocialScheduleQueue
                            companyId={effectiveCompanyId}
                            onClose={handleHome}
                          />
                        </TabsContent>
                        <TabsContent value="calendar">
                          <SocialContentCalendar
                            companyId={effectiveCompanyId}
                            onClose={handleHome}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}

                  {/* Content Engine with nested tabs */}
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

            {/* Floating Input */}
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
      </div>
    </Card>
  );
};
