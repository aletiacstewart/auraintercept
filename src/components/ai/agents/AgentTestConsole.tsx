import { useState, useRef, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';

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

export function AgentTestConsole({
  agentType,
  agentName,
  isEnabled,
  companyId,
}: AgentTestConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scenarios = TEST_SCENARIOS[agentType] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: crypto.randomUUID(), timestamp: new Date() },
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !companyId) return;

    addMessage({ role: 'user', content });
    setInput('');
    setIsLoading(true);

    // Add to conversation history
    const updatedHistory = [...conversationHistory, { role: 'user' as const, content }];

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agentType,
          message: content,
          companyId,
          conversationHistory: updatedHistory,
        },
      });

      if (error) throw error;

      const responseContent = data.response || 'Agent processed the request successfully.';
      
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
        },
      });
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

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
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
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Powered by Lovable AI
              </Badge>
            </div>
            <CardDescription>Interact with {agentName} using real AI</CardDescription>
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
                        {message.metadata && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            {message.metadata.event_type && (
                              <Badge variant="outline" className="mr-2 text-xs">
                                Event: {message.metadata.event_type}
                              </Badge>
                            )}
                            {message.metadata.handoff_to && (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <ArrowRight className="h-3 w-3" />
                                  Handoff → {message.metadata.handoff_to}
                                </Badge>
                                {message.metadata.handoff_reason && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({message.metadata.handoff_reason})
                                  </span>
                                )}
                              </div>
                            )}
                            {message.metadata.tool_calls && message.metadata.tool_calls.length > 0 && (
                              <div className="mt-2 text-xs">
                                <p className="font-medium">Tool Calls:</p>
                                {message.metadata.tool_calls.map((tc, i) => (
                                  <div key={i} className="flex items-center gap-2 mt-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span>{tc.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
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
