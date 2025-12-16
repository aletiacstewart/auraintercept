import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
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
  Zap
} from 'lucide-react';

// Agent display names
const AGENT_NAMES: Record<string, string> = {
  triage: 'Triage Specialist',
  booking: 'Booking Specialist',
  dispatch: 'Emergency Dispatch',
  quoting: 'Quote Specialist',
  followup: 'Follow-up Specialist',
  review: 'Review Specialist',
  route: 'Route Optimizer',
  eta: 'ETA Specialist',
  checkin: 'Check-in Specialist',
  invoice: 'Billing Specialist',
  inventory: 'Inventory Specialist',
  warranty: 'Warranty Specialist',
  promo: 'Promotions Specialist',
  referral: 'Referral Specialist',
  winback: 'Win-back Specialist',
  seasonal: 'Seasonal Campaign Specialist',
  insights: 'Insights Analyst',
  forecast: 'Forecast Analyst',
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
    { label: 'After Service', message: "The technician just left. Following up on the service." },
    { label: 'Satisfaction Check', message: "How would you rate your recent service experience?" },
    { label: 'Issue Report', message: "The issue came back after the technician left yesterday" },
  ],
  review: [
    { label: 'Request Review', message: "Could you share your feedback about our service?" },
    { label: 'Positive Feedback', message: "The service was excellent! Very professional team." },
    { label: 'Negative Feedback', message: "I'm disappointed with the service quality. 2 stars." },
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
    { label: 'Generate Quote', message: "Generate a quote for AC compressor replacement" },
    { label: 'Custom Quote', message: "Need a custom quote with labor and parts breakdown" },
    { label: 'Quote Follow-up', message: "Following up on quote #Q-123 sent last week" },
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
  promo: [
    { label: 'Create Campaign', message: "Create a 20% off winter promotion campaign" },
    { label: 'Target Segment', message: "Send promo to customers inactive for 60+ days" },
    { label: 'Check Results', message: "Show performance of last month's promotion" },
  ],
  referral: [
    { label: 'Generate Link', message: "Generate a referral link for a happy customer" },
    { label: 'Track Referral', message: "Check status of referral from customer John" },
    { label: 'Process Reward', message: "Process referral reward for successful signup" },
  ],
  winback: [
    { label: 'Find Churned', message: "Identify customers inactive for 90+ days" },
    { label: 'Send Offer', message: "Send win-back offer with 15% discount" },
    { label: 'Campaign Status', message: "Show results of the current win-back campaign" },
  ],
  seasonal: [
    { label: 'Plan Campaign', message: "Plan spring HVAC tune-up reminder campaign" },
    { label: 'Send Reminders', message: "Send seasonal maintenance reminders to customers" },
    { label: 'Weather Trigger', message: "Cold front coming - trigger heating service campaign" },
  ],
  insights: [
    { label: 'Weekly Report', message: "Generate this week's performance summary" },
    { label: 'Find Anomalies', message: "Are there any unusual patterns in recent data?" },
    { label: 'Recommendations', message: "What should we focus on improving this month?" },
  ],
  forecast: [
    { label: '30 Day Forecast', message: "Forecast demand for the next 30 days" },
    { label: 'Revenue Projection', message: "Project revenue for the next quarter" },
    { label: 'Staffing Needs', message: "Do we need to adjust staffing levels?" },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const scenarios = TEST_SCENARIOS[initialAgentType] || [];

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

  const sendMessage = async (content: string) => {
    if (!content.trim() || !companyId || isTransitioning) return;

    addMessage({ role: 'user', content });
    setInput('');
    setIsLoading(true);

    // Add to conversation history
    const updatedHistory = [...conversationHistory, { role: 'user' as const, content }];

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agentType: activeAgent, // Use current active agent, not initial
          message: content,
          companyId,
          conversationHistory: updatedHistory,
        },
      });

      if (error) throw error;

      // Generate a customer-friendly message if none provided
      let responseContent = data.response;
      if (!responseContent?.trim() && data.handoff_to) {
        // Generate fallback based on handoff target
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
      
      responseContent = responseContent || "I'm processing your request. How else can I help you?";
      
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
                onClick={() => sendMessage(scenario.message)}
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
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Send a message to test the agent</p>
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
                                      className="text-xs h-7"
                                      onClick={() => handleActionClick(action)}
                                    >
                                      {action.type === 'call' && <Phone className="h-3 w-3 mr-1" />}
                                      {action.type === 'action' && action.value === 'show_calendar' && <Calendar className="h-3 w-3 mr-1" />}
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Handoff Badge - smaller, below next steps */}
                            <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-border/50">
                              <Badge variant="outline" className="text-xs gap-1 opacity-70">
                                <ArrowRight className="h-3 w-3" />
                                Transferred to {message.metadata.handoff_to}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <p className="text-xs opacity-50 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
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
