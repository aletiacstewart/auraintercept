import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Download,
  ShieldAlert
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

interface AnalyticsAgentConsoleProps {
  companyId?: string;
  demoMode?: boolean;
}

export const AnalyticsAgentConsole: React.FC<AnalyticsAgentConsoleProps> = ({ companyId: propCompanyId, demoMode = false }) => {
  const { companyId: authCompanyId, userRole } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  // Role-based access control - only platform_admin and company_admin can access analytics
  // Demo mode bypasses authentication
  const hasAccess = demoMode || userRole === 'platform_admin' || userRole === 'company_admin';
  
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

  const handleAnalyze = async (formType: string, data: Record<string, unknown>) => {
    hideAllForms();
    const dataStr = JSON.stringify(data, null, 2);
    const messages: Record<string, string> = {
      performance: `Analyze this performance data and provide insights: ${dataStr}. What recommendations do you have to improve these metrics?`,
      revenue: `Analyze this revenue data: ${dataStr}. What trends do you see and what opportunities exist to increase revenue?`,
      customers: `Analyze these customer insights: ${dataStr}. What customer segments should we focus on and how can we improve retention?`,
      forecast: `Based on this forecast data: ${dataStr}. What should we prepare for and what actions should we take?`,
      kpi: `Review these KPIs: ${dataStr}. Which ones need immediate attention and what steps can improve them?`,
      export: `I just exported a ${data.type} report with ${data.count} records. What analysis would be most valuable from this data?`,
    };
    if (messages[formType]) {
      await sendMessage(messages[formType]);
    }
  };

  const isShowingForm = showPerformanceForm || showRevenueForm || showCustomersForm || showForecastForm || showKpiForm || showExportForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);

  // Access denied UI
  if (!hasAccess) {
    return (
      <Card className="h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert variant="destructive" className="max-w-md">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the Analytics console. 
              This feature is available to Company Administrators and Platform Administrators only.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Analytics & Insights'}
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
              companyName={company?.name || 'Analytics & Insights'}
              title="Analytics & Insights"
              subtitle="I can help you with performance reports, revenue analysis, customer insights, and forecasting. What would you like to explore?"
              actions={QUICK_ACTIONS}
              onAction={handleQuickAction}
              consoleType="analytics"
            />
          ) : (
            <div className="space-y-4">
              {/* Forms */}
              {showPerformanceForm && effectiveCompanyId && (
                <PerformanceReportForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('performance', data)}
                />
              )}
              
              {showRevenueForm && effectiveCompanyId && (
                <RevenueAnalysisForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('revenue', data)}
                />
              )}
              
              {showCustomersForm && effectiveCompanyId && (
                <CustomerInsightsForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('customers', data)}
                />
              )}
              
              {showForecastForm && effectiveCompanyId && (
                <TrendForecastForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onForecast={(data) => handleAnalyze('forecast', data)}
                />
              )}
              
              {showKpiForm && effectiveCompanyId && (
                <KpiDashboardForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('kpi', data)}
                />
              )}
              
              {showExportForm && effectiveCompanyId && (
                <ExportReportForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onExport={(data) => handleAnalyze('export', data)}
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
