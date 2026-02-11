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

// Webhook URL kept for post-call webhook (Step 7)
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
    description: 'Get available services the company offers. Call this first so you know what to offer the customer.',
    icon: Wrench,
    bodyParams: [
      { identifier: 'service_type', description: 'Optional filter — leave empty to get all services', required: false, valueType: 'llm_prompt' }
    ]
  },
  {
    id: 'check_availability',
    name: 'check_availability',
    description: 'Check available appointment slots for a given date and service. Returns specific time slots with technician availability.',
    icon: Calendar,
    bodyParams: [
      { identifier: 'preferred_date', description: 'The date to check in YYYY-MM-DD format. Convert natural language like "tomorrow" or "next Monday" to this format.', required: true, valueType: 'llm_prompt' },
      { identifier: 'service_type', description: 'The service type to check availability for', required: false, valueType: 'llm_prompt' }
    ]
  },
  {
    id: 'create_appointment',
    name: 'create_appointment',
    description: 'Create and confirm a booking with all customer details.',
    icon: Phone,
    bodyParams: [
      { identifier: 'customer_name', description: 'Customer full name', required: true, valueType: 'llm_prompt' },
      { identifier: 'customer_phone', description: 'Customer phone number', required: true, valueType: 'llm_prompt' },
      { identifier: 'customer_email', description: 'Customer email address', required: false, valueType: 'llm_prompt' },
      { identifier: 'service_type', description: 'Service type being booked', required: true, valueType: 'llm_prompt' },
      { identifier: 'datetime', description: 'Full date and time in ISO format (YYYY-MM-DDTHH:MM:SS). Combine date and chosen time slot.', required: true, valueType: 'llm_prompt' },
      { identifier: 'duration_minutes', description: 'Appointment duration in minutes (default: 60)', required: false, valueType: 'llm_prompt' },
      { identifier: 'notes', description: 'Additional notes about the service request', required: false, valueType: 'llm_prompt' }
    ]
  }
];

const AGENT_PROMPT = `You are a professional and friendly appointment booking assistant. Help customers schedule service appointments.

CRITICAL - CONVERSATIONAL PAUSES:
- When asking for name, phone number, or address, WAIT patiently for the full response
- Never interrupt or rush the caller - give them plenty of time to speak
- If they pause to think, say "Take your time" before continuing
- After asking a question, wait at least 3-4 seconds for a response
- NEVER ask for multiple pieces of information in one question (e.g., don't say "Can I get your name, phone, and address?")
- Ask for ONE piece of info at a time, wait for the answer, then ask for the next

CRITICAL - DATE & TIME HANDLING:
- NEVER ask for dates in a specific format like "mm/dd/yyyy" or "month day year"
- NEVER say "please provide the date in month day year format"
- ALWAYS accept natural language: "tomorrow", "next Monday", "this Friday", "in 2 days"
- Examples you MUST understand and convert:
  • "tomorrow at 4pm" → Calculate tomorrow's date, time: 16:00
  • "next Tuesday around 3" → Next week's Tuesday, 15:00
  • "this Thursday afternoon" → This week's Thursday, ask for specific time preference
  • "in 3 days at 10am" → Calculate the date from today
  • "Monday the week after next" → Calculate correctly
  • "Wednesday" → Ask "Did you mean this Wednesday or next Wednesday?" if unclear
- Convert times naturally: "4pm" = 16:00, "9 in the morning" = 09:00, "noon" = 12:00

FLOW:
1. Greet warmly, ask how you can help
2. Ask what service they need (call get_services first)
3. Ask: "Can I get your full name?" — WAIT for their complete answer before continuing
4. Ask: "And a good phone number to reach you?" — WAIT for the full number
5. Ask: "What's the address for the service?" — WAIT for complete address
6. Ask "What day works best for you?" - accept natural language, don't ask for specific format
7. Confirm the date, then check available times (get_available_times)
8. Confirm ALL details before booking (book_appointment)

GUIDELINES:
- Be conversational, patient, and natural
- NEVER ask for formatted dates - always accept natural language
- Always confirm details before booking
- If no times available, offer the next available alternatives`;

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
              
              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Want company-specific settings?</strong> Go to <strong>Knowledge Base → Aura Intelligence</strong> to export a customized prompt with your company's brand tone, emergency protocols, and smart links.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2.5: Conversation Settings - CRITICAL */}
          <AccordionItem value="step-2-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-destructive text-destructive-foreground border-destructive">2.5</Badge>
                <Clock className="w-4 h-4 text-destructive" />
                Configure Conversation Timing (Critical!)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4">
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <strong>Without these settings, the agent will cut off callers</strong> before they finish speaking their name, phone number, or address.
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">📍 Location in ElevenLabs Dashboard:</p>
                <p className="text-xs">Agent Settings → <strong>Conversational behavior</strong> section</p>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Setting 1</Badge>
                    <span className="font-medium text-foreground">Eagerness</span>
                  </div>
                  <p className="text-xs mb-2">Controls how quickly the agent jumps in after the caller stops speaking.</p>
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-800 dark:text-green-200">
                      Set to <strong>Patient</strong>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    This gives callers time to say their full name or phone number without being interrupted.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Setting 2</Badge>
                    <span className="font-medium text-foreground">Spelling patience</span>
                  </div>
                  <p className="text-xs mb-2">How long the agent waits while callers spell out words letter by letter.</p>
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-800 dark:text-green-200">
                      Set to <strong>Auto</strong>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Prevents the agent from cutting in when callers spell names or addresses.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Setting 3</Badge>
                    <span className="font-medium text-foreground">Take turn after silence</span>
                  </div>
                  <p className="text-xs mb-2">How long the agent waits in silence before prompting the caller.</p>
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-800 dark:text-green-200">
                      Set to <strong>20 seconds</strong>
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Setting 4</Badge>
                    <span className="font-medium text-foreground">End conversation after silence</span>
                  </div>
                  <p className="text-xs mb-2">How long before the agent ends the call if the caller stays silent.</p>
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-800 dark:text-green-200">
                      Set to <strong>20 seconds</strong>
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Optional</Badge>
                    <span className="font-medium text-foreground">Soft timeout</span>
                  </div>
                  <p className="text-xs mb-2">Sends a gentle re-engagement message after a period of silence.</p>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded flex items-center gap-2">
                    <span className="text-xs text-blue-800 dark:text-blue-200">
                      Set to <strong>8 seconds</strong> with message: <em>"Are you still there? Take your time — I'm here whenever you're ready."</em>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-foreground">
                💡 Test your agent after adjusting these settings - callers should be able to say their full name and phone number without being cut off.
              </p>

              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Troubleshooting: Agent not waiting for answers?</strong> If the agent asks for name, phone, and address all at once or cuts off callers mid-answer, set <strong>Eagerness</strong> to <strong>Patient</strong> and <strong>Spelling patience</strong> to <strong>Auto</strong>. Also re-copy the latest system prompt above — it now enforces one-question-at-a-time collection.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Add Client Tools */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">3</Badge>
                Add Tools to Your Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4">
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>These are Client Tools</strong> — they run in the customer's browser, not via server webhooks. The browser SDK intercepts each tool call and routes it to your backend automatically. <strong>No webhook URL is needed.</strong>
                </AlertDescription>
              </Alert>

              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Migrating from webhooks?</strong> If you previously had 4 webhook tools (get_services, get_available_dates, get_available_times, book_appointment), remove them and create these 3 client tools instead.
                </AlertDescription>
              </Alert>

              <p className="font-medium text-foreground">Create all 3 client tools below. For each tool:</p>
              
              <ol className="list-decimal list-inside space-y-1 text-foreground text-xs bg-primary/5 p-3 rounded-lg">
                <li>Go to <strong>Tools</strong> → <strong>+ Add Tool</strong> → <strong>Client</strong></li>
                <li>Set the <strong>Name</strong> and <strong>Description</strong> exactly as shown</li>
                <li>Add the parameters listed below</li>
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
                          📋 Tool Settings
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
                            <tr>
                              <td className="py-1.5 pr-3 font-medium text-muted-foreground">Type</td>
                              <td className="py-1.5"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px]">Client</Badge></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Parameters Section */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          📝 Parameters
                        </p>
                        
                        <p className="text-xs text-muted-foreground mb-3">
                          Add each parameter below. The AI agent will fill these from the conversation automatically.
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
              <p>After adding all 3 client tools:</p>
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
              
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-xs font-medium text-foreground">Location in ElevenLabs:</p>
                <p className="text-xs">
                  ElevenLabs Dashboard → <strong>Agents</strong> → <strong>Settings</strong> (gear icon in sidebar)
                  <br />→ <strong>Post-call Webhooks</strong> section
                </p>
                <p className="text-xs">
                  <a 
                    href="https://elevenlabs.io/app/agents/settings" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Open ElevenLabs Settings <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select webhook type: <code className="bg-muted px-1 rounded">post_call_transcription</code>
                </p>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Important:</strong> This is a workspace-level setting that applies to all your agents.
                </AlertDescription>
              </Alert>

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
