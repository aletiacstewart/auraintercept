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
import { CampaignForm } from './forms/CampaignForm';
import { CustomerSegmentsForm } from './forms/CustomerSegmentsForm';
import { LeadForm } from './forms/LeadForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Megaphone, 
  Users,
  UserPlus,
} from 'lucide-react';

// Quick actions for Marketing & Sales - 3 agents: Campaign, Lead, Marketing (Segments)
const QUICK_ACTIONS = [
  { id: 'campaign', label: 'Campaign', icon: Megaphone, message: 'I need to create a new marketing campaign', featureColor: 'text-feature-marketing' },
  { id: 'leads', label: 'Leads', icon: UserPlus, message: 'Help me manage and qualify leads', featureColor: 'text-feature-leads' },
  { id: 'customers', label: 'Marketing', icon: Users, message: 'Show me customer segments', featureColor: 'text-feature-customers' },
];

// Tab configuration
const TABS = [
  { id: 'chat', label: 'Home', icon: Megaphone, featureColor: 'text-feature-marketing' },
  ...QUICK_ACTIONS.map(action => ({ id: action.id, label: action.label, icon: action.icon, featureColor: action.featureColor })),
];

interface MarketingSalesAgentConsoleProps {
  companyId?: string;
}

export const MarketingSalesAgentConsole: React.FC<MarketingSalesAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId, user } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('marketing');
  
  // Form visibility states
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showLeadsForm, setShowLeadsForm] = useState(false);
  const [showSegmentsForm, setShowSegmentsForm] = useState(false);

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
    initialAgent: 'marketing',
    onAgentChange: (agent) => {
      console.log('[Marketing] Agent changed to:', agent);
      setLastAgent(agent);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hideAllForms = () => {
    setShowCampaignForm(false);
    setShowLeadsForm(false);
    setShowSegmentsForm(false);
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
    if (actionId === 'campaign') {
      hideAllForms();
      setShowCampaignForm(true);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'leads') {
      hideAllForms();
      setShowLeadsForm(true);
      setActiveTab('chat');
      return;
    }
    if (actionId === 'customers') {
      hideAllForms();
      setShowSegmentsForm(true);
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
    setLastAgent('marketing');
  };

  const handleFormSuccess = async (formType: string, data: Record<string, unknown>) => {
    hideAllForms();
    const successMessages: Record<string, string> = {
      campaign: `I just created a new ${data.type} campaign called "${data.name}". Can you help me optimize it and suggest the best channels and messaging?`,
    };
    if (successMessages[formType]) {
      await sendMessage(successMessages[formType]);
    }
  };

  const isShowingForm = showCampaignForm || showLeadsForm || showSegmentsForm;
  const showWelcome = messages.length === 0 && !isShowingForm && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type
  const getActiveLabel = () => {
    if (showCampaignForm) return 'Campaign';
    if (showLeadsForm) return 'Leads';
    if (showSegmentsForm) return 'Marketing';
    if (messages.length > 0) return agentStyle.label;
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-xl border-border/50 console-surface">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Outreach & Sales Ops'}
        agentLabel={activeLabel}
        agentColor={agentStyle.color}
        agentBgColor={agentStyle.bgColor}
        useDefaultLogo={true}
      />

      {/* Tab Navigation */}
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
                  companyName={company?.name || 'Outreach & Sales Ops'}
                  title="Outreach & Sales Ops"
                  subtitle="I can help you with campaigns, promotions, referrals, and lead management. How can I assist you today?"
                  actions={QUICK_ACTIONS}
                  onAction={handleQuickAction}
                  consoleType="marketing"
                />
              ) : (
                <div className="space-y-4">
                  {/* Forms */}
                  {showCampaignForm && effectiveCompanyId && (
                    <CampaignForm
                      companyId={effectiveCompanyId}
                      onCancel={handleHome}
                      onSuccess={(data) => handleFormSuccess('campaign', data)}
                    />
                  )}

                  {showLeadsForm && effectiveCompanyId && (
                    <LeadForm
                      companyId={effectiveCompanyId}
                      onCancel={handleHome}
                      onSuccess={(data) => handleFormSuccess('leads', data)}
                    />
                  )}
                  
                  {showSegmentsForm && effectiveCompanyId && (
                    <CustomerSegmentsForm
                      companyId={effectiveCompanyId}
                      onCancel={handleHome}
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
              placeholder="Ask about campaigns, promos, referrals..."
            />
          </>
        )}
      </div>
    </Card>
  );
};
