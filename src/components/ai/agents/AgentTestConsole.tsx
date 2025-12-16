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
  Terminal
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    event_type?: string;
    handoff_to?: string;
    tool_calls?: Array<{ name: string; result: string }>;
  };
}

interface AgentTestConsoleProps {
  agentType: string;
  agentName: string;
  isEnabled: boolean;
  companyId: string | null;
}

const TEST_SCENARIOS: Record<string, Array<{ label: string; message: string }>> = {
  triage: [
    { label: 'New Customer Inquiry', message: "Hi, I'm interested in your services" },
    { label: 'Emergency Request', message: "I have an urgent plumbing issue, water is leaking everywhere!" },
    { label: 'Schedule Request', message: "I'd like to schedule an appointment" },
    { label: 'Price Check', message: "How much does a routine maintenance cost?" },
  ],
  booking: [
    { label: 'New Appointment', message: "I'd like to book an appointment for next week" },
    { label: 'Check Availability', message: "What times are available on Friday?" },
    { label: 'Reschedule', message: "I need to reschedule my appointment from Tuesday to Thursday" },
    { label: 'Cancel', message: "I need to cancel my appointment tomorrow" },
  ],
  followup: [
    { label: 'Service Completed', message: "Trigger follow-up for completed service" },
    { label: 'Check Satisfaction', message: "Test satisfaction survey" },
    { label: 'Issue Report', message: "The technician missed something during the visit" },
  ],
  review: [
    { label: 'Request Review', message: "Trigger review request" },
    { label: 'Positive Response', message: "The service was excellent! 5 stars" },
    { label: 'Negative Response', message: "I'm not satisfied with the service, 2 stars" },
  ],
  dispatch: [
    { label: 'New Job', message: "Dispatch technician for job #12345" },
    { label: 'Emergency Dispatch', message: "Emergency dispatch needed - customer has no heat" },
    { label: 'Reassign', message: "Reassign job from Tech A to Tech B" },
  ],
  route: [
    { label: 'Optimize Route', message: "Optimize today's route for technician John" },
    { label: 'Add Stop', message: "Add a new stop to the current route" },
    { label: 'Re-route', message: "Re-route due to traffic on main highway" },
  ],
  eta: [
    { label: 'Get ETA', message: "What's the ETA for the technician?" },
    { label: 'Delay Alert', message: "Technician is running 15 minutes late" },
    { label: 'Arrival Update', message: "Technician is 5 minutes away" },
  ],
  checkin: [
    { label: 'Check In', message: "Technician arrived at job site" },
    { label: 'Check Out', message: "Job completed, technician checking out" },
    { label: 'Upload Photos', message: "Upload before/after photos" },
  ],
  quoting: [
    { label: 'Generate Quote', message: "Generate quote for AC repair" },
    { label: 'Custom Quote', message: "Customer needs a custom quote with parts" },
    { label: 'Quote Follow-up', message: "Follow up on pending quote #Q-123" },
  ],
  invoice: [
    { label: 'Create Invoice', message: "Create invoice for completed job #J-456" },
    { label: 'Send Reminder', message: "Send payment reminder for overdue invoice" },
    { label: 'Process Payment', message: "Customer wants to pay invoice #INV-789" },
  ],
  inventory: [
    { label: 'Check Stock', message: "Check stock level for HVAC filters" },
    { label: 'Low Stock Alert', message: "Generate low stock report" },
    { label: 'Reorder', message: "Place reorder for depleted items" },
  ],
  warranty: [
    { label: 'Check Coverage', message: "Is my AC unit still under warranty?" },
    { label: 'File Claim', message: "I need to file a warranty claim" },
    { label: 'Claim Status', message: "What's the status of my warranty claim?" },
  ],
  promo: [
    { label: 'Create Campaign', message: "Create a 15% off holiday promotion" },
    { label: 'Target Segment', message: "Send promo to inactive customers" },
    { label: 'Check Results', message: "Show results of last promotion" },
  ],
  referral: [
    { label: 'Generate Link', message: "Generate referral link for customer" },
    { label: 'Track Referral', message: "Check status of referral from John" },
    { label: 'Process Reward', message: "Process referral reward for successful conversion" },
  ],
  winback: [
    { label: 'Identify Churned', message: "Show customers inactive for 90+ days" },
    { label: 'Send Outreach', message: "Send win-back offer to inactive customer" },
    { label: 'Check Campaign', message: "Show win-back campaign results" },
  ],
  seasonal: [
    { label: 'Schedule Campaign', message: "Schedule spring HVAC tune-up campaign" },
    { label: 'Send Reminders', message: "Send seasonal maintenance reminders" },
    { label: 'Check Weather', message: "Trigger weather-based campaign" },
  ],
  insights: [
    { label: 'Weekly Report', message: "Generate weekly performance report" },
    { label: 'Anomaly Check', message: "Check for anomalies in recent data" },
    { label: 'Recommendations', message: "What are your recommendations this week?" },
  ],
  forecast: [
    { label: '30 Day Forecast', message: "Forecast demand for next 30 days" },
    { label: 'Revenue Projection', message: "Project revenue for next quarter" },
    { label: 'Capacity Planning', message: "Do we need to hire more technicians?" },
  ],
};

export function AgentTestConsole({
  agentType,
  agentName,
  isEnabled,
  companyId,
}: AgentTestConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
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

    try {
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'test_agent',
          companyId,
          agentType,
          payload: {
            message: content,
            test_mode: true,
          },
        },
      });

      if (error) throw error;

      addMessage({
        role: 'agent',
        content: data.response || 'Agent processed the request successfully.',
        metadata: {
          event_type: data.event_type,
          handoff_to: data.handoff_to,
          tool_calls: data.tool_calls,
        },
      });
    } catch (error) {
      console.error('Test error:', error);
      addMessage({
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
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
            <CardTitle className="text-lg">Test Console</CardTitle>
            <CardDescription>Interact with {agentName} in test mode</CardDescription>
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
                              <Badge variant="secondary" className="text-xs">
                                Handoff → {message.metadata.handoff_to}
                              </Badge>
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
