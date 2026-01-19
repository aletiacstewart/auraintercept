import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuraCommandBar } from '@/components/aura/AuraCommandBar';
import { AuraCommandModal } from '@/components/aura/AuraCommandModal';
import { AuraTabs } from '@/components/aura/AuraTabs';
import { AuraSummary } from '@/components/aura/AuraSummary';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { useAuraCommand } from '@/hooks/useAuraCommand';
import { parseAuraQuery, getTabFromIntent } from '@/lib/auraQueryParser';
import { getAgentStyle } from '@/lib/agentStyles';
import { Sparkles, ShieldAlert } from 'lucide-react';

export default function AskAura() {
  const { companyId, userRole, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('revenue');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get query from URL if present
  const urlQuery = searchParams.get('q') || '';

  // Role-based access
  const hasAccess = userRole === 'platform_admin' || userRole === 'company_admin';

  // Multi-agent chat hook
  const { messages, isLoading, currentAgent, sendMessage, clearMessages } = useMultiAgentChat({
    companyId: companyId || undefined,
    userId: user?.id,
    initialAgent: 'analytics',
  });

  // Global command modal
  const {
    isOpen: isModalOpen,
    query: modalQuery,
    setQuery: setModalQuery,
    close: closeModal,
    submitQuery,
  } = useAuraCommand();

  // Process URL query on mount
  useEffect(() => {
    if (urlQuery && messages.length === 0 && companyId) {
      // Parse the query to determine intent
      const parsed = parseAuraQuery(urlQuery);
      setActiveTab(getTabFromIntent(parsed.intent));
      
      // Send the message
      sendMessage(urlQuery);
      
      // Clear the URL param
      setSearchParams({});
    }
  }, [urlQuery, messages.length, companyId, sendMessage, setSearchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading || !companyId) return;
    
    // Parse query and update tab
    const parsed = parseAuraQuery(query);
    setActiveTab(getTabFromIntent(parsed.intent));
    
    setInputValue('');
    await sendMessage(query);
  };

  const handleAnalyze = async (type: string, data: Record<string, unknown>) => {
    const dataStr = JSON.stringify(data, null, 2);
    const messages: Record<string, string> = {
      revenue: `Analyze this revenue data: ${dataStr}. What trends and opportunities do you see?`,
      performance: `Analyze this performance data: ${dataStr}. Who are the top performers and what can be improved?`,
      insights: `Analyze these business insights: ${dataStr}. What key recommendations do you have?`,
      customers: `Analyze these customer insights: ${dataStr}. What customer segments should we focus on?`,
      kpi: `Review these KPIs: ${dataStr}. Which metrics need attention?`,
      forecast: `Based on this forecast data: ${dataStr}. What should we prepare for?`,
    };
    
    if (messages[type]) {
      await sendMessage(messages[type]);
    }
  };

  const agentStyle = getAgentStyle(currentAgent || 'analytics');

  // Access denied
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to access Analytics & Reports. 
                This feature is available to Company and Platform Administrators only.
              </AlertDescription>
            </Alert>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Sparkles}
            title="Analytics & Reports"
            description="Your AI-powered analytics assistant. Ask anything about your business data."
            showAuraBar
          />

          {/* Command Bar */}
          <AuraCommandBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            autoFocus
          />

          {/* Chat Messages */}
          {messages.length > 0 && (
            <Card className="bg-card border-border p-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
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
                  <AuraSummary content="" isLoading />
                )}
                <div ref={messagesEndRef} />
              </div>
            </Card>
          )}

          {/* Tabbed Content */}
          {companyId && (
            <AuraTabs
              companyId={companyId}
              defaultTab={activeTab}
              onAnalyze={handleAnalyze}
            />
          )}
        </div>
      </PageContainer>

      {/* Global Command Modal */}
      <AuraCommandModal
        open={isModalOpen}
        onOpenChange={(open) => !open && closeModal()}
        query={modalQuery}
        onQueryChange={setModalQuery}
        onSubmit={submitQuery}
      />
    </DashboardLayout>
  );
}
