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
import { BusinessQuoteForm, BusinessQuoteData } from './forms/BusinessQuoteForm';
import { InvoiceForm, InvoiceFormData } from './forms/InvoiceForm';
import { InventorySearchForm } from './forms/InventorySearchForm';
import { WarrantyForm, WarrantyFormData } from './forms/WarrantyForm';
import { WarrantyLookupForm } from './forms/WarrantyLookupForm';
import { PriceLookupForm } from './forms/PriceLookupForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  FileText, 
  Receipt, 
  Package, 
  Shield, 
  DollarSign, 
  ClipboardList,
  Briefcase
} from 'lucide-react';

// Tab configuration - just Home for this console
const TABS = [
  { id: 'chat', label: 'Home', icon: Briefcase },
];

// Quick actions for Business Operations (removed Parts Lookup - duplicate of Inventory)
const QUICK_ACTIONS = [
  { id: 'quote', label: 'Create Quote', icon: FileText, message: 'I need to create a new quote for a customer' },
  { id: 'invoice', label: 'Generate Invoice', icon: Receipt, message: 'I need to generate an invoice' },
  { id: 'inventory', label: 'Check Inventory', icon: Package, message: 'I need to check inventory levels' },
  { id: 'warranty-check', label: 'Warranty Check', icon: Shield, message: 'I need to check a warranty status' },
  { id: 'warranty-claim', label: 'Warranty Claim', icon: ClipboardList, message: 'I need to file a warranty claim' },
  { id: 'pricing', label: 'Price Lookup', icon: DollarSign, message: 'I need to look up service pricing' },
];

interface BusinessOpsAgentConsoleProps {
  companyId?: string;
}

export const BusinessOpsAgentConsole: React.FC<BusinessOpsAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId, user } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('admin');
  
  // Form visibility states
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showWarrantyForm, setShowWarrantyForm] = useState(false);
  const [showWarrantyLookupForm, setShowWarrantyLookupForm] = useState(false);
  const [showPriceLookupForm, setShowPriceLookupForm] = useState(false);

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
    initialAgent: 'admin',
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
    setShowInventoryForm(false);
    setShowWarrantyForm(false);
    setShowWarrantyLookupForm(false);
    setShowPriceLookupForm(false);
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
      return;
    }
    if (actionId === 'invoice') {
      hideAllForms();
      setShowInvoiceForm(true);
      return;
    }
    if (actionId === 'inventory') {
      hideAllForms();
      setShowInventoryForm(true);
      return;
    }
    if (actionId === 'warranty-claim') {
      hideAllForms();
      setShowWarrantyForm(true);
      return;
    }
    if (actionId === 'warranty-check') {
      hideAllForms();
      setShowWarrantyLookupForm(true);
      return;
    }
    if (actionId === 'pricing') {
      hideAllForms();
      setShowPriceLookupForm(true);
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
    setLastAgent('admin');
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

  const handleWarrantySubmit = async (data: WarrantyFormData) => {
    hideAllForms();
    const channels = [];
    if (data.sendEmail) channels.push('email');
    if (data.sendSms) channels.push('SMS');
    
    const message = `File warranty claim for ${data.customerName}${data.serviceType ? ` regarding ${data.serviceType}` : ''}. Issue: ${data.issueDescription}${data.warrantyDetails ? `. Resolution details: ${data.warrantyDetails}` : ''}. Send confirmation via: ${channels.join(' and ')}.`;
    await sendMessage(message);
  };

  const isShowingForm = showQuoteForm || showInvoiceForm || showInventoryForm || showWarrantyForm || showWarrantyLookupForm || showPriceLookupForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Business Operations'}
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
              companyName={company?.name || 'Business Operations'}
              title="Business Operations"
              subtitle="I can help you with quotes, invoices, inventory, and warranties. How can I assist you today?"
              actions={QUICK_ACTIONS}
              onAction={handleQuickAction}
              consoleType="businessops"
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
              
              {showInventoryForm && effectiveCompanyId && (
                <InventorySearchForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onSelectItem={(item) => {
                    hideAllForms();
                    sendMessage(`Tell me about inventory item: ${item.name} (SKU: ${item.sku || 'N/A'}). Current stock: ${item.quantity}`);
                  }}
                />
              )}
              
              {showWarrantyForm && effectiveCompanyId && (
                <WarrantyForm
                  companyId={effectiveCompanyId}
                  onSubmit={handleWarrantySubmit}
                  onCancel={handleHome}
                  isLoading={isLoading}
                />
              )}
              
              {showWarrantyLookupForm && effectiveCompanyId && (
                <WarrantyLookupForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showPriceLookupForm && effectiveCompanyId && (
                <PriceLookupForm
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
          placeholder="Ask about quotes, invoices, inventory..."
        />
      </div>
    </Card>
  );
};
