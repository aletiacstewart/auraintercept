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
import { PromoCodeForm } from './forms/PromoCodeForm';
import { ReferralForm } from './forms/ReferralForm';
import { WinbackForm } from './forms/WinbackForm';
import { LeadForm } from './forms/LeadForm';
import { CustomerSegmentsForm } from './forms/CustomerSegmentsForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Megaphone, 
  Tag, 
  Users, 
  UserPlus, 
  TrendingUp,
  Gift
} from 'lucide-react';

// Tab configuration
const TABS = [
  { id: 'chat', label: 'Home', icon: Megaphone },
];

// Quick actions for Marketing & Sales
const QUICK_ACTIONS = [
  { id: 'campaign', label: 'Create Campaign', icon: Megaphone, message: 'I need to create a new marketing campaign' },
  { id: 'promo', label: 'Generate Promo', icon: Tag, message: 'I need to generate a promotional code' },
  { id: 'referral', label: 'Referral Program', icon: Gift, message: 'I need to set up a referral' },
  { id: 'winback', label: 'Win-Back Campaign', icon: TrendingUp, message: 'I need to create a win-back campaign' },
  { id: 'lead', label: 'New Lead', icon: UserPlus, message: 'I need to add a new lead' },
  { id: 'customers', label: 'Customer Segments', icon: Users, message: 'Show me customer segments' },
];

interface MarketingSalesAgentConsoleProps {
  companyId?: string;
}

export const MarketingSalesAgentConsole: React.FC<MarketingSalesAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('triage');
  
  // Form visibility states
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [showWinbackForm, setShowWinbackForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
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
    setShowPromoForm(false);
    setShowReferralForm(false);
    setShowWinbackForm(false);
    setShowLeadForm(false);
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
    // Show appropriate form based on action
    if (actionId === 'campaign') {
      hideAllForms();
      setShowCampaignForm(true);
      return;
    }
    if (actionId === 'promo') {
      hideAllForms();
      setShowPromoForm(true);
      return;
    }
    if (actionId === 'referral') {
      hideAllForms();
      setShowReferralForm(true);
      return;
    }
    if (actionId === 'winback') {
      hideAllForms();
      setShowWinbackForm(true);
      return;
    }
    if (actionId === 'lead') {
      hideAllForms();
      setShowLeadForm(true);
      return;
    }
    if (actionId === 'customers') {
      hideAllForms();
      setShowSegmentsForm(true);
      return;
    }
    
    // Default: send message to AI
    hideAllForms();
    await sendMessage(message);
  };

  const handleHome = () => {
    clearMessages();
    hideAllForms();
    setInputValue('');
    setActiveTab('chat');
    setLastAgent('triage');
  };

  const handleFormSuccess = async (formType: string, data: Record<string, unknown>) => {
    hideAllForms();
    const messages: Record<string, string> = {
      campaign: `I just created a new marketing campaign called "${data.name}" (${data.type}). Can you help me optimize it and suggest the best channels and messaging?`,
      promo: `I just created a promo code "${data.code}" for ${data.discount} off. What's the best way to promote this code to maximize conversions?`,
      referral: `I just set up a referral for ${data.referrerName} with code "${data.code}". How can we encourage them to share this with more people?`,
      winback: `I just created a win-back campaign "${data.name}" targeting ${data.targetCount} inactive customers. What strategies work best for re-engaging inactive customers?`,
      lead: `I just added a new lead: ${data.name} from ${data.source}. What's the best nurturing sequence for this type of lead?`,
    };
    if (messages[formType]) {
      await sendMessage(messages[formType]);
    }
  };

  const isShowingForm = showCampaignForm || showPromoForm || showReferralForm || showWinbackForm || showLeadForm || showSegmentsForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Marketing & Sales'}
        agentLabel={agentStyle.label}
        agentColor={agentStyle.color}
        agentBgColor={agentStyle.bgColor}
        useDefaultLogo={true}
      />

      {/* Tab Navigation */}
      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHomeClick={handleHome}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          {showWelcome ? (
            <WelcomeScreen
              companyName={company?.name || 'Marketing & Sales'}
              title="Marketing & Sales"
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
              
              {showPromoForm && effectiveCompanyId && (
                <PromoCodeForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSuccess={(data) => handleFormSuccess('promo', data)}
                />
              )}
              
              {showReferralForm && effectiveCompanyId && (
                <ReferralForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSuccess={(data) => handleFormSuccess('referral', data)}
                />
              )}
              
              {showWinbackForm && effectiveCompanyId && (
                <WinbackForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSuccess={(data) => handleFormSuccess('winback', data)}
                />
              )}
              
              {showLeadForm && effectiveCompanyId && (
                <LeadForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSuccess={(data) => handleFormSuccess('lead', data)}
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
      </div>
    </Card>
  );
};
