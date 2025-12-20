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
import { PerformanceReportForm } from './forms/PerformanceReportForm';
import { RevenueAnalysisForm } from './forms/RevenueAnalysisForm';
import { CustomerInsightsForm } from './forms/CustomerInsightsForm';
import { TrendForecastForm } from './forms/TrendForecastForm';
import { KpiDashboardForm } from './forms/KpiDashboardForm';
import { ExportReportForm } from './forms/ExportReportForm';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Download
} from 'lucide-react';

// Tab configuration
const TABS = [
  { id: 'chat', label: 'Home', icon: BarChart3 },
];

// Quick actions for Analytics & Insights
const QUICK_ACTIONS = [
  { id: 'performance', label: 'Performance Report', icon: BarChart3, message: 'I need a performance report' },
  { id: 'revenue', label: 'Revenue Analysis', icon: DollarSign, message: 'Show me revenue analysis' },
  { id: 'customers', label: 'Customer Insights', icon: Users, message: 'I need customer insights' },
  { id: 'forecast', label: 'Trend Forecast', icon: TrendingUp, message: 'Show me trend forecasts' },
  { id: 'kpi', label: 'KPI Dashboard', icon: Target, message: 'Show KPI dashboard' },
  { id: 'export', label: 'Export Report', icon: Download, message: 'I need to export a report' },
];

// Agent styling
const getAgentStyle = (agent: string) => {
  const styles: Record<string, { label: string; color: string; bgColor: string }> = {
    triage: { label: 'Triage', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    insights: { label: 'Insights', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    forecast: { label: 'Forecast', color: 'text-teal-700', bgColor: 'bg-teal-100' },
    revenue: { label: 'Revenue', color: 'text-green-700', bgColor: 'bg-green-100' },
    performance: { label: 'Performance', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  };
  return styles[agent] || styles.triage;
};

interface AnalyticsAgentConsoleProps {
  companyId?: string;
}

export const AnalyticsAgentConsole: React.FC<AnalyticsAgentConsoleProps> = ({ companyId: propCompanyId }) => {
  const { companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('triage');
  
  // Form visibility states
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showCustomersForm, setShowCustomersForm] = useState(false);
  const [showForecastForm, setShowForecastForm] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);

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
      console.log('[Analytics] Agent changed to:', agent);
      setLastAgent(agent);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hideAllForms = () => {
    setShowPerformanceForm(false);
    setShowRevenueForm(false);
    setShowCustomersForm(false);
    setShowForecastForm(false);
    setShowKpiForm(false);
    setShowExportForm(false);
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
    if (actionId === 'performance') {
      hideAllForms();
      setShowPerformanceForm(true);
      return;
    }
    if (actionId === 'revenue') {
      hideAllForms();
      setShowRevenueForm(true);
      return;
    }
    if (actionId === 'customers') {
      hideAllForms();
      setShowCustomersForm(true);
      return;
    }
    if (actionId === 'forecast') {
      hideAllForms();
      setShowForecastForm(true);
      return;
    }
    if (actionId === 'kpi') {
      hideAllForms();
      setShowKpiForm(true);
      return;
    }
    if (actionId === 'export') {
      hideAllForms();
      setShowExportForm(true);
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

  const isShowingForm = showPerformanceForm || showRevenueForm || showCustomersForm || showForecastForm || showKpiForm || showExportForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Analytics & Insights'}
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
              companyName={company?.name || 'Analytics & Insights'}
              title="Analytics & Insights"
              subtitle="I can help you with performance reports, revenue analysis, customer insights, and forecasting. What would you like to explore?"
              actions={QUICK_ACTIONS}
              onAction={handleQuickAction}
            />
          ) : (
            <div className="space-y-4">
              {/* Forms */}
              {showPerformanceForm && effectiveCompanyId && (
                <PerformanceReportForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showRevenueForm && effectiveCompanyId && (
                <RevenueAnalysisForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showCustomersForm && effectiveCompanyId && (
                <CustomerInsightsForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showForecastForm && effectiveCompanyId && (
                <TrendForecastForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showKpiForm && effectiveCompanyId && (
                <KpiDashboardForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                />
              )}
              
              {showExportForm && effectiveCompanyId && (
                <ExportReportForm
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
          placeholder="Ask about metrics, trends, forecasts..."
        />
      </div>
    </Card>
  );
};
