import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mic, Calendar, Clock, Phone, User, Mail, MapPin, Wrench } from 'lucide-react';

interface ElevenLabsSetupGuideProps {
  companyId: string;
  agentId?: string;
}

const WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-booking-agent';

const TOOLS_CONFIG = [
  {
    id: 'get_services',
    name: 'get_services',
    description: 'Fetches available service types that can be booked. Call this first to know what services are offered.',
    icon: Wrench,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Must be get_services', enum: ['get_services'] },
        company_id: { type: 'string', description: 'The company ID' }
      },
      required: ['action', 'company_id']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_services',
      company_id: companyId
    })
  },
  {
    id: 'get_available_dates',
    name: 'get_available_dates',
    description: 'Gets available dates for booking in the next 14 days. Call after knowing the service type.',
    icon: Calendar,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Must be get_available_dates', enum: ['get_available_dates'] },
        company_id: { type: 'string', description: 'The company ID' },
        service_type: { type: 'string', description: 'The service type to book' }
      },
      required: ['action', 'company_id', 'service_type']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_available_dates',
      company_id: companyId,
      service_type: 'General Plumbing'
    })
  },
  {
    id: 'get_available_times',
    name: 'get_available_times',
    description: 'Gets available time slots for a specific date. Call after the customer picks a date.',
    icon: Clock,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Must be get_available_times', enum: ['get_available_times'] },
        company_id: { type: 'string', description: 'The company ID' },
        date: { type: 'string', description: 'The date in YYYY-MM-DD format' },
        service_type: { type: 'string', description: 'The service type' }
      },
      required: ['action', 'company_id', 'date', 'service_type']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_available_times',
      company_id: companyId,
      date: '2025-01-15',
      service_type: 'General Plumbing'
    })
  },
  {
    id: 'book_appointment',
    name: 'book_appointment',
    description: 'Books the appointment with all collected customer information. Call after confirming all details.',
    icon: Phone,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Must be book_appointment', enum: ['book_appointment'] },
        company_id: { type: 'string', description: 'The company ID' },
        customer_name: { type: 'string', description: 'Full name of the customer' },
        customer_phone: { type: 'string', description: 'Phone number of the customer' },
        customer_email: { type: 'string', description: 'Email address of the customer' },
        customer_address: { type: 'string', description: 'Service address of the customer' },
        service_type: { type: 'string', description: 'The service type being booked' },
        date: { type: 'string', description: 'The appointment date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'The appointment time in HH:MM format' },
        notes: { type: 'string', description: 'Additional notes about the service needed' }
      },
      required: ['action', 'company_id', 'customer_name', 'customer_phone', 'service_type', 'date', 'time']
    },
    exampleBody: (companyId: string) => ({
      action: 'book_appointment',
      company_id: companyId,
      customer_name: 'John Smith',
      customer_phone: '+1234567890',
      customer_email: 'john@example.com',
      customer_address: '123 Main St, City, State 12345',
      service_type: 'General Plumbing',
      date: '2025-01-15',
      time: '10:00',
      notes: 'Leaky faucet in kitchen'
    })
  }
];

const AGENT_PROMPT = `You are a professional and friendly appointment booking assistant for a home services company. Your goal is to help customers schedule service appointments efficiently.

CONVERSATION FLOW:
1. Greet the customer warmly and ask how you can help
2. Ask what type of service they need (use get_services to know available options)
3. Collect customer information:
   - Full name
   - Phone number
   - Email address (optional but helpful for confirmation)
   - Service address
4. Ask about the issue or what service they need
5. Check available dates (use get_available_dates)
6. Once they pick a date, check available times (use get_available_times)
7. Confirm ALL details before booking:
   - Customer name
   - Phone number
   - Email (if provided)
   - Service address
   - Service type
   - Date and time
   - Brief description of the issue
8. Book the appointment (use book_appointment)
9. Confirm the booking and let them know they'll receive a confirmation

IMPORTANT GUIDELINES:
- Be conversational and natural, not robotic
- If the customer is a returning customer, acknowledge that warmly
- Always confirm details before booking
- If no times are available on a date, offer alternatives
- Handle interruptions gracefully
- If you don't understand something, ask for clarification
- Keep responses concise but helpful`;

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

  return (
    <Card className="guide-card guide-card-voice">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-500" />
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
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">1</Badge>
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
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">2</Badge>
                Set Agent Prompt
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Copy this prompt and paste it in your ElevenLabs agent's "System Prompt" field:</p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
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

          {/* Step 3: Configure Client Tools */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">3</Badge>
                Configure Client Tools
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">📍 How to add each tool in ElevenLabs:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your agent → <strong>Tools</strong> → <strong>+ Add Tool</strong> → <strong>Webhook</strong></li>
                  <li>Fill in the <strong>Name</strong> field (e.g., <code className="bg-muted px-1 rounded">get_services</code>)</li>
                  <li>Fill in the <strong>Description</strong> field</li>
                  <li>Change <strong>Method</strong> from GET to <strong>POST</strong></li>
                  <li>Paste the <strong>URL</strong> (see below)</li>
                  <li>Scroll down to <strong>"Body"</strong> section and click <strong>"Add property"</strong> for each parameter</li>
                  <li><strong>OR easier:</strong> Click <strong>"Edit as JSON"</strong> at the bottom and paste the JSON config</li>
                </ol>
              </div>
              
              {/* Webhook URL */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">URL (same for all 4 tools)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook')}
                  >
                    {copiedItems['webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all">{WEBHOOK_URL}</code>
              </div>
              
              <p>Add all 4 tools below. For each one, copy the <strong>"Full JSON Config"</strong> and paste via "Edit as JSON":</p>

              <Tabs defaultValue="get_services" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  {TOOLS_CONFIG.map((tool) => (
                    <TabsTrigger key={tool.id} value={tool.id} className="text-xs">
                      <tool.icon className="w-3 h-3 mr-1" />
                      {tool.id.replace('get_', '').replace('book_', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {TOOLS_CONFIG.map((tool) => (
                  <TabsContent key={tool.id} value={tool.id} className="space-y-3">
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <tool.icon className="w-4 h-4 text-blue-500" />
                            {tool.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                        </div>
                        <Badge variant="outline">POST</Badge>
                      </div>

                      {/* Field-by-field instructions */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs space-y-2">
                        <p className="font-medium text-green-600 dark:text-green-400">Fill in these fields:</p>
                        <div className="grid gap-1.5">
                          <div><strong>Name:</strong> <code className="bg-muted px-1 rounded">{tool.name}</code></div>
                          <div><strong>Description:</strong> <span className="text-muted-foreground">{tool.description}</span></div>
                          <div><strong>Method:</strong> <code className="bg-muted px-1 rounded">POST</code></div>
                          <div><strong>URL:</strong> <code className="bg-muted px-1 rounded text-[10px]">{WEBHOOK_URL}</code></div>
                        </div>
                      </div>

                      {/* Body parameters */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Body Parameters</span>
                        </div>
                        
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs">
                          <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">⚠️ How to add each property:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Scroll down to the <strong>"Body"</strong> section</li>
                            <li>Click <strong>"Add property"</strong></li>
                            <li>In the <strong>"Identifier"</strong> field, type the property name exactly (e.g., <code className="bg-muted px-1 rounded">company_id</code>) — <strong>only letters, numbers, underscores allowed</strong></li>
                            <li>Set <strong>"Data type"</strong> to <code className="bg-muted px-1 rounded">String</code></li>
                            <li>Set <strong>"Value Type"</strong>: for <code>company_id</code> use <code className="bg-muted px-1 rounded">Value</code> and paste your ID; for others use <code className="bg-muted px-1 rounded">LLM Prompt</code></li>
                            <li>Fill in the <strong>"Description"</strong></li>
                            <li>Check <strong>"Required"</strong> if needed</li>
                          </ol>
                          <div className="mt-2 p-2 bg-background rounded border border-amber-500/30">
                            <p className="text-amber-600 dark:text-amber-400">
                              <strong>💡 For company_id:</strong> The "Identifier" field is just the name <code className="bg-muted px-1 rounded">company_id</code>. 
                              Set "Value Type" to <strong>Value</strong> (not LLM Prompt), then paste your actual UUID in the value field. 
                              The UUID with hyphens goes in the <em>value</em>, not the identifier.
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded text-xs space-y-2">
                          <p className="font-medium mb-2">Add these properties:</p>
                          {Object.entries(tool.parameters.properties).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-start gap-2 p-2 bg-background rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Identifier:</span>
                                  <code className="font-bold text-primary">{key}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => copyToClipboard(key, `prop-${tool.id}-${key}`)}
                                  >
                                    {copiedItems[`prop-${tool.id}-${key}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  </Button>
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  Description: {value.description || (value.const ? `Must be "${value.const}"` : '')}
                                </div>
                              </div>
                              {tool.parameters.required?.includes(key) && <Badge variant="secondary" className="text-[9px] h-4">required</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Full JSON Config for "Edit as JSON" */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">✅ Full JSON Config (paste via "Edit as JSON")</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 gap-1"
                            onClick={() => {
                              const requestBodySchema = {
                                type: "object",
                                properties: Object.fromEntries(
                                  Object.entries(tool.parameters.properties).map(([key, value]: [string, any]) => {
                                    const prop: Record<string, any> = {
                                      type: value.type || "string",
                                      description: value.description
                                    };
                                    if (value.enum) {
                                      prop.enum = value.enum;
                                    }
                                    return [key, prop];
                                  })
                                ),
                                required: tool.parameters.required
                              };
                              const fullConfig = {
                                type: "webhook",
                                name: tool.name,
                                description: tool.description,
                                api_schema: {
                                  url: WEBHOOK_URL,
                                  method: "POST",
                                  path_params_schema: {},
                                  query_params_schema: {},
                                  request_body_schema: requestBodySchema,
                                  request_headers: {
                                    "Content-Type": "application/json"
                                  }
                                },
                                response_timeout_secs: 30
                              };
                              copyToClipboard(JSON.stringify(fullConfig, null, 2), `fullconfig-${tool.id}`);
                            }}
                          >
                            {copiedItems[`fullconfig-${tool.id}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Copy Full Config
                          </Button>
                        </div>
                        <pre className="bg-green-500/10 border border-green-500/20 p-3 rounded text-xs overflow-x-auto max-h-80 overflow-y-auto">
{JSON.stringify({
  type: "webhook",
  name: tool.name,
  description: tool.description,
  api_schema: {
    url: WEBHOOK_URL,
    method: "POST",
    path_params_schema: {},
    query_params_schema: {},
    request_body_schema: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, value]: [string, any]) => {
          const prop: Record<string, any> = {
            type: value.type || "string",
            description: value.description
          };
          if (value.enum) {
            prop.enum = value.enum;
          }
          return [key, prop];
        })
      ),
      required: tool.parameters.required
    },
    request_headers: {
      "Content-Type": "application/json"
    }
  },
  response_timeout_secs: 30
}, null, 2)}
                        </pre>
                      </div>

                      {/* Example request body for testing */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Example Request Body (for testing)</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1"
                            onClick={() => copyToClipboard(JSON.stringify(tool.exampleBody(companyId), null, 2), `body-${tool.id}`)}
                          >
                            {copiedItems[`body-${tool.id}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Copy
                          </Button>
                        </div>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{JSON.stringify(tool.exampleBody(companyId), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Test */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">4</Badge>
                Test Your Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>After configuring the tools:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Use ElevenLabs' built-in test feature to talk to your agent</li>
                <li>Try booking an appointment - say something like "I need to schedule a plumbing repair"</li>
                <li>Verify the appointment appears in your dashboard</li>
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
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Agent doesn't call the tools:</strong> Make sure the tool names match exactly and the parameters are configured correctly.</p>
              <p><strong>Getting errors:</strong> Check that your company ID is correct and the webhook URL is accessible.</p>
              <p><strong>Appointment not showing:</strong> Verify all required fields (name, phone, service type, date, time) are being passed.</p>
              <p><strong>No available times:</strong> Check that you have business hours configured and technicians with availability.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Company ID Reference */}
        <div className="bg-muted/50 p-3 rounded-lg mt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Your Company ID</span>
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
