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
import { 
  FileText, 
  Receipt, 
  Package, 
  Shield, 
  DollarSign, 
  Search, 
  HelpCircle,
  ClipboardList,
  Briefcase
} from 'lucide-react';

// Tab configuration - just Home for this console
const TABS = [
  { id: 'chat', label: 'Home', icon: Briefcase },
];

// Quick actions for Business Operations
const QUICK_ACTIONS = [
  { id: 'quote', label: 'Create Quote', icon: FileText, message: 'I need to create a new quote for a customer' },
  { id: 'invoice', label: 'Generate Invoice', icon: Receipt, message: 'I need to generate an invoice' },
  { id: 'inventory', label: 'Check Inventory', icon: Package, message: 'I need to check inventory levels' },
  { id: 'warranty-check', label: 'Warranty Check', icon: Shield, message: 'I need to check a warranty status' },
  { id: 'warranty-claim', label: 'Warranty Claim', icon: ClipboardList, message: 'I need to file a warranty claim' },
  { id: 'parts', label: 'Parts Lookup', icon: Search, message: 'I need to look up parts in inventory' },
  { id: 'pricing', label: 'Price Lookup', icon: DollarSign, message: 'I need to look up service pricing' },
  { id: 'help', label: 'Billing Help', icon: HelpCircle, message: 'I have a question about billing' },
];

// Agent styling
const getAgentStyle = (agent: string) => {
  const styles: Record<string, { label: string; color: string; bgColor: string }> = {
    triage: { label: 'Triage', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    quoting: { label: 'Quoting', color: 'text-green-700', bgColor: 'bg-green-100' },
    invoice: { label: 'Invoice', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    inventory: { label: 'Inventory', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    warranty: { label: 'Warranty', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  };
  return styles[agent] || styles.triage;
};

interface BusinessOpsAgentConsoleProps {
  companyId?: string;
}

export const BusinessOpsAgentConsole: React.FC<BusinessOpsAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('triage');

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
      console.log('[BusinessOps] Agent changed to:', agent);
      setLastAgent(agent);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string) => {
    await sendMessage(message);
  };

  const handleHome = () => {
    clearMessages();
    setInputValue('');
    setActiveTab('chat');
    setLastAgent('triage');
  };

  const showWelcome = messages.length === 0;
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
            />
          ) : (
            <div className="space-y-4">
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
