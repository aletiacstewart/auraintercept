import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mic, Calendar, Clock, Phone, Wrench, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ElevenLabsSetupGuideProps {
  companyId: string;
  agentId?: string;
}

const WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-booking-agent';

// Tool definitions for form-based setup
const getToolConfigs = (companyId: string) => [
  {
    id: 'get_services',
    name: 'get_services',
    description: 'Get available services. Call this first to know what services the company offers.',
    icon: Wrench,
    bodyParams: [
      { name: 'action', description: 'The action to perform', type: 'Value', value: 'get_services' },
      { name: 'company_id', description: 'The company identifier', type: 'Value', value: companyId }
    ]
  },
  {
    id: 'get_available_dates',
    name: 'get_available_dates',
    description: 'Get available booking dates for a service type.',
    icon: Calendar,
    bodyParams: [
      { name: 'action', description: 'The action to perform', type: 'Value', value: 'get_available_dates' },
      { name: 'company_id', description: 'The company identifier', type: 'Value', value: companyId },
      { name: 'service_type', description: 'The service type selected by the customer', type: 'LLM Prompt', value: '' }
    ]
  },
  {
    id: 'get_available_times',
    name: 'get_available_times',
    description: 'Get available time slots for a specific date.',
    icon: Clock,
    bodyParams: [
      { name: 'action', description: 'The action to perform', type: 'Value', value: 'get_available_times' },
      { name: 'company_id', description: 'The company identifier', type: 'Value', value: companyId },
      { name: 'date', description: 'Date in YYYY-MM-DD format chosen by customer', type: 'LLM Prompt', value: '' },
      { name: 'service_type', description: 'The service type', type: 'LLM Prompt', value: '' }
    ]
  },
  {
    id: 'book_appointment',
    name: 'book_appointment',
    description: 'Book an appointment with all customer details.',
    icon: Phone,
    bodyParams: [
      { name: 'action', description: 'The action to perform', type: 'Value', value: 'book_appointment' },
      { name: 'company_id', description: 'The company identifier', type: 'Value', value: companyId },
      { name: 'customer_name', description: 'Customer full name', type: 'LLM Prompt', value: '' },
      { name: 'customer_phone', description: 'Customer phone number', type: 'LLM Prompt', value: '' },
      { name: 'customer_email', description: 'Customer email address (optional)', type: 'LLM Prompt', value: '' },
      { name: 'customer_address', description: 'Service address', type: 'LLM Prompt', value: '' },
      { name: 'service_type', description: 'Service type being booked', type: 'LLM Prompt', value: '' },
      { name: 'date', description: 'Appointment date (YYYY-MM-DD)', type: 'LLM Prompt', value: '' },
      { name: 'time', description: 'Appointment time (HH:MM)', type: 'LLM Prompt', value: '' },
      { name: 'notes', description: 'Additional notes about the service request', type: 'LLM Prompt', value: '' }
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

                      {/* Body Parameters Section */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          📝 Body Parameters Tab
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Click <strong>+ Add Parameter</strong> for each row below:
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border rounded">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="py-1.5 px-2 text-left font-medium border-b">Name</th>
                                <th className="py-1.5 px-2 text-left font-medium border-b">Description</th>
                                <th className="py-1.5 px-2 text-left font-medium border-b">Type</th>
                                <th className="py-1.5 px-2 text-left font-medium border-b">Value</th>
                                <th className="py-1.5 px-2 border-b w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {tool.bodyParams.map((param, paramIndex) => (
                                <tr key={paramIndex} className="border-b last:border-b-0">
                                  <td className="py-1.5 px-2">
                                    <code className="bg-muted px-1 rounded text-[10px]">{param.name}</code>
                                  </td>
                                  <td className="py-1.5 px-2 text-muted-foreground text-[10px]">{param.description}</td>
                                  <td className="py-1.5 px-2">
                                    <Badge variant={param.type === 'Value' ? 'secondary' : 'default'} className="text-[10px]">
                                      {param.type}
                                    </Badge>
                                  </td>
                                  <td className="py-1.5 px-2">
                                    {param.type === 'Value' ? (
                                      <code className="bg-muted px-1 rounded text-[10px] break-all">{param.value}</code>
                                    ) : (
                                      <span className="text-muted-foreground italic text-[10px]">(AI fills in)</span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2">
                                    {param.type === 'Value' && param.value && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0"
                                        onClick={() => copyToClipboard(param.value, `${tool.id}-param-${paramIndex}`)}
                                      >
                                        {copiedItems[`${tool.id}-param-${paramIndex}`] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
