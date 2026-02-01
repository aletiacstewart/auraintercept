import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FeedbackForm } from '@/components/ai/FeedbackForm';
import { CampaignForm } from '@/components/marketing/forms/CampaignForm';
import { InvoiceForm } from '@/components/billing/forms/InvoiceForm';
import { BusinessQuoteForm } from '@/components/billing/forms/BusinessQuoteForm';
import { PerformanceReportForm } from '@/components/analytics/forms/PerformanceReportForm';
import { RevenueAnalysisForm } from '@/components/analytics/forms/RevenueAnalysisForm';
import { toast } from 'sonner';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw,
  Terminal,
  Sparkles,
  ArrowRight,
  Phone,
  Clock,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Zap,
  Eye,
  FileText
} from 'lucide-react';

// Agent display names - standardized with AIAgentsHub
const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  campaign: 'Campaign Agent',
  marketing: 'Marketing Agent',
  social_content: 'Social Media Signal Agent',
  social_scheduler: 'Signal Scheduler',
  social_analytics: 'Signal Analytics',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  analytics: 'Analytics Agent',
};

interface NextSteps {
  type: string;
  title: string;
  message: string;
  actions: Array<{ label: string; type: string; value: string }>;
  priority: string;
  estimated_response?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    event_type?: string;
    handoff_to?: string;
    handoff_reason?: string;
    tool_calls?: Array<{ name: string; result: string }>;
    next_steps?: NextSteps;
    current_agent?: string;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentTestConsoleProps {
  agentType: string;
  agentName: string;
  isEnabled: boolean;
  companyId: string | null;
}

const TEST_SCENARIOS: Record<string, Array<{ label: string; message: string }>> = {
  triage: [
    { label: 'New Customer', message: "Hi, I'm interested in your services. Can you help me?" },
    { label: 'Emergency', message: "I have an urgent plumbing issue, water is leaking everywhere!" },
    { label: 'Schedule Request', message: "I'd like to schedule an appointment for next week" },
    { label: 'Price Inquiry', message: "How much does a routine AC maintenance cost?" },
  ],
  booking: [
    { label: 'New Appointment', message: "I'd like to book an appointment for next Tuesday" },
    { label: 'Check Availability', message: "What times are available this Friday afternoon?" },
    { label: 'Reschedule', message: "I need to move my appointment from Monday to Wednesday" },
    { label: 'Cancel', message: "I need to cancel my appointment for tomorrow morning" },
  ],
  followup: [
    { label: 'Leave Feedback', message: "I'd like to leave feedback about my experience" },
  ],
  review: [
    { label: 'Request Review', message: "Could you share your feedback about our service?" },
    { label: 'Positive Feedback', message: "The service was excellent! Very professional team." },
    { label: 'Negative Feedback', message: "I'm disappointed with the service quality. 2 stars." },
    { label: 'Leave Feedback', message: "I want to share my feedback" },
  ],
  dispatch: [
    { label: 'New Job', message: "Need to dispatch a technician for a new HVAC repair job" },
    { label: 'Emergency', message: "Emergency dispatch needed - customer has gas leak" },
    { label: 'Reassign', message: "Need to reassign job #12345 to a different technician" },
  ],
  route: [
    { label: 'Optimize Route', message: "Optimize today's route for technician Mike" },
    { label: 'Add Stop', message: "Add an emergency stop to the current route" },
    { label: 'Traffic Update', message: "Major traffic on Highway 101, need alternate route" },
  ],
  eta: [
    { label: 'Get ETA', message: "What's the current ETA for the technician?" },
    { label: 'Delay Alert', message: "Technician is running 20 minutes behind schedule" },
    { label: 'Almost There', message: "Update: technician is 5 minutes away" },
  ],
  checkin: [
    { label: 'Arrival', message: "Technician has arrived at the job site" },
    { label: 'Job Complete', message: "Work is finished, ready to check out" },
    { label: 'Photo Upload', message: "Need to upload before and after photos" },
  ],
  quoting: [
    { label: 'Generate Quote', message: "I'd like to create a new quote for a customer" },
  ],
  invoice: [
    { label: 'Create Invoice', message: "Create invoice for completed job #J-456" },
    { label: 'Send Reminder', message: "Send payment reminder for invoice #INV-789" },
    { label: 'Process Payment', message: "Customer wants to pay their outstanding invoice" },
  ],
  inventory: [
    { label: 'Check Stock', message: "What's the current stock level for HVAC filters?" },
    { label: 'Low Stock', message: "Generate a low stock alert report" },
    { label: 'Reorder', message: "Place reorder for items below minimum threshold" },
  ],
  warranty: [
    { label: 'Check Coverage', message: "Is my AC unit still under warranty?" },
    { label: 'File Claim', message: "I need to file a warranty claim for a defective part" },
    { label: 'Claim Status', message: "What's the status of my warranty claim #WC-123?" },
  ],
  campaign: [
    { label: 'Create Campaign', message: "I'd like to create a new marketing campaign" },
    { label: 'Promotional', message: "Create a 20% off winter promotion campaign" },
    { label: 'Referral Program', message: "Set up a referral program for happy customers" },
    { label: 'Win-Back', message: "Identify and re-engage customers inactive for 90+ days" },
    { label: 'Seasonal', message: "Plan spring HVAC tune-up reminder campaign" },
  ],
  insights: [
    { label: 'Weekly Report', message: "Generate this week's performance summary" },
    { label: 'Find Anomalies', message: "Are there any unusual patterns in recent data?" },
    { label: 'Recommendations', message: "What should we focus on improving this month?" },
  ],
  forecast: [
    { label: 'Monthly Forecast', message: "Forecast demand for the next month" },
    { label: 'Revenue Projection', message: "Project revenue for the next quarter" },
    { label: 'Staffing Needs', message: "Do we need to adjust staffing levels for next week?" },
  ],
  revenue: [
    { label: 'Revenue Analysis', message: "View revenue analysis report" },
  ],
  performance: [
    { label: 'Company Performance', message: "View company performance report" },
  ],
};

// Helper to extract customer info from conversation history
function extractCustomerInfo(history: ConversationMessage[]): {
  name?: string;
  phone?: string;
  address?: string;
  issue?: string;
  email?: string;
} {
  const allContent = history.map(m => m.content).join('\n');
  
  // Extract name patterns
  const namePatterns = [
    /(?:my name is |i'm |i am |name:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:,?\s*\d{3})/i, // Name followed by phone
  ];
  let name: string | undefined;
  for (const pattern of namePatterns) {
    const match = allContent.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }

  // Extract phone number
  const phoneMatch = allContent.match(/(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
  const phone = phoneMatch?.[0];

  // Extract address (look for street patterns)
  const addressMatch = allContent.match(/(\d+\s+[\w\s]+(?:st|rd|dr|ave|blvd|way|ln|ct|apt|#)[^,\n]*(?:,?\s*[\w\s]+)?(?:,?\s*(?:tx|texas|ca|california|fl|florida|ny|new york)[^,\n]*)?(?:,?\s*\d{5})?)/i);
  const address = addressMatch?.[0]?.trim();

  // Extract email
  const emailMatch = allContent.match(/[\w.-]+@[\w.-]+\.\w+/i);
  const email = emailMatch?.[0];

  // Extract issue description
  const issuePatterns = [
    /(?:ac|a\/c|air conditioner?|hvac|heat|cooling|plumbing|electrical|water)[^.!?\n]*(?:down|broken|not working|leaking|issue|problem|emergency)/i,
    /(?:emergency|urgent)[^.!?\n]*/i,
    /(?:issue|problem):\s*([^.!?\n]+)/i,
  ];
  let issue: string | undefined;
  for (const pattern of issuePatterns) {
    const match = allContent.match(pattern);
    if (match) {
      issue = match[0].trim();
      break;
    }
  }

  return { name, phone, address, issue, email };
}

export function AgentTestConsole({
  agentType: initialAgentType,
  agentName: initialAgentName,
  isEnabled,
  companyId,
}: AgentTestConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeAgent, setActiveAgent] = useState(initialAgentType);
  const [activeAgentName, setActiveAgentName] = useState(initialAgentName);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [performanceView, setPerformanceView] = useState<'team' | 'top_performers' | 'goals' | 'improvements' | 'individual'>('team');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scenarios = TEST_SCENARIOS[initialAgentType] || [];

  // Fetch company review links
  const { data: companyData } = useQuery({
    queryKey: ['company-review-links', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('review_google_url, review_facebook_url, review_yelp_url')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const reviewLinks = [
    companyData?.review_google_url && { platform: 'Google', url: companyData.review_google_url },
    companyData?.review_facebook_url && { platform: 'Facebook', url: companyData.review_facebook_url },
    companyData?.review_yelp_url && { platform: 'Yelp', url: companyData.review_yelp_url },
  ].filter(Boolean) as { platform: string; url: string }[];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset when initial agent changes (navigating to different agent page)
  useEffect(() => {
    setActiveAgent(initialAgentType);
    setActiveAgentName(initialAgentName);
    setMessages([]);
    setConversationHistory([]);
    setShowFeedbackForm(false);
    setShowCampaignForm(false);
    setShowInvoiceForm(false);
    setShowQuoteForm(false);
    setShowPerformanceForm(false);
    setShowRevenueForm(false);
  }, [initialAgentType, initialAgentName]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: crypto.randomUUID(), timestamp: new Date() },
    ]);
  }, []);

  // Handle agent transfer after handoff - now with full customer context
  const handleAgentTransfer = useCallback(async (newAgentType: string, handoffReason: string) => {
    const newAgentName = AGENT_NAMES[newAgentType] || newAgentType;
    
    // Extract customer info collected so far
    const customerInfo = extractCustomerInfo(conversationHistory);
    
    // Show transition message
    setIsTransitioning(true);
    addMessage({
      role: 'system',
      content: `Connecting you to ${newAgentName}...`,
    });

    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // Switch to new agent
    setActiveAgent(newAgentType);
    setActiveAgentName(newAgentName);
    
    // Build rich context message with all customer details
    let contextParts = [`Customer was transferred from ${activeAgent} agent.`, `Reason: ${handoffReason}`];
    
    if (customerInfo.name) contextParts.push(`Customer Name: ${customerInfo.name}`);
    if (customerInfo.phone) contextParts.push(`Phone: ${customerInfo.phone}`);
    if (customerInfo.address) contextParts.push(`Address: ${customerInfo.address}`);
    if (customerInfo.email) contextParts.push(`Email: ${customerInfo.email}`);
    if (customerInfo.issue) contextParts.push(`Issue: ${customerInfo.issue}`);
    
    // Add instruction based on what info is missing
    const hasAllInfo = customerInfo.name && customerInfo.phone && customerInfo.address;
    if (hasAllInfo) {
      contextParts.push(`\nYou have all customer info - DO NOT ask for it again. Proceed to help them immediately.`);
    } else {
      const missing: string[] = [];
      if (!customerInfo.name) missing.push('name');
      if (!customerInfo.phone) missing.push('phone');
      if (!customerInfo.address) missing.push('address');
      contextParts.push(`\nStill need: ${missing.join(', ')}. Ask for missing info only.`);
    }
    
    const contextMessage = `[Context: ${contextParts.join('\n')}]`;
    
    // Pass FULL conversation history to new agent for context continuity
    const fullHistoryForHandoff = [
      ...conversationHistory,
      { role: 'user' as const, content: contextMessage },
    ];
    
    setConversationHistory(fullHistoryForHandoff);
    setIsTransitioning(false);

    // Get introduction from new agent with full context
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agentType: newAgentType,
          message: contextMessage,
          companyId,
          conversationHistory: conversationHistory, // Pass the existing history
          isHandoff: true,
          handoffFrom: activeAgent,
          handoffReason,
          customerInfo, // Pass extracted customer info
        },
      });

      if (error) throw error;

      const responseContent = data.response || `Hello! I'm your ${newAgentName}. I understand you need assistance. How can I help you today?`;
      
      setConversationHistory([
        ...fullHistoryForHandoff,
        { role: 'assistant' as const, content: responseContent },
      ]);

      addMessage({
        role: 'agent',
        content: responseContent,
        metadata: {
          event_type: 'agent_introduction',
          current_agent: newAgentType,
        },
      });
    } catch (error: any) {
      console.error('Agent transfer error:', error);
      addMessage({
        role: 'agent',
        content: `Hello! I'm your ${newAgentName}. I understand you were transferred over. How can I assist you today?`,
        metadata: { current_agent: newAgentType },
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeAgent, companyId, addMessage, conversationHistory]);

  // Internal agents that serve company admins, not customers
  const INTERNAL_AGENTS = ['insights', 'forecast', 'revenue', 'performance', 'analytics', 'admin', 'inventory', 'marketing', 'social_content', 'social_scheduler', 'social_analytics'];
  
  const sendMessage = async (content: string) => {
    if (!content.trim() || !companyId || isTransitioning) return;

    addMessage({ role: 'user', content });
    setInput('');
    setIsLoading(true);

    // Add to conversation history
    const updatedHistory = [...conversationHistory, { role: 'user' as const, content }];
    
    // Check if this is an internal agent
    const isInternalAgent = INTERNAL_AGENTS.includes(activeAgent);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agentType: activeAgent, // Use current active agent, not initial
          message: content,
          companyId,
          conversationHistory: updatedHistory,
          isInternalRequest: isInternalAgent, // Flag for internal agents
        },
      });

      if (error) throw error;

      // Generate a customer-friendly message if none provided (only for customer-facing agents)
      let responseContent = data.response;
      if (!responseContent?.trim() && data.handoff_to && !isInternalAgent) {
        // Generate fallback based on handoff target (only for customer-facing agents)
        const handoffMessages: Record<string, string> = {
          booking: "I understand you'd like to schedule an appointment. Let me connect you with our scheduling specialist who can help find the perfect time for you.",
          dispatch: "I can see this needs immediate attention. Let me connect you with our dispatch team who can get someone out to help you right away.",
          quoting: "You'd like a quote for service. Let me transfer you to our quoting specialist who can provide you with accurate pricing.",
          followup: "Let me connect you with our follow-up team to ensure everything is taken care of.",
          review: "Thank you for your feedback! Let me connect you with our team to help with your review.",
        };
        responseContent = handoffMessages[data.handoff_to] || 
          `I'll connect you with our ${data.handoff_to} specialist who can better assist you with this request.`;
      }
      
      responseContent = responseContent || (isInternalAgent 
        ? "Processing your request..." 
        : "I'm processing your request. How else can I help you?");
      
      // Update conversation history with assistant response
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant' as const, content: responseContent },
      ]);

      addMessage({
        role: 'agent',
        content: responseContent,
        metadata: {
          event_type: data.event_type,
          handoff_to: data.handoff_to,
          handoff_reason: data.handoff_reason,
          tool_calls: data.tool_calls,
          next_steps: data.next_steps,
          current_agent: activeAgent,
        },
      });

      // Handle handoff - transfer chat to new agent
      if (data.handoff_to) {
        setIsLoading(false); // Stop loading before transition
        await handleAgentTransfer(data.handoff_to, data.handoff_reason || 'Customer request');
        return; // Don't continue to finally block since handleAgentTransfer manages loading
      }
    } catch (error: any) {
      console.error('AI Agent error:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to process request';
      if (error?.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error?.message?.includes('credits')) {
        errorMessage = 'AI credits exhausted. Please add credits to continue.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      addMessage({
        role: 'system',
        content: `Error: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action button clicks from Next Steps panel - now context-aware
  const handleActionClick = useCallback((action: { label: string; type: string; value: string }) => {
    // Extract customer info to maintain context
    const customerInfo = extractCustomerInfo(conversationHistory);
    
    if (action.type === 'call') {
      // For call actions, acknowledge context and continue helping
      addMessage({
        role: 'system',
        content: 'Voice call feature: In a live environment, this would initiate an AI voice call. Continuing in chat...',
      });
      
      // Build context-aware message
      let followUpMessage = '';
      if (customerInfo.address && customerInfo.name) {
        followUpMessage = `Please proceed with dispatching someone to ${customerInfo.address} for ${customerInfo.name}. This is urgent.`;
      } else if (customerInfo.issue) {
        followUpMessage = `I need immediate help with my ${customerInfo.issue}. Can you dispatch someone right away?`;
      } else {
        followUpMessage = "I need immediate assistance. Can you help me right away?";
      }
      
      setTimeout(() => {
        sendMessage(followUpMessage);
      }, 500);
    } else if (action.type === 'action') {
      if (action.value === 'show_calendar' || action.value === 'schedule') {
        const serviceContext = customerInfo.issue ? ` for ${customerInfo.issue}` : '';
        sendMessage(`What times are available for an appointment${serviceContext}?`);
      } else if (action.value === 'track_status') {
        sendMessage("Can you give me an update on the technician status and ETA?");
      } else if (action.value === 'view_quote') {
        sendMessage("Can you show me the quote details and breakdown?");
      } else {
        sendMessage(action.label);
      }
    } else if (action.type === 'link') {
      if (action.value.startsWith('http')) {
        window.open(action.value, '_blank');
      }
    }
  }, [addMessage, sendMessage, conversationHistory]);

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setActiveAgent(initialAgentType);
    setActiveAgentName(initialAgentName);
    setShowFeedbackForm(false);
    setShowCampaignForm(false);
    setShowInvoiceForm(false);
    setShowQuoteForm(false);
    setShowPerformanceForm(false);
    setShowRevenueForm(false);
  };

  const handleFeedbackSubmit = async (feedback: { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; note: string; customerName: string; customerPhone: string; serviceDate?: Date }) => {
    if (!companyId) return;
    
    setFeedbackLoading(true);
    try {
      let appointmentId: string | null = null;
      let employeeId: string | null = null;
      let serviceType: string | null = null;

      // Try to find matching appointment by phone and date
      if (feedback.customerPhone) {
        let query = supabase
          .from('appointments')
          .select('id, employee_id, service_type, datetime')
          .eq('company_id', companyId)
          .eq('customer_phone', feedback.customerPhone);

        if (feedback.serviceDate) {
          // Match appointments on the same date
          const startOfDay = new Date(feedback.serviceDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(feedback.serviceDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte('datetime', startOfDay.toISOString())
            .lte('datetime', endOfDay.toISOString());
        }

        const { data: appointments } = await query
          .order('datetime', { ascending: false })
          .limit(1);

        if (appointments && appointments.length > 0) {
          appointmentId = appointments[0].id;
          employeeId = appointments[0].employee_id;
          serviceType = appointments[0].service_type;
        }
      }

      // Save feedback with linked appointment data
      const { error } = await supabase
        .from('customer_feedback')
        .insert({
          company_id: companyId,
          appointment_id: appointmentId,
          employee_id: employeeId,
          service_type: serviceType,
          rating: feedback.rating,
          sentiment: feedback.sentiment,
          feedback_note: feedback.note || null,
          customer_name: feedback.customerName,
          customer_phone: feedback.customerPhone || null,
          source: 'agent_console'
        });

      if (error) throw error;
      
      setShowFeedbackForm(false);
      addMessage({
        role: 'agent',
        content: feedback.sentiment === 'negative' 
          ? `Thank you for sharing your feedback, ${feedback.customerName}. We're sorry to hear about your experience and will use this to improve our services.`
          : `Thank you for your feedback, ${feedback.customerName}! We truly appreciate you taking the time to share your experience with us.`,
        metadata: { current_agent: activeAgent }
      });
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleScenarioClick = (scenario: { label: string; message: string }) => {
    if (scenario.label === 'Leave Feedback') {
      setShowFeedbackForm(true);
    } else if (scenario.label === 'Create Campaign') {
      setShowCampaignForm(true);
    } else if (scenario.label === 'Create Invoice') {
      setShowInvoiceForm(true);
    } else if (scenario.label === 'Generate Quote') {
      setShowQuoteForm(true);
    } else if (scenario.label === 'Company Performance') {
      setPerformanceView('team');
      setShowPerformanceForm(true);
    } else if (scenario.label === 'Revenue Analysis') {
      setShowRevenueForm(true);
    } else {
      sendMessage(scenario.message);
    }
  };

  const handlePerformanceClose = () => {
    setShowPerformanceForm(false);
    addMessage({
      role: 'agent',
      content: `Performance report completed. Would you like to view another report or export this data?`,
      metadata: {
        event_type: 'performance_report_closed',
        current_agent: 'performance',
      },
    });
  };

  const handleRevenueClose = () => {
    setShowRevenueForm(false);
    addMessage({
      role: 'agent',
      content: `Revenue analysis completed. Would you like to view another report or drill down into specific metrics?`,
      metadata: {
        event_type: 'revenue_analysis_closed',
        current_agent: 'revenue',
      },
    });
  };

  const handleCampaignSuccess = (data: { name: string; type: string }) => {
    setShowCampaignForm(false);
    addMessage({
      role: 'agent',
      content: `Great! I've created your ${data.type} campaign "${data.name}". The campaign has been saved as a draft and is ready for your review. Would you like me to help you with anything else?`,
      metadata: {
        event_type: 'campaign_created',
        current_agent: 'campaign',
      },
    });
  };

  const handleInvoiceSuccess = () => {
    setShowInvoiceForm(false);
    addMessage({
      role: 'agent',
      content: `Great! The invoice has been created and sent to the customer. Would you like me to help you with anything else?`,
      metadata: {
        event_type: 'invoice_created',
        current_agent: 'invoice',
      },
    });
  };

  const handleQuoteSuccess = () => {
    setShowQuoteForm(false);
    addMessage({
      role: 'agent',
      content: `Great! The quote has been created successfully. Would you like me to help you with anything else?`,
      metadata: {
        event_type: 'quote_created',
        current_agent: 'quoting',
      },
    });
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Agent Disabled</h3>
          <p className="text-muted-foreground">
            Enable this agent to test its functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Scenarios */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Test Scenarios</CardTitle>
          <CardDescription>Quick test messages for common scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <Button
                key={scenario.label}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleScenarioClick(scenario)}
                disabled={isLoading}
              >
                <Terminal className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{scenario.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Console */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Test Console</CardTitle>
              {activeAgent !== initialAgentType && (
                <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                  <Zap className="h-3 w-3" />
                  Transferred to {AGENT_NAMES[activeAgent] || activeAgent}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Powered by Lovable AI
              </Badge>
            </div>
            <CardDescription>
              {activeAgent !== initialAgentType 
                ? `Now chatting with ${AGENT_NAMES[activeAgent] || activeAgent}` 
                : `Interact with ${initialAgentName} using real AI`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              {messages.length === 0 && !(showFeedbackForm || showCampaignForm || showInvoiceForm || showQuoteForm || showPerformanceForm || showRevenueForm) ? (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Send a message or select a scenario to test the agent</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role !== 'user' && (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'agent'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {message.role === 'agent' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.role === 'agent'
                            ? 'bg-muted'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.metadata && message.metadata.handoff_to && (
                          <div className="mt-3 space-y-3">
                            {/* Next Steps Panel */}
                            {message.metadata.next_steps && (
                              <div className={`rounded-lg p-3 border ${
                                message.metadata.next_steps.priority === 'high' 
                                  ? 'bg-destructive/10 border-destructive/30' 
                                  : 'bg-primary/10 border-primary/30'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {message.metadata.next_steps.priority === 'high' ? (
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  )}
                                  <span className="font-semibold text-sm">
                                    {message.metadata.next_steps.title}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  {message.metadata.next_steps.message}
                                </p>
                                {message.metadata.next_steps.estimated_response && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                    <Clock className="h-3 w-3" />
                                    Expected response: {message.metadata.next_steps.estimated_response}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {message.metadata.next_steps.actions.map((action, i) => (
                                    <Button
                                      key={i}
                                      size="sm"
                                      variant={action.type === 'call' ? 'default' : 'outline'}
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        // Extract customer context from conversation
                                        const customerInfo = extractCustomerInfo(conversationHistory);
                                        
                                        // Build context-aware message based on action type and customer info
                                        let contextMessage = action.label;
                                        if (action.type === 'call' && customerInfo.address) {
                                          contextMessage = `Please dispatch someone to ${customerInfo.address}${customerInfo.name ? ` for ${customerInfo.name}` : ''}`;
                                        } else if (action.type === 'schedule') {
                                          contextMessage = customerInfo.name 
                                            ? `I'd like to schedule an appointment. My name is ${customerInfo.name}${customerInfo.phone ? ` and my phone is ${customerInfo.phone}` : ''}`
                                            : "I'd like to schedule an appointment";
                                        } else if (action.type === 'track') {
                                          contextMessage = customerInfo.phone 
                                            ? `I'd like to track my appointment. My phone number is ${customerInfo.phone}`
                                            : "I'd like to track my appointment status";
                                        } else if (action.type === 'quote') {
                                          contextMessage = customerInfo.issue 
                                            ? `I'd like a quote for: ${customerInfo.issue}`
                                            : "I'd like to get a quote for service";
                                        }
                                        
                                        sendMessage(contextMessage);
                                      }}
                                    >
                                      {action.type === 'call' && <Phone className="h-3 w-3 mr-1" />}
                                      {action.type === 'schedule' && <Calendar className="h-3 w-3 mr-1" />}
                                      {action.type === 'track' && <Eye className="h-3 w-3 mr-1" />}
                                      {action.type === 'quote' && <FileText className="h-3 w-3 mr-1" />}
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs gap-1">
                              <ArrowRight className="h-3 w-3" />
                              Handoff to {message.metadata.handoff_to}: {message.metadata.handoff_reason}
                            </Badge>
                          </div>
                        )}
                        {message.metadata?.tool_calls && (
                          <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                            <span className="font-semibold">Tools:</span>{' '}
                            {message.metadata.tool_calls.join(', ')}
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {showFeedbackForm && (
                    <div className="py-4">
                      <FeedbackForm
                        onSubmit={handleFeedbackSubmit}
                        isLoading={feedbackLoading}
                        reviewLinks={reviewLinks}
                      />
                    </div>
                  )}
                  {showCampaignForm && companyId && (
                    <div className="py-4">
                      <CampaignForm
                        companyId={companyId}
                        onCancel={() => setShowCampaignForm(false)}
                        onSuccess={handleCampaignSuccess}
                      />
                    </div>
                  )}
                  {showInvoiceForm && companyId && (
                    <div className="py-4">
                      <InvoiceForm
                        companyId={companyId}
                        onCancel={() => setShowInvoiceForm(false)}
                        onSuccess={handleInvoiceSuccess}
                        showBackButton={false}
                        mode="direct"
                      />
                    </div>
                  )}
                  {showQuoteForm && companyId && (
                    <div className="py-4">
                      <BusinessQuoteForm
                        companyId={companyId}
                        onCancel={() => setShowQuoteForm(false)}
                        onSuccess={handleQuoteSuccess}
                        showBackButton={false}
                        mode="direct"
                      />
                    </div>
                  )}
                  {showPerformanceForm && companyId && (
                    <div className="py-4">
                      <PerformanceReportForm
                        companyId={companyId}
                        onCancel={handlePerformanceClose}
                        mode="ai"
                        initialView={performanceView}
                      />
                    </div>
                  )}
                  {showRevenueForm && companyId && (
                    <div className="py-4">
                      <RevenueAnalysisForm
                        companyId={companyId}
                        onCancel={handleRevenueClose}
                      />
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <Separator />

            {/* Input */}
            <div className="p-4 flex gap-2">
              <Input
                placeholder="Type a test message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={isLoading}
              />
              <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
