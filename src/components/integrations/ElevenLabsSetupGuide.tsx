import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mic, Calendar, Clock, Phone, Wrench } from 'lucide-react';

interface ElevenLabsSetupGuideProps {
  companyId: string;
  agentId?: string;
}

const WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-booking-agent';

// Helper to generate ElevenLabs-compatible webhook tool JSON
function generateToolJson(
  name: string,
  description: string,
  properties: Array<{ id: string; type: string; description: string; required: boolean; valueType: 'llm_prompt' | 'constant'; constantValue?: string }>
) {
  return {
    type: "webhook",
    name,
    description,
    api_schema: {
      url: WEBHOOK_URL,
      method: "POST",
      path_params_schema: [],
      query_params_schema: [],
      request_body_schema: {
        id: "body",
        type: "object",
        description: "Request body parameters",
        required: false,
        properties: properties.map(prop => ({
          id: prop.id,
          type: prop.type,
          description: prop.description,
          required: prop.required,
          // ElevenLabs expects: 'llm_prompt' | 'dynamic_variable' | 'constant'
          value_type: prop.valueType === 'constant' ? 'constant' : 'llm_prompt',
          // dynamic_variable is required but can be empty string when not used
          dynamic_variable: "",
          ...(prop.valueType === 'constant' && prop.constantValue
            ? { constant_value: prop.constantValue }
            : {})
        }))
      },
      request_headers: [
        {
          id: "content_type_header",
          name: "Content-Type",
          type: "value",
          value: "application/json"
        }
      ]
    },
    response_timeout_secs: 30
  };
}

// Tool definitions with proper schema
const getToolConfigs = (companyId: string) => [
  {
    id: 'get_services',
    name: 'get_services',
    description: 'Get available services. Call this first to know what services the company offers.',
    icon: Wrench,
    json: generateToolJson('get_services', 'Get available services. Call this first to know what services the company offers.', [
      { id: 'action', type: 'string', description: 'Must be exactly: get_services', required: true, valueType: 'constant', constantValue: 'get_services' },
      { id: 'company_id', type: 'string', description: 'The company ID', required: true, valueType: 'constant', constantValue: companyId }
    ])
  },
  {
    id: 'get_available_dates',
    name: 'get_available_dates',
    description: 'Get available booking dates for a service type.',
    icon: Calendar,
    json: generateToolJson('get_available_dates', 'Get available booking dates for a service type.', [
      { id: 'action', type: 'string', description: 'Must be exactly: get_available_dates', required: true, valueType: 'constant', constantValue: 'get_available_dates' },
      { id: 'company_id', type: 'string', description: 'The company ID', required: true, valueType: 'constant', constantValue: companyId },
      { id: 'service_type', type: 'string', description: 'The service type (e.g., "General Plumbing")', required: true, valueType: 'llm_prompt' }
    ])
  },
  {
    id: 'get_available_times',
    name: 'get_available_times',
    description: 'Get available time slots for a specific date.',
    icon: Clock,
    json: generateToolJson('get_available_times', 'Get available time slots for a specific date.', [
      { id: 'action', type: 'string', description: 'Must be exactly: get_available_times', required: true, valueType: 'constant', constantValue: 'get_available_times' },
      { id: 'company_id', type: 'string', description: 'The company ID', required: true, valueType: 'constant', constantValue: companyId },
      { id: 'date', type: 'string', description: 'Date in YYYY-MM-DD format', required: true, valueType: 'llm_prompt' },
      { id: 'service_type', type: 'string', description: 'The service type', required: true, valueType: 'llm_prompt' }
    ])
  },
  {
    id: 'book_appointment',
    name: 'book_appointment',
    description: 'Book an appointment with all customer details.',
    icon: Phone,
    json: generateToolJson('book_appointment', 'Book an appointment with all customer details.', [
      { id: 'action', type: 'string', description: 'Must be exactly: book_appointment', required: true, valueType: 'constant', constantValue: 'book_appointment' },
      { id: 'company_id', type: 'string', description: 'The company ID', required: true, valueType: 'constant', constantValue: companyId },
      { id: 'customer_name', type: 'string', description: 'Customer full name', required: true, valueType: 'llm_prompt' },
      { id: 'customer_phone', type: 'string', description: 'Customer phone number', required: true, valueType: 'llm_prompt' },
      { id: 'customer_email', type: 'string', description: 'Customer email (optional)', required: false, valueType: 'llm_prompt' },
      { id: 'customer_address', type: 'string', description: 'Service address', required: false, valueType: 'llm_prompt' },
      { id: 'service_type', type: 'string', description: 'Service type being booked', required: true, valueType: 'llm_prompt' },
      { id: 'date', type: 'string', description: 'Appointment date (YYYY-MM-DD)', required: true, valueType: 'llm_prompt' },
      { id: 'time', type: 'string', description: 'Appointment time (HH:MM)', required: true, valueType: 'llm_prompt' },
      { id: 'notes', type: 'string', description: 'Additional notes about the service', required: false, valueType: 'llm_prompt' }
    ])
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

          {/* Step 3: Add Tools (EASY WAY) */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground border-primary">3</Badge>
                Add Tools to Your Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-4">
              {/* Simple Instructions */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="font-semibold text-foreground mb-3">✨ Easy Setup (3 steps per tool):</p>
                <ol className="list-decimal list-inside space-y-2 text-foreground">
                  <li>In ElevenLabs, go to <strong>Tools</strong> → <strong>+ Add Tool</strong> → <strong>Webhook</strong></li>
                  <li>Click <strong>"JSON Mode"</strong> button (top right of the dialog)</li>
                  <li>Delete everything in the editor, then <strong>paste the JSON</strong> from below</li>
                </ol>
              </div>

              <p className="font-medium text-foreground">Add all 4 tools below. Click "Copy" and paste into ElevenLabs:</p>

              {/* Tool Cards - Simple List */}
              <div className="space-y-4">
                {getToolConfigs(companyId).map((tool) => (
                  <div key={tool.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <tool.icon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{tool.name}</span>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => copyToClipboard(JSON.stringify(tool.json, null, 2), `tool-${tool.id}`)}
                      >
                        {copiedItems[`tool-${tool.id}`] ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy JSON
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-2">{tool.json.description}</p>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View JSON</summary>
                        <pre className="mt-2 bg-muted p-3 rounded text-[10px] overflow-x-auto max-h-48 overflow-y-auto">
{JSON.stringify(tool.json, null, 2)}
                        </pre>
                      </details>
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
                <p><strong>JSON error when pasting?</strong></p>
                <p className="text-xs">Make sure you clicked "JSON Mode" first, and deleted all existing text before pasting.</p>
              </div>
              <div className="space-y-2">
                <p><strong>Agent doesn't use the tools?</strong></p>
                <p className="text-xs">Make sure you added all 4 tools and the system prompt mentions using them.</p>
              </div>
              <div className="space-y-2">
                <p><strong>No available times?</strong></p>
                <p className="text-xs">Check that you have business hours and technician availability configured.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Company ID Reference */}
        <div className="bg-muted/50 p-3 rounded-lg mt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Your Company ID (pre-filled in the JSONs above)</span>
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
