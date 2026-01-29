import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mic, Calendar, Clock, Phone, Wrench, AlertCircle, MessageSquare, BookOpen, Webhook, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ElevenLabsSetupGuideProps {
  companyId: string;
  agentId?: string;
}

const WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-booking-agent';
const POST_CALL_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/elevenlabs-post-call';

// Tool definitions for form-based setup with clearer structure
interface BodyParam {
  identifier: string;
  description: string;
  required: boolean;
  valueType: 'value' | 'llm_prompt';
  value?: string;
}

interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Wrench;
  bodyParams: BodyParam[];
}

const getToolConfigs = (companyId: string): ToolConfig[] => [
  {
    id: 'get_services',
    name: 'get_services',
    description: 'Get available services. Call this first to know what services the company offers.',
    icon: Wrench,
    bodyParams: [
      { identifier: 'action', description: 'The action to perform', required: true, valueType: 'value', value: 'get_services' },
      { identifier: 'company_id', description: 'The company identifier', required: true, valueType: 'value', value: companyId }
    ]
  },
  {
    id: 'get_available_dates',
    name: 'get_available_dates',
    description: 'Get available booking dates for a service type.',
    icon: Calendar,
    bodyParams: [
      { identifier: 'action', description: 'The action to perform', required: true, valueType: 'value', value: 'get_available_dates' },
      { identifier: 'company_id', description: 'The company identifier', required: true, valueType: 'value', value: companyId },
      { identifier: 'service_type', description: 'The service type selected by the customer', required: true, valueType: 'llm_prompt' }
    ]
  },
  {
    id: 'get_available_times',
    name: 'get_available_times',
    description: 'Get available time slots for a specific date.',
    icon: Clock,
    bodyParams: [
      { identifier: 'action', description: 'The action to perform', required: true, valueType: 'value', value: 'get_available_times' },
      { identifier: 'company_id', description: 'The company identifier', required: true, valueType: 'value', value: companyId },
      { identifier: 'date', description: 'The appointment date. Convert natural language (tomorrow, next Monday, etc.) to YYYY-MM-DD format based on current date', required: true, valueType: 'llm_prompt' },
      { identifier: 'service_type', description: 'The service type', required: true, valueType: 'llm_prompt' }
    ]
  },
  {
    id: 'book_appointment',
    name: 'book_appointment',
    description: 'Book an appointment with all customer details.',
    icon: Phone,
    bodyParams: [
      { identifier: 'action', description: 'The action to perform', required: true, valueType: 'value', value: 'book_appointment' },
      { identifier: 'company_id', description: 'The company identifier', required: true, valueType: 'value', value: companyId },
      { identifier: 'customer_name', description: 'Customer full name', required: true, valueType: 'llm_prompt' },
      { identifier: 'customer_phone', description: 'Customer phone number', required: true, valueType: 'llm_prompt' },
      { identifier: 'customer_email', description: 'Customer email address', required: false, valueType: 'llm_prompt' },
      { identifier: 'customer_address', description: 'Service address', required: true, valueType: 'llm_prompt' },
      { identifier: 'service_type', description: 'Service type being booked', required: true, valueType: 'llm_prompt' },
      { identifier: 'date', description: 'Appointment date converted to YYYY-MM-DD. Interpret natural language like tomorrow, next week, Wednesday, etc.', required: true, valueType: 'llm_prompt' },
      { identifier: 'time', description: 'Appointment time in HH:MM format (24hr). Convert "4pm" to 16:00, "9am" to 09:00, etc.', required: true, valueType: 'llm_prompt' },
      { identifier: 'notes', description: 'Additional notes about the service request', required: false, valueType: 'llm_prompt' }
    ]
  }
];

const AGENT_PROMPT = `You are a professional and friendly appointment booking assistant. Help customers schedule service appointments.

FLOW:
1. Greet warmly, ask how you can help
2. Ask what service they need (call get_services first)
3. Collect: name, phone, address
4. Check available dates (get_available_dates)
5. Let them pick a date, then check times (get_available_times)
6. Confirm all details, then book (book_appointment)

IMPORTANT - DATE & TIME HANDLING:
- Understand natural language dates like "tomorrow", "next Monday", "Wednesday of next week", "in 3 days"
- Convert these to proper dates before calling tools (format: YYYY-MM-DD)
- Use your knowledge of today's date to calculate relative dates
- If unclear, ask for clarification (e.g., "Did you mean this Wednesday or next Wednesday?")
- Convert times like "4pm" to 24-hour format: 16:00, "9am" to 09:00

DATE EXAMPLES:
- "tomorrow at 4pm" → date: tomorrow's YYYY-MM-DD, time: 16:00
- "next Tuesday" → calculate the date for next Tuesday
- "this Friday afternoon" → that Friday's date, then ask about specific time

GUIDELINES:
- Be conversational and natural
- Always confirm details before booking
- If no times available, offer alternatives`;

export function ElevenLabsSetupGuide({ companyId, agentId }: ElevenLabsSetupGuideProps) {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      toast.success('Copied to clipboard!');
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const toolConfigs = getToolConfigs(companyId);

  return (
    <Card className="guide-card guide-card-voice">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Voice Agent Setup Guide</CardTitle>
          <Badge variant="secondary">ElevenLabs</Badge>
        </div>
        <CardDescription>
          Configure your ElevenLabs agent to book appointments via voice. Follow these steps to enable real-time booking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Step 1: Prerequisites */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">1</Badge>
                Prerequisites
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Make sure you have:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>An ElevenLabs account with Conversational AI access</li>
                <li>Your ElevenLabs API key configured in Integrations above</li>
                <li>A voice agent created in ElevenLabs dashboard</li>
              </ul>
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open ElevenLabs Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Agent Prompt */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">2</Badge>
                Set Agent Prompt
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Copy this prompt and paste it in your ElevenLabs agent's "System Prompt" field:</p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {AGENT_PROMPT}
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => copyToClipboard(AGENT_PROMPT, 'prompt')}
                >
                  {copiedItems['prompt'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedItems['prompt'] ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Add Tools using Form Mode */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">3</Badge>
                Add Tools to Your Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Use Form Mode</strong> (not JSON Mode) - it's more reliable. Follow the step-by-step instructions below for each tool.
                </AlertDescription>
              </Alert>

              {/* Webhook URL */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Webhook URL (same for all tools):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded flex-1 overflow-x-auto">{WEBHOOK_URL}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook-url')}
                  >
                    {copiedItems['webhook-url'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <p className="font-medium text-foreground">Create all 4 tools below. For each tool:</p>
              
              <ol className="list-decimal list-inside space-y-1 text-foreground text-xs bg-primary/5 p-3 rounded-lg">
                <li>Go to <strong>Tools</strong> → <strong>+ Add Tool</strong> → <strong>Webhook</strong></li>
                <li>Make sure you're in <strong>Form Mode</strong> (not JSON Mode)</li>
                <li>Fill in the fields as shown below</li>
                <li>Click <strong>Add Tool</strong></li>
              </ol>

              {/* Tool Cards */}
              <div className="space-y-6">
                {toolConfigs.map((tool, toolIndex) => (
                  <div key={tool.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                        Tool {toolIndex + 1}
                      </Badge>
                      <tool.icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{tool.name}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Configuration Section */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          📋 Configuration Tab
                        </p>
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1.5 pr-3 font-medium text-muted-foreground w-24">Name</td>
                              <td className="py-1.5">
                                <div className="flex items-center gap-2">
                                  <code className="bg-muted px-2 py-0.5 rounded">{tool.name}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(tool.name, `${tool.id}-name`)}
                                  >
                                    {copiedItems[`${tool.id}-name`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 pr-3 font-medium text-muted-foreground">Description</td>
                              <td className="py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-foreground">{tool.description}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 shrink-0"
                                    onClick={() => copyToClipboard(tool.description, `${tool.id}-desc`)}
                                  >
                                    {copiedItems[`${tool.id}-desc`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1.5 pr-3 font-medium text-muted-foreground">Method</td>
                              <td className="py-1.5"><code className="bg-muted px-2 py-0.5 rounded">POST</code></td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-3 font-medium text-muted-foreground">URL</td>
                              <td className="py-1.5 text-xs text-muted-foreground italic">Use the webhook URL above</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Body Parameters Section - Card-based layout */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          📝 Body Parameters Tab
                        </p>
                        
                        {/* Legend */}
                        <div className="bg-muted/30 p-2 rounded-lg mb-3 flex flex-wrap gap-3 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] px-1.5">Value</Badge>
                            <span className="text-muted-foreground">= Fixed constant (you paste it)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] px-1.5">LLM Prompt</Badge>
                            <span className="text-muted-foreground">= AI fills from conversation</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">
                          Click <strong>+ Add Parameter</strong> for each step below:
                        </p>
                        
                        {/* Parameter Cards */}
                        <div className="space-y-3">
                          {tool.bodyParams.map((param, paramIndex) => (
                            <div key={paramIndex} className="border rounded-lg p-3 bg-background">
                              {/* Step Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                                    Step {paramIndex + 1}
                                  </Badge>
                                  <Badge 
                                    className={`text-[10px] px-1.5 ${
                                      param.valueType === 'value' 
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                                        : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                                    }`}
                                  >
                                    {param.valueType === 'value' ? 'Value' : 'LLM Prompt'}
                                  </Badge>
                                </div>
                                <span className={`text-[10px] ${param.required ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {param.required ? '✓ Required' : 'Optional'}
                                </span>
                              </div>
                              
                              {/* Fields */}
                              <div className="space-y-2">
                                {/* Identifier */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-20 shrink-0">Identifier:</span>
                                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">{param.identifier}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 shrink-0"
                                    onClick={() => copyToClipboard(param.identifier, `${tool.id}-param-${paramIndex}-id`)}
                                  >
                                    {copiedItems[`${tool.id}-param-${paramIndex}-id`] ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                                
                                {/* Description */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-20 shrink-0">Description:</span>
                                  <span className="text-xs bg-muted px-2 py-1 rounded flex-1">{param.description}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 shrink-0"
                                    onClick={() => copyToClipboard(param.description, `${tool.id}-param-${paramIndex}-desc`)}
                                  >
                                    {copiedItems[`${tool.id}-param-${paramIndex}-desc`] ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                                
                                {/* Type Instruction */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-20 shrink-0">Type:</span>
                                  <span className="text-xs text-foreground">
                                    Select <strong>"{param.valueType === 'value' ? 'Value' : 'LLM Prompt'}"</strong> from dropdown
                                  </span>
                                </div>
                                
                                {/* Value (only for constant type) */}
                                {param.valueType === 'value' && param.value && (
                                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                    <span className="text-[10px] text-blue-700 dark:text-blue-300 w-20 shrink-0">Paste this:</span>
                                    <code className="text-xs bg-white dark:bg-blue-900/50 px-2 py-1 rounded flex-1 font-mono text-blue-800 dark:text-blue-200 break-all">{param.value}</code>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="h-6 px-2 shrink-0 text-[10px]"
                                      onClick={() => copyToClipboard(param.value!, `${tool.id}-param-${paramIndex}-val`)}
                                    >
                                      {copiedItems[`${tool.id}-param-${paramIndex}-val`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      <span className="ml-1">Copy</span>
                                    </Button>
                                  </div>
                                )}
                                
                                {/* LLM Prompt note */}
                                {param.valueType === 'llm_prompt' && (
                                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
                                    <span className="text-[10px] text-purple-700 dark:text-purple-300">
                                      💡 The AI will extract this from the conversation automatically
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Test */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">4</Badge>
                Test Your Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>After adding all 4 tools:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Click <strong>"Talk to Agent"</strong> in ElevenLabs to test</li>
                <li>Say: <em>"I need to schedule a plumbing repair"</em></li>
                <li>The agent should ask for your details and book an appointment</li>
                <li>Check your dashboard - the appointment should appear!</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Optional Enhancements Header */}
          <div className="mt-6 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optional Enhancements</p>
          </div>

          {/* Step 5: First Message */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">5</Badge>
                <MessageSquare className="w-4 h-4 text-primary" />
                Configure First Message
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Set a welcoming first message so your agent greets callers immediately instead of waiting silently.</p>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Location in ElevenLabs:</p>
                <p className="text-xs">Agent Settings → Advanced Settings → <strong>First Message</strong></p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Recommended First Message:</p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
{`Hi! Thanks for calling. I'm Aura, your scheduling assistant. I can help you book an appointment, answer questions about our services, or check on an existing booking. How can I help you today?`}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 gap-1"
                    onClick={() => copyToClipboard("Hi! Thanks for calling. I'm Aura, your scheduling assistant. I can help you book an appointment, answer questions about our services, or check on an existing booking. How can I help you today?", 'first-message')}
                  >
                    {copiedItems['first-message'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedItems['first-message'] ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Why this matters:</strong> Without a first message, the agent waits for the caller to speak first, which can feel awkward.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Step 6: Knowledge Base */}
          <AccordionItem value="step-6">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">6</Badge>
                <BookOpen className="w-4 h-4 text-primary" />
                Add Knowledge Base (Optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Upload your FAQs, service descriptions, and policies so the agent can answer questions beyond booking.</p>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Location in ElevenLabs:</p>
                <p className="text-xs">Agent Settings → <strong>Knowledge Base</strong> → Upload Files</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Recommended content to upload:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Service descriptions</strong> - What services you offer and pricing</li>
                  <li><strong>FAQs</strong> - Common customer questions and answers</li>
                  <li><strong>Service areas</strong> - Cities/zip codes you serve</li>
                  <li><strong>Company policies</strong> - Cancellation, refund, warranties</li>
                  <li><strong>Contact information</strong> - Business hours, phone, email</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tip:</strong> Export your FAQ entries from the Aura Knowledge Base section and upload them as a text file.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Step 7: Post-Call Webhook */}
          <AccordionItem value="step-7">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">7</Badge>
                <Webhook className="w-4 h-4 text-primary" />
                Set Up Post-Call Logging (Optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Log all voice conversations in your Aura dashboard for review and analytics.</p>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Location in ElevenLabs:</p>
                <p className="text-xs">Agent Settings → Advanced Settings → <strong>Post-call webhook URL</strong></p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Webhook URL:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">{POST_CALL_WEBHOOK_URL}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => copyToClipboard(POST_CALL_WEBHOOK_URL, 'post-call-webhook')}
                  >
                    {copiedItems['post-call-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">What gets logged:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Full transcript</strong> - Complete conversation text</li>
                  <li><strong>Call duration</strong> - How long the call lasted</li>
                  <li><strong>Call summary</strong> - AI-generated summary</li>
                  <li><strong>Customer info</strong> - Name, phone if collected</li>
                  <li><strong>Recording URL</strong> - Link to call recording</li>
                  <li><strong>Success metrics</strong> - Whether booking was completed</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Calls will appear in your Call History after the webhook is configured.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Step 8: Call Analytics */}
          <AccordionItem value="step-8">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">8</Badge>
                <BarChart3 className="w-4 h-4 text-primary" />
                Configure Call Analytics (Optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Set up success criteria and data collection to track how well your voice agent is performing.</p>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Location in ElevenLabs:</p>
                <p className="text-xs">Agent Settings → <strong>Analysis</strong> tab</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">1. Evaluation Criteria (Success Metrics)</p>
                  <p className="text-xs mb-2">Add criteria to determine if a call was successful:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs bg-muted/30 p-2 rounded">
                    <li>"Was an appointment successfully booked?"</li>
                    <li>"Did the customer provide all required information?"</li>
                    <li>"Was the customer satisfied with the interaction?"</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-1">2. Data Collection</p>
                  <p className="text-xs mb-2">Collect specific data from each call:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs bg-muted/30 p-2 rounded">
                    <li><code className="bg-muted px-1 rounded">customer_name</code> - "What is the customer's full name?"</li>
                    <li><code className="bg-muted px-1 rounded">customer_phone</code> - "What is the customer's phone number?"</li>
                    <li><code className="bg-muted px-1 rounded">service_type</code> - "What service did the customer request?"</li>
                    <li><code className="bg-muted px-1 rounded">call_reason</code> - "Why did the customer call?"</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-1">3. Transcript Summary</p>
                  <p className="text-xs">Enable <strong>"Generate a summary after the call"</strong> for quick call reviews.</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Pro tip:</strong> The data collected here will be included in your call logs when using the post-call webhook.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Troubleshooting */}
          <AccordionItem value="troubleshooting">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">?</Badge>
                Troubleshooting
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <div className="space-y-2">
                <p><strong>Tool won't save?</strong></p>
                <p className="text-xs">Make sure you're in Form Mode (not JSON Mode). Fill in all required fields: Name, Description, Method, and URL.</p>
              </div>
              <div className="space-y-2">
                <p><strong>Agent doesn't use the tools?</strong></p>
                <p className="text-xs">Make sure you added all 4 tools and the system prompt mentions using them.</p>
              </div>
              <div className="space-y-2">
                <p><strong>No available times?</strong></p>
                <p className="text-xs">Check that you have business hours and technician availability configured in your dashboard.</p>
              </div>
              <div className="space-y-2">
                <p><strong>Parameter type "Value" vs "LLM Prompt"?</strong></p>
                <p className="text-xs">
                  <strong>Value</strong> = Fixed value you enter (like company_id).<br/>
                  <strong>LLM Prompt</strong> = AI extracts from conversation (like customer name).
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Company ID Reference */}
        <div className="bg-muted/50 p-3 rounded-lg mt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Your Company ID (use this for the company_id parameter)</span>
              <p className="text-sm font-mono">{companyId}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => copyToClipboard(companyId, 'companyId')}
            >
              {copiedItems['companyId'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
