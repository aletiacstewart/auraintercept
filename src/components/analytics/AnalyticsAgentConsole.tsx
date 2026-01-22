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
import { InsightsReportForm } from './forms/InsightsReportForm';
import { TrendForecastForm } from './forms/TrendForecastForm';
import { KpiDashboardForm } from './forms/KpiDashboardForm';
import { ExportReportForm } from './forms/ExportReportForm';
import { ReminderInsightsForm } from './forms/ReminderInsightsForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Download,
  ShieldAlert,
  Bell,
  Share2
} from 'lucide-react';

// Quick actions for Analytics & Optimization
const QUICK_ACTIONS = [
  { id: 'performance', label: 'Report', icon: BarChart3, message: 'I need a performance report', featureColor: 'text-feature-analytics' },
  { id: 'revenue', label: 'Revenue', icon: DollarSign, message: 'Show me revenue analysis', featureColor: 'text-feature-invoices' },
  { id: 'customers', label: 'Insights', icon: Users, message: 'I need customer insights', featureColor: 'text-feature-customers' },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp, message: 'Show me revenue forecasts', featureColor: 'text-feature-analytics' },
  { id: 'kpi', label: 'KPIs', icon: Target, message: 'Show KPI dashboard', featureColor: 'text-feature-analytics' },
  { id: 'social', label: 'Social', icon: Share2, message: 'Show social media analytics', featureColor: 'text-pink-400' },
  { id: 'reminders', label: 'Reminders', icon: Bell, message: 'Show me reminder analytics', featureColor: 'text-feature-appointments' },
  { id: 'export', label: 'Export', icon: Download, message: 'I need to export a report', featureColor: 'text-feature-overview' },
];

// Tab configuration - includes quick actions as tabs
const TABS = [
  { id: 'chat', label: 'Home', icon: BarChart3, featureColor: 'text-feature-analytics' },
  ...QUICK_ACTIONS.map(action => ({ id: action.id, label: action.label, icon: action.icon, featureColor: action.featureColor })),
];

interface AnalyticsAgentConsoleProps {
  companyId?: string;
  demoMode?: boolean;
}

export const AnalyticsAgentConsole: React.FC<AnalyticsAgentConsoleProps> = ({ companyId: propCompanyId, demoMode = false }) => {
  const { companyId: authCompanyId, userRole, user } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  
  // Role-based access control - only platform_admin and company_admin can access analytics
  // Demo mode bypasses authentication
  const hasAccess = demoMode || userRole === 'platform_admin' || userRole === 'company_admin';
  
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('analytics');
  
  // Form visibility states
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showCustomersForm, setShowCustomersForm] = useState(false);
  const [showInsightsForm, setShowInsightsForm] = useState(false);
  const [showForecastForm, setShowForecastForm] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [showRemindersForm, setShowRemindersForm] = useState(false);
  const [showSocialForm, setShowSocialForm] = useState(false);

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
    initialAgent: 'analytics',
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
    setShowInsightsForm(false);
    setShowForecastForm(false);
    setShowKpiForm(false);
    setShowExportForm(false);
    setShowRemindersForm(false);
    setShowSocialForm(false);
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
    if (actionId === 'insights') {
      hideAllForms();
      setShowInsightsForm(true);
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
    if (actionId === 'reminders') {
      hideAllForms();
      setShowRemindersForm(true);
      return;
    }
    if (actionId === 'social') {
      hideAllForms();
      setShowSocialForm(true);
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
    setLastAgent('analytics');
  };

  const handleAnalyze = async (formType: string, data: Record<string, unknown>) => {
    hideAllForms();
    const dataStr = JSON.stringify(data, null, 2);
    const messages: Record<string, string> = {
      performance: `Analyze this performance data and provide insights: ${dataStr}. What recommendations do you have to improve these metrics?`,
      revenue: `Analyze this revenue data: ${dataStr}. What trends do you see and what opportunities exist to increase revenue?`,
      customers: `Analyze these customer insights: ${dataStr}. What customer segments should we focus on and how can we improve retention?`,
      insights: `Analyze these business insights: ${dataStr}. What key trends and recommendations can you identify?`,
      forecast: `Based on this forecast data: ${dataStr}. What should we prepare for and what actions should we take?`,
      kpi: `Review these KPIs: ${dataStr}. Which ones need immediate attention and what steps can improve them?`,
      reminders: `Analyze this reminder performance data: ${dataStr}. What recommendations do you have to improve delivery rates and customer engagement?`,
      export: `I just exported a ${data.type} report with ${data.count} records. What analysis would be most valuable from this data?`,
    };
    if (messages[formType]) {
      await sendMessage(messages[formType]);
    }
  };

  const isShowingForm = showPerformanceForm || showRevenueForm || showCustomersForm || showInsightsForm || showForecastForm || showKpiForm || showExportForm || showRemindersForm || showSocialForm;
  const showWelcome = messages.length === 0 && !isShowingForm;
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  // Get active label based on form type - show "Home" when no form is active
  const getActiveLabel = () => {
    if (showPerformanceForm) return 'Performance';
    if (showRevenueForm) return 'Revenue';
    if (showCustomersForm) return 'Customers';
    if (showInsightsForm) return 'Insights';
    if (showForecastForm) return 'Forecast';
    if (showKpiForm) return 'KPI';
    if (showRemindersForm) return 'Reminders';
    if (showExportForm) return 'Export';
    if (messages.length > 0) return agentStyle.label; // Show agent label during chat
    return 'Home';
  };
  
  const activeLabel = getActiveLabel();

  // Access denied UI
  if (!hasAccess) {
    return (
      <Card className="h-[600px] flex flex-col overflow-hidden shadow-xl border-slate-600/50 bg-slate-800">
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
    <Card className="h-[600px] flex flex-col overflow-hidden shadow-xl border-border/50 console-surface">
      {/* Glass Header */}
      <GlassHeader
        logoUrl={company?.logo_url}
        companyName={company?.name || 'Analytics & Optimization'}
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
          setActiveTab(tabId);
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
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          {showWelcome ? (
            <WelcomeScreen
              companyName={company?.name || 'Analytics & Optimization'}
              title="Analytics & Optimization"
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
              
              {showInsightsForm && effectiveCompanyId && (
                <InsightsReportForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('insights', data)}
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
              
              {showRemindersForm && effectiveCompanyId && (
                <ReminderInsightsForm
                  companyId={effectiveCompanyId}
                  onCancel={handleHome}
                  onAnalyze={(data) => handleAnalyze('reminders', data)}
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
