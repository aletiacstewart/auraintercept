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
        action: { type: 'string', const: 'get_services' },
        companyId: { type: 'string', description: 'The company ID' }
      },
      required: ['action', 'companyId']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_services',
      companyId
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
        action: { type: 'string', const: 'get_available_dates' },
        companyId: { type: 'string', description: 'The company ID' },
        serviceType: { type: 'string', description: 'The service type to book' }
      },
      required: ['action', 'companyId', 'serviceType']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_available_dates',
      companyId,
      serviceType: 'General Plumbing'
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
        action: { type: 'string', const: 'get_available_times' },
        companyId: { type: 'string', description: 'The company ID' },
        date: { type: 'string', description: 'The date in YYYY-MM-DD format' },
        serviceType: { type: 'string', description: 'The service type' }
      },
      required: ['action', 'companyId', 'date', 'serviceType']
    },
    exampleBody: (companyId: string) => ({
      action: 'get_available_times',
      companyId,
      date: '2025-01-15',
      serviceType: 'General Plumbing'
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
        action: { type: 'string', const: 'book_appointment' },
        companyId: { type: 'string', description: 'The company ID' },
        customerName: { type: 'string', description: 'Full name of the customer' },
        customerPhone: { type: 'string', description: 'Phone number of the customer' },
        customerEmail: { type: 'string', description: 'Email address of the customer' },
        customerAddress: { type: 'string', description: 'Service address of the customer' },
        serviceType: { type: 'string', description: 'The service type being booked' },
        date: { type: 'string', description: 'The appointment date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'The appointment time (HH:MM)' },
        notes: { type: 'string', description: 'Additional notes about the service needed' }
      },
      required: ['action', 'companyId', 'customerName', 'customerPhone', 'serviceType', 'date', 'time']
    },
    exampleBody: (companyId: string) => ({
      action: 'book_appointment',
      companyId,
      customerName: 'John Smith',
      customerPhone: '+1234567890',
      customerEmail: 'john@example.com',
      customerAddress: '123 Main St, City, State 12345',
      serviceType: 'General Plumbing',
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
    <Card className="border-blue-500/20 bg-blue-500/5">
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
      <CardContent className="space-y-6">
        {/* Step 1: Prerequisites */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">1</span>
            Prerequisites
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <p>Make sure you have:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>An ElevenLabs account with Conversational AI access</li>
              <li>Your ElevenLabs API key configured in Integrations above</li>
              <li>A voice agent created in ElevenLabs dashboard</li>
            </ul>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Open ElevenLabs Dashboard
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Agent Prompt */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">2</span>
            Set Agent Prompt
          </h3>
          <div className="ml-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Copy this prompt and paste it in your ElevenLabs agent's "System Prompt" field:
            </p>
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
          </div>
        </div>

        {/* Step 3: Configure Client Tools */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">3</span>
            Configure Client Tools
          </h3>
          <div className="ml-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              In ElevenLabs, go to your agent → Tools → Add the following 4 client tools:
            </p>
            
            {/* Webhook URL */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Webhook URL (same for all tools)</span>
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
                  <div className="bg-card border rounded-lg p-4 space-y-3">
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Tool Configuration</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => copyToClipboard(JSON.stringify({
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters
                          }, null, 2), `tool-${tool.id}`)}
                        >
                          {copiedItems[`tool-${tool.id}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy Config
                        </Button>
                      </div>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{JSON.stringify({
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters
}, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Example Request Body</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => copyToClipboard(JSON.stringify(tool.exampleBody(companyId), null, 2), `body-${tool.id}`)}
                        >
                          {copiedItems[`body-${tool.id}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy Body
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
          </div>
        </div>

        {/* Step 4: Test */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">4</span>
            Test Your Agent
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <p>After configuring the tools:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Use ElevenLabs' built-in test feature to talk to your agent</li>
              <li>Try booking an appointment - say something like "I need to schedule a plumbing repair"</li>
              <li>Verify the appointment appears in your dashboard</li>
            </ol>
          </div>
        </div>

        {/* Company ID Reference */}
        <div className="bg-muted/50 p-3 rounded-lg">
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

        {/* Troubleshooting */}
        <Accordion type="single" collapsible>
          <AccordionItem value="troubleshooting" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2">
              Troubleshooting
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Agent doesn't call the tools:</strong> Make sure the tool names match exactly and the parameters are configured correctly.</p>
              <p><strong>Getting errors:</strong> Check that your company ID is correct and the webhook URL is accessible.</p>
              <p><strong>Appointment not showing:</strong> Verify all required fields (name, phone, service type, date, time) are being passed.</p>
              <p><strong>No available times:</strong> Check that you have business hours configured and technicians with availability.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
