import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { BusinessQuoteForm, BusinessQuoteData } from './forms/BusinessQuoteForm';
import { InvoiceForm, InvoiceFormData } from './forms/InvoiceForm';
import { LeadForm } from '@/components/marketing/forms/LeadForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  FileText, 
  Receipt, 
  Briefcase,
  UserPlus,
  Package,
  Shield,
  Calendar
} from 'lucide-react';

// Tab configuration - just Home for this console
const TABS = [
  { id: 'chat', label: 'Home', icon: Briefcase },
];

// Quick actions for Business Operations
const BASE_QUICK_ACTIONS = [
  { id: 'quote', label: 'Create Quote', icon: FileText, message: 'I need to create a new quote for a customer' },
  { id: 'invoice', label: 'Generate Invoice', icon: Receipt, message: 'I need to generate an invoice' },
  { id: 'lead', label: 'New Lead', icon: UserPlus, message: 'I need to add a new lead' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, message: 'I need to manage appointments' },
  { id: 'inventory', label: 'Inventory', icon: Package, message: 'Manage inventory items' },
  { id: 'warranties', label: 'Warranties', icon: Shield, message: 'Manage warranties' },
];

interface BusinessOpsAgentConsoleProps {
  companyId?: string;
}

export const BusinessOpsAgentConsole: React.FC<BusinessOpsAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId, user, userRole } = useAuth();
  const navigate = useNavigate();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  const isPlatformAdmin = userRole === 'platform_admin';
  
  const QUICK_ACTIONS = BASE_QUICK_ACTIONS;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('quoting');
  const [activeFormType, setActiveFormType] = useState<
    'quote' | 'invoice' | 'lead' | null
  >(null);
  
  // Form visibility states
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

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
    initialAgent: 'quoting',
    onAgentChange: (agent) => {
      console.log('[BusinessOps] Agent changed to:', agent);
      setLastAgent(agent);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hideAllForms = () => {
    setShowQuoteForm(false);
    setShowInvoiceForm(false);
    setShowLeadForm(false);
    setActiveFormType(null);
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
    if (actionId === 'quote') {
      hideAllForms();
      setShowQuoteForm(true);
      setActiveFormType('quote');
      return;
    }
    if (actionId === 'invoice') {
      hideAllForms();
      setShowInvoiceForm(true);
      setActiveFormType('invoice');
      return;
    }
    if (actionId === 'lead') {
      hideAllForms();
      setShowLeadForm(true);
      setActiveFormType('lead');
      return;
    }
    if (actionId === 'appointments') {
      navigate('/dashboard/appointments');
      return;
    }
    if (actionId === 'inventory') {
      navigate('/dashboard/inventory');
      return;
    }
    if (actionId === 'warranties') {
      navigate('/dashboard/warranties');
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
    setLastAgent('quoting');
  };

  // Form submission handlers
  const handleQuoteSubmit = async (data: BusinessQuoteData) => {
    hideAllForms();
    const channels = [];
    if (data.sendEmail) channels.push('email');
    if (data.sendSms) channels.push('SMS');
    
    const message = `Create a quote for ${data.customerName}. Phone: ${data.customerPhone}${data.customerEmail ? `, Email: ${data.customerEmail}` : ''}${data.customerAddress ? `, Address: ${data.customerAddress}` : ''}. Services requested: ${data.selectedServices.length} services selected.${data.issueDescription ? ` Notes: ${data.issueDescription}` : ''} Send via: ${channels.join(' and ')}.`;
    await sendMessage(message);
  };

  const handleInvoiceSubmit = async (data: InvoiceFormData) => {
    hideAllForms();
    const channels = [];
    if (data.sendEmail) channels.push('email');
    if (data.sendSms) channels.push('SMS');
    
    const message = `Generate invoice for ${data.customerName}. Amount: $${data.amount}${data.serviceType ? `, Service: ${data.serviceType}` : ''}${data.customerPhone ? `, Phone: ${data.customerPhone}` : ''}${data.customerEmail ? `, Email: ${data.customerEmail}` : ''}${data.notes ? `. Notes: ${data.notes}` : ''}. Send via: ${channels.join(' and ')}.`;
    await sendMessage(message);
  };

  const handleLeadSuccess = async (data: { name: string; source: string }) => {
    hideAllForms();
    const message = `I just added a new lead: ${data.name} from ${data.source}. What's the best follow-up approach for this type of lead?`;
    await sendMessage(message);
  };

  const isShowingForm = showQuoteForm || showInvoiceForm || showLeadForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type - show "Home" when no form is active
  const getActiveLabel = () => {
    if (activeFormType === 'quote') return 'Quoting';
    if (activeFormType === 'invoice') return 'Invoicing';
    if (activeFormType === 'lead') return 'Lead Capture';
    if (messages.length > 0) return agentStyle.label; // Show agent label during chat
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-xl border-slate-600/50 bg-slate-800">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Business Management Ops'}
        agentLabel={activeLabel}
        agentColor={agentStyle.color}
        agentBgColor={agentStyle.bgColor}
        useDefaultLogo={!company?.logo_url}
      />

      {/* Tab Navigation */}
      <MobileTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHomeClick={handleHome}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative console-surface"> 
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          {showWelcome ? (
            <WelcomeScreen
              companyName={company?.name || 'Business Management Ops'}
              title="Business Management Ops"
              subtitle="I can help you with quotes, invoices, leads, and business insights. How can I assist you today?"
              actions={QUICK_ACTIONS}
              onAction={handleQuickAction}
              consoleType={isPlatformAdmin ? 'businessops_admin' : 'businessops'}
            />
          ) : (
            <div className="space-y-4">
              {/* Forms */}
              {showQuoteForm && effectiveCompanyId && (
                <BusinessQuoteForm
                  companyId={effectiveCompanyId}
                  onSubmit={handleQuoteSubmit}
                  onCancel={handleHome}
                  isLoading={isLoading}
                />
              )}
              
              {showInvoiceForm && effectiveCompanyId && (
                <InvoiceForm
                  companyId={effectiveCompanyId}
                  onSubmit={handleInvoiceSubmit}
                  onCancel={handleHome}
                  isLoading={isLoading}
                />
              )}
              
              {showLeadForm && effectiveCompanyId && (
                <LeadForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSuccess={handleLeadSuccess}
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
          placeholder="Ask about quotes or invoices..."
        />
      </div>
    </Card>
  );
};
