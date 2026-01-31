import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { GlassHeader } from '@/components/ai/chat/GlassHeader';
import { MobileTabNav } from '@/components/ai/chat/MobileTabNav';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { AgentHowToGuide } from '@/components/ai/chat/AgentHowToGuide';
import { SocialContentWizard } from './SocialContentWizard';
import { SocialFeedQueue } from '@/components/marketing/SocialFeedQueue';
import { SocialContentCalendar } from './SocialContentCalendar';
import { SocialBatchWizard } from './SocialBatchWizard';
import { SocialScheduleQueue } from './SocialScheduleQueue';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Share2, 
  PenSquare,
  FileText,
  Calendar,
  CalendarDays,
  Sparkles,
  ListChecks,
} from 'lucide-react';

// Quick actions for Social Media Ops - removed Analytics (moved to Analytics console)
const QUICK_ACTIONS = [
  { id: 'create', label: 'New Post', icon: PenSquare, message: 'Create a new social media post', featureColor: 'text-pink-400' },
  { id: 'batch', label: 'Batch Generate', icon: Sparkles, message: 'Generate batch of posts', featureColor: 'text-pink-400' },
  { id: 'queue', label: 'Schedule Queue', icon: ListChecks, message: 'View schedule queue', featureColor: 'text-pink-400' },
  { id: 'drafts', label: 'Drafts', icon: FileText, message: 'Show me pending social media drafts', featureColor: 'text-pink-400' },
  { id: 'scheduled', label: 'Scheduled', icon: Calendar, message: 'Show my scheduled posts', featureColor: 'text-pink-400' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, message: 'Open content calendar', featureColor: 'text-pink-400' },
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
  const [lastAgent, setLastAgent] = useState<string>('social_content');
  
  // Form visibility states
  const [showPostForm, setShowPostForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBatchWizard, setShowBatchWizard] = useState(false);
  const [showScheduleQueue, setShowScheduleQueue] = useState(false);
  
  // Feed filter state
  const [feedFilter, setFeedFilter] = useState<'pending' | 'scheduled'>('pending');

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
    setShowPostForm(false);
    setShowCalendar(false);
    setShowBatchWizard(false);
    setShowScheduleQueue(false);
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
    // Show appropriate form or switch tab based on action
    if (actionId === 'create') {
      hideAllForms();
      setShowPostForm(true);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'batch') {
      hideAllForms();
      setShowBatchWizard(true);
      return;
    }
    if (actionId === 'queue') {
      hideAllForms();
      setShowScheduleQueue(true);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'drafts') {
      hideAllForms();
      setFeedFilter('pending');
      setActiveTab('feed');
      return;
    }
    if (actionId === 'scheduled') {
      hideAllForms();
      setFeedFilter('scheduled');
      setActiveTab('feed');
      return;
    }
    if (actionId === 'calendar') {
      hideAllForms();
      setShowCalendar(true);
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

  const isShowingForm = showPostForm || showCalendar || showScheduleQueue;
  const showWelcome = messages.length === 0 && !isShowingForm && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type
  const getActiveLabel = () => {
    if (activeTab === 'feed') return feedFilter === 'scheduled' ? 'Scheduled Posts' : 'Content Queue';
    if (showPostForm) return 'New Post';
    if (showCalendar) return 'Content Calendar';
    if (showScheduleQueue) return 'Schedule Queue';
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
          if (tabId !== 'chat' && tabId !== 'feed') {
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
        {/* Feed Tab */}
        {activeTab === 'feed' && effectiveCompanyId && (
          <div className="flex-1 overflow-y-auto p-4">
            <SocialFeedQueue companyId={effectiveCompanyId} initialFilter={feedFilter} />
          </div>
        )}

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
                  {/* Forms */}
                  {showPostForm && effectiveCompanyId && (
                    <SocialContentWizard
                      companyId={effectiveCompanyId}
                      onCancel={handleHome}
                      onSuccess={() => {
                        hideAllForms();
                        setFeedFilter('pending');
                        setActiveTab('feed');
                      }}
                    />
                  )}

                  {/* Calendar View */}
                  {showCalendar && effectiveCompanyId && (
                    <SocialContentCalendar
                      companyId={effectiveCompanyId}
                      onClose={handleHome}
                    />
                  )}

                  {/* Schedule Queue View */}
                  {showScheduleQueue && effectiveCompanyId && (
                    <SocialScheduleQueue
                      companyId={effectiveCompanyId}
                      onClose={handleHome}
                    />
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

      {/* Batch Wizard Dialog */}
      <SocialBatchWizard
        open={showBatchWizard}
        onOpenChange={setShowBatchWizard}
        onSuccess={() => {
          setShowBatchWizard(false);
          setShowScheduleQueue(true);
          setActiveTab('chat');
        }}
      />
    </Card>
  );
};
