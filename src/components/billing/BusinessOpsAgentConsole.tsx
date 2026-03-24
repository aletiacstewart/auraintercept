import { useState, useRef, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { useBusinessOpsMetrics } from '@/hooks/useConsoleAgentMetrics';
import { useCompanyUptime } from '@/hooks/useCompanyUptime';
import { CyberConsoleLayout } from '@/components/ai/chat/CyberConsoleLayout';
import type { CyberAgent } from '@/components/ai/chat/CyberConsoleLayout';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { AppointmentsManager } from '@/components/appointments/AppointmentsManager';
import { AuraLiveStream } from '@/components/aura/AuraLiveStream';
import { QuotesManager } from '@/components/quotes/QuotesManager';
import { InvoicesManager } from '@/components/invoices/InvoicesManager';
import { LeadsManager } from '@/components/leads';
import { CompaniesManager } from '@/components/businessops/CompaniesManager';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CustomersManager } from '@/components/businessops/CustomersManager';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  FileText, 
  Receipt, 
  Briefcase,
  UserPlus,
  Package,
  Calendar,
  Building2,
  UserCheck,
  UsersRound,
  Activity
} from 'lucide-react';

// Quick actions for Business Operations
const BASE_QUICK_ACTIONS = [
  { id: 'quote', label: 'Quote', icon: FileText, message: 'I need to create a new quote for a customer', featureColor: 'text-feature-quotes' },
  { id: 'invoice', label: 'Invoice', icon: Receipt, message: 'I need to generate an invoice', featureColor: 'text-feature-invoices' },
  { id: 'lead', label: 'Lead', icon: UserPlus, message: 'I need to add a new lead', featureColor: 'text-feature-leads' },
  { id: 'appointments', label: 'Appts', icon: Calendar, message: 'I need to manage appointments', featureColor: 'text-feature-appointments' },
  { id: 'inventory', label: 'Inventory', icon: Package, message: 'Manage inventory items', featureColor: 'text-feature-inventory' },
  { id: 'companies', label: 'Companies', icon: Building2, message: 'Manage companies', featureColor: 'text-feature-platform' },
  { id: 'employees', label: 'Employees', icon: UserCheck, message: 'Manage employees', featureColor: 'text-feature-employees' },
  { id: 'customers', label: 'Customers', icon: UsersRound, message: 'Manage customers', featureColor: 'text-feature-customers' },
];

// Tab configuration - includes quick actions as tabs (top row only, no center grid)
const TABS = [
  { id: 'chat', label: 'Home', icon: Briefcase, featureColor: 'text-feature-platform' },
  { id: 'aura-live', label: 'Aura Live', icon: Activity, featureColor: 'text-feature-ai' },
  ...BASE_QUICK_ACTIONS.map(action => ({ id: action.id, label: action.label, icon: action.icon, featureColor: action.featureColor })),
];

interface BusinessOpsAgentConsoleProps {
  companyId?: string;
}

export const BusinessOpsAgentConsole: React.FC<BusinessOpsAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId, user, userRole } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  const isPlatformAdmin = userRole === 'platform_admin';
  
  const QUICK_ACTIONS = BASE_QUICK_ACTIONS;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('business_finance');
  const [activeFormType, setActiveFormType] = useState<
    'quote' | 'invoice' | 'lead' | 'inventory' | 'appointments' | 'companies' | 'employees' | 'customers' | 'aura-live' | null
  >(null);
  
  // Form visibility states
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showInventoryManager, setShowInventoryManager] = useState(false);
  const [showAppointmentsManager, setShowAppointmentsManager] = useState(false);
  const [showCompaniesManager, setShowCompaniesManager] = useState(false);
  const [showEmployeesManager, setShowEmployeesManager] = useState(false);
  const [showCustomersManager, setShowCustomersManager] = useState(false);
  const [showAuraLive, setShowAuraLive] = useState(false);

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
    initialAgent: 'business_finance',
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
    setShowInventoryManager(false);
    setShowAppointmentsManager(false);
    setShowCompaniesManager(false);
    setShowEmployeesManager(false);
    setShowCustomersManager(false);
    setShowAuraLive(false);
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
      hideAllForms();
      setShowAppointmentsManager(true);
      setActiveFormType('appointments');
      return;
    }
    if (actionId === 'inventory') {
      hideAllForms();
      setShowInventoryManager(true);
      setActiveFormType('inventory');
      return;
    }
    if (actionId === 'companies') {
      hideAllForms();
      setShowCompaniesManager(true);
      setActiveFormType('companies');
      return;
    }
    if (actionId === 'employees') {
      hideAllForms();
      setShowEmployeesManager(true);
      setActiveFormType('employees');
      return;
    }
    if (actionId === 'customers') {
      hideAllForms();
      setShowCustomersManager(true);
      setActiveFormType('customers');
      return;
    }
    if (actionId === 'aura-live') {
      hideAllForms();
      setShowAuraLive(true);
      setActiveFormType('aura-live');
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
    setLastAgent('business_finance');
  };

  const isShowingForm = showQuoteForm || showInvoiceForm || showLeadForm || showInventoryManager || showAppointmentsManager || showCompaniesManager || showEmployeesManager || showCustomersManager || showAuraLive;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type - show "Home" when no form is active
  const getActiveLabel = () => {
    if (activeFormType === 'quote') return 'Quotes';
    if (activeFormType === 'invoice') return 'Invoices';
    if (activeFormType === 'lead') return 'Leads';
    if (activeFormType === 'inventory') return 'Inventory';
    if (activeFormType === 'appointments') return 'Appointments';
    if (activeFormType === 'companies') return 'Companies';
    if (activeFormType === 'employees') return 'Employees';
    if (activeFormType === 'customers') return 'Customers';
    if (activeFormType === 'aura-live') return 'Aura Live';
    if (messages.length > 0) return agentStyle.label; // Show agent label during chat
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  const { data: bopsMetrics } = useBusinessOpsMetrics(effectiveCompanyId);
  const m = bopsMetrics;
  const { companyCreatedAt } = useCompanyUptime(effectiveCompanyId);

  const BOPS_AGENTS: CyberAgent[] = [
    { id: 'business_finance', name: 'Business Finance Agent', description: 'Quotes, invoices & inventory', icon: FileText, hsl: '189,100%,65%', status: 'active', metric1Value: m?.quotesTotal ?? 0, metric1Label: 'Quotes', metric2Value: m?.invoicesPaid ?? 0, metric2Label: 'Invoices Paid' },
    { id: 'admin', name: 'Admin Agent', description: 'Scheduling, staff & operations', icon: Briefcase, hsl: '38,100%,65%', status: 'standby', metric1Value: m?.apptsTotal ?? 0, metric1Label: 'Appts', metric2Value: m?.apptsConfirmed ?? 0, metric2Label: 'Confirmed' },
    { id: 'companies', name: 'Companies Manager', description: 'Manages company accounts', icon: Building2, hsl: '189,100%,55%', status: 'standby', metric1Value: m?.companiesTotal ?? 0, metric1Label: 'Companies', metric2Value: m?.companiesActive ?? 0, metric2Label: 'Active' },
    { id: 'employees', name: 'Employees Manager', description: 'Manages staff & roles', icon: UserCheck, hsl: '48,100%,60%', status: 'standby', metric1Value: m?.employeesTotal ?? 0, metric1Label: 'Staff', metric2Value: m?.employeesActive ?? 0, metric2Label: 'Active' },
    { id: 'customers', name: 'Customers Manager', description: 'Customer profiles & history', icon: UsersRound, hsl: '38,100%,65%', status: 'standby', metric1Value: m?.customersTotal ?? 0, metric1Label: 'Customers', metric2Value: m?.customersNew ?? 0, metric2Label: 'New' },
  ];

  return (
    <CyberConsoleLayout
      logoUrl={company?.logo_url}
      companyName={company?.name || 'Business Mgt Ops Console'}
      agentLabel={activeLabel}
      agentColor={agentStyle.color}
      agentBgColor={agentStyle.bgColor}
      subtitle="Business Mgt Ops — Cyber-Sentry Edition"
      companyCreatedAt={companyCreatedAt}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        setActiveTab(tabId);
        if (tabId !== 'chat') {
          if (tabId === 'aura-live') {
            handleQuickAction('', 'aura-live');
          } else {
            const action = BASE_QUICK_ACTIONS.find(a => a.id === tabId);
            if (action) handleQuickAction(action.message, action.id);
          }
        }
      }}
      onHomeClick={handleHome}
      agents={BOPS_AGENTS}
      currentAgentId={
        activeFormType === 'quote' ? 'quoting' :
        activeFormType === 'invoice' ? 'invoicing' :
        activeFormType === 'lead' ? 'leads' :
        activeFormType === 'inventory' ? 'inventory' :
        activeFormType === 'appointments' ? 'operations' :
        activeFormType === 'companies' ? 'companies' :
        activeFormType === 'employees' ? 'employees' :
        activeFormType === 'customers' ? 'customers' :
        activeFormType === 'aura-live' ? 'operations' :
        currentAgent || lastAgent
      }
      onAgentClick={(agentId) => {
        const AGENT_TO_TAB: Record<string, string> = {
          quoting: 'quote',
          invoicing: 'invoice',
          leads: 'lead',
          operations: 'appointments',
          inventory: 'inventory',
          companies: 'companies',
          employees: 'employees',
          customers: 'customers',
        };
        const tabId = AGENT_TO_TAB[agentId];
        if (tabId) {
          setActiveTab(tabId);
          const action = BASE_QUICK_ACTIONS.find(a => a.id === tabId);
          if (action) handleQuickAction(action.message, action.id);
        }
      }}
      quickActions={QUICK_ACTIONS}
      onQuickAction={handleQuickAction}
      useDefaultLogo={!company?.logo_url}
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          {showWelcome ? (
            <WelcomeScreen
              companyName={company?.name || 'Business Mgt Ops Console'}
              title="Business Mgt Ops Console"
              subtitle="I can help you with quotes, invoices, leads, and business insights. How can I assist you today?"
              actions={QUICK_ACTIONS}
              onAction={handleQuickAction}
              consoleType={isPlatformAdmin ? 'businessops_admin' : 'businessops'}
              showHowToGuide={true}
            />
          ) : (
            <div className="space-y-4">
              {/* Aura Live Stream */}
              {showAuraLive && effectiveCompanyId && (
                <AuraLiveStream companyId={effectiveCompanyId} />
              )}

              {/* Embedded Managers */}
              {showQuoteForm && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <QuotesManager onClose={handleHome} />
                </div>
              )}
              
              {showInvoiceForm && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <InvoicesManager onClose={handleHome} />
                </div>
              )}
              
              {showLeadForm && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <LeadsManager onClose={handleHome} />
                </div>
              )}

              {showInventoryManager && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <InventoryManager />
                </div>
              )}

              {showAppointmentsManager && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <AppointmentsManager onClose={handleHome} />
                </div>
              )}

              {showCompaniesManager && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <CompaniesManager />
                </div>
              )}

              {showEmployeesManager && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <EmployeeManagement />
                </div>
              )}

              {showCustomersManager && (
                <div className="rounded-lg p-4" style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(0,229,255,0.12)' }}>
                  <CustomersManager />
                </div>
              )}
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
    </CyberConsoleLayout>
  );
};
