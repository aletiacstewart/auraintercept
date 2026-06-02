import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { useMarketingMetrics } from '@/hooks/useConsoleAgentMetrics';
import { useCompanyUptime } from '@/hooks/useCompanyUptime';
import { CyberConsoleLayout } from '@/components/ai/chat/CyberConsoleLayout';
import type { CyberAgent } from '@/components/ai/chat/CyberConsoleLayout';
import { FloatingInput } from '@/components/ai/chat/FloatingInput';
import { ChatBubble } from '@/components/ai/chat/ChatBubble';
import { WelcomeScreen } from '@/components/ai/chat/WelcomeScreen';
import { CampaignForm } from './forms/CampaignForm';
import { CustomerSegmentsForm } from './forms/CustomerSegmentsForm';
import { LeadForm } from './forms/LeadForm';
import { getAgentStyle } from '@/lib/agentStyles';
import { Megaphone, UserPlus, Users, Library, Send, Eye, MousePointer, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Quick actions for Outreach & Sales - single consolidated Outreach Operative
const QUICK_ACTIONS = [
  { id: 'campaign', label: 'Campaign', icon: Megaphone, message: 'I need to create a new marketing campaign', featureColor: 'text-feature-marketing' },
  { id: 'library', label: 'Saved Campaigns', icon: Library, message: 'Show my saved campaigns', featureColor: 'text-feature-marketing' },
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
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('chat');
  const [inputValue, setInputValue] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAgent, setLastAgent] = useState<string>('outreach');

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
    initialAgent: 'outreach',
    onAgentChange: (agent) => {
      console.log('[Marketing] Agent changed to:', agent);
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
    setActiveTab('chat');
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string, actionId?: string) => {
    if (actionId && ['campaign', 'library', 'leads', 'customers'].includes(actionId)) {
      setActiveTab(actionId);
      return;
    }
    setActiveTab('chat');
    await sendMessage(message);
  };

  const handleHome = () => {
    clearMessages();
    setInputValue('');
    setActiveTab('chat');
    setLastAgent('outreach');
  };

  const handleFormSuccess = async (formType: string, data: Record<string, unknown>) => {
    // Jump to library so the new campaign is visible immediately
    if (formType === 'campaign') {
      queryClient.invalidateQueries({ queryKey: ['outreach-console-campaigns', effectiveCompanyId] });
      setActiveTab('library');
      return;
    }
    setActiveTab('chat');
    const successMessages: Record<string, string> = {
      campaign: `I just created a new ${data.type} campaign called "${data.name}". Can you help me optimize it and suggest the best channels and messaging?`,
    };
    if (successMessages[formType]) {
      await sendMessage(successMessages[formType]);
    }
  };

  const isShowingForm = activeTab !== 'chat';
  const showWelcome = messages.length === 0 && activeTab === 'chat';
  const agentStyle = getAgentStyle(currentAgent || lastAgent);
  
  const getActiveLabel = () => {
    if (activeTab === 'campaign') return 'Campaign';
    if (activeTab === 'library') return 'Saved Campaigns';
    if (activeTab === 'leads') return 'Leads';
    if (activeTab === 'customers') return 'Marketing';
    if (messages.length > 0) return agentStyle.label;
    return 'Home';
  };

  // Load saved campaigns for the library tab
  const { data: savedCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['outreach-console-campaigns', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId && activeTab === 'library',
  });

  const sendCampaign = async (campaignId: string, name: string) => {
    const ok = window.confirm(
      `Send "${name}" now?\n\nThis dispatches to matching customers via your selected channels (email and/or SMS). Email/SMS usage is billed by your own Resend / SignalWire accounts.`
    );
    if (!ok) return;
    setSendingId(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign', { body: { campaignId } });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const failed = (data as any)?.failed ?? 0;
      toast.success(`Campaign sent: ${sent} delivered${failed ? `, ${failed} failed` : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['outreach-console-campaigns', effectiveCompanyId] });
    } catch (e: any) {
      toast.error('Failed to send campaign: ' + (e?.message || 'unknown error'));
    } finally {
      setSendingId(null);
    }
  };
  
  const activeLabel = getActiveLabel();

  const { data: mktMetrics } = useMarketingMetrics(effectiveCompanyId);
  const mm = mktMetrics;
  const { companyCreatedAt } = useCompanyUptime(effectiveCompanyId);

  const MARKETING_AGENTS: CyberAgent[] = [
    { id: 'outreach', name: 'Outreach Agent', description: 'Campaigns, leads & marketing segmentation', icon: Megaphone, hsl: '292,100%,70%', status: 'active', metric1Value: mm?.campaignsTotal ?? 0, metric1Label: 'Campaigns', metric2Value: mm?.campaignsActive ?? 0, metric2Label: 'Active' },
  ];

  return (
    <CyberConsoleLayout
      logoUrl={company?.logo_url}
      companyName={company?.name || 'Outreach & Sales Console'}
      agentLabel={activeLabel}
      agentColor={agentStyle.color}
      agentBgColor={agentStyle.bgColor}
      subtitle="Outreach & Sales Ops — Cyber-Sentry Edition"
      companyCreatedAt={companyCreatedAt}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      onHomeClick={handleHome}
      agents={MARKETING_AGENTS}
      currentAgentId="outreach"
      onAgentClick={() => setActiveTab('campaign')}
      quickActions={QUICK_ACTIONS}
      onQuickAction={handleQuickAction}
      useDefaultLogo={true}
    >
      {/* Form Tabs */}
      {activeTab !== 'chat' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!effectiveCompanyId ? (
            <div className="max-w-md mx-auto text-center py-12 text-sm text-muted-foreground">
              Sign in to a company workspace to use this form.
            </div>
          ) : activeTab === 'campaign' ? (
            <CampaignForm
              companyId={effectiveCompanyId}
              onCancel={handleHome}
              onSuccess={(data) => handleFormSuccess('campaign', data)}
            />
          ) : activeTab === 'library' ? (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Saved Campaigns</h2>
                  <p className="text-xs text-muted-foreground">Review, resend, and track every campaign you've created.</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('campaign')}>
                  <Megaphone className="h-3.5 w-3.5 mr-1.5" />New Campaign
                </Button>
              </div>
              {campaignsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading campaigns…</p>
              ) : !savedCampaigns || savedCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="font-medium">No campaigns yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first campaign and it will appear here.</p>
                    <Button size="sm" onClick={() => setActiveTab('campaign')}>Create Campaign</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {savedCampaigns.map((c: any) => {
                    const openRate = c.total_sent > 0 ? ((c.total_opened || 0) / c.total_sent * 100).toFixed(1) : '0.0';
                    const clickRate = c.total_sent > 0 ? ((c.total_clicked || 0) / c.total_sent * 100).toFixed(1) : '0.0';
                    return (
                      <Card key={c.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium truncate">{c.name}</h3>
                                <Badge variant="outline" className="capitalize">{c.status}</Badge>
                                {(c.channels || []).includes('email') && <Mail className="h-3 w-3 text-muted-foreground" />}
                                {(c.channels || []).includes('sms') && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {c.campaign_type} • {c.target_segment} • Created {format(new Date(c.created_at), 'MMM d, yyyy')}
                                {c.last_sent_at ? ` • Last sent ${format(new Date(c.last_sent_at), 'MMM d, h:mm a')}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-xs">
                            <div><p className="text-muted-foreground">Sent</p><p className="font-medium text-sm">{c.total_sent || 0}</p></div>
                            <div><p className="text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />Opens</p><p className="font-medium text-sm">{c.total_opened || 0} <span className="text-muted-foreground">({openRate}%)</span></p></div>
                            <div><p className="text-muted-foreground flex items-center gap-1"><MousePointer className="h-3 w-3" />Clicks</p><p className="font-medium text-sm">{c.total_clicked || 0} <span className="text-muted-foreground">({clickRate}%)</span></p></div>
                            <div><p className="text-muted-foreground">Converts</p><p className="font-medium text-sm">{c.total_converted || 0}</p></div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => sendCampaign(c.id, c.name)} disabled={sendingId === c.id || !(c.channels?.length)}>
                              {sendingId === c.id ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Sending…</> : <><Send className="mr-1.5 h-3.5 w-3.5" />{c.status === 'draft' ? 'Send Now' : 'Send Again'}</>}
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/dashboard/campaigns/${c.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'leads' ? (
            <LeadForm
              companyId={effectiveCompanyId}
              onCancel={handleHome}
              onSuccess={(data) => handleFormSuccess('leads', data)}
            />
          ) : activeTab === 'customers' ? (
            <CustomerSegmentsForm
              companyId={effectiveCompanyId}
              onCancel={handleHome}
            />
          ) : null}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
            {showWelcome ? (
              <WelcomeScreen
                companyName={company?.name || 'Outreach & Sales Console'}
                title="Outreach & Sales Console"
                subtitle="I can help you with campaigns, promotions, referrals, and lead management. How can I assist you today?"
                actions={QUICK_ACTIONS}
                onAction={handleQuickAction}
                consoleType="marketing"
              />
            ) : (
              <div className="space-y-4">
                {/* Chat Messages */}
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
            placeholder="Ask about campaigns, promos, referrals..."
          />
        </>
      )}
    </CyberConsoleLayout>
  );
};
