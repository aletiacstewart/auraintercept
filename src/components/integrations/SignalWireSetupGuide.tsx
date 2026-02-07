import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Phone, MessageSquare, Shield, CreditCard, AlertTriangle, Building, FileCheck, Info } from 'lucide-react';

export function SignalWireSetupGuide() {
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

  const VOICE_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming';
  const MISSED_CALL_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/missed-call-handler';
  const STATUS_CALLBACK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=status';
  const SMS_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/sms-handler';

  return (
    <Card className="guide-card guide-card-voice">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg">SignalWire Setup Guide</CardTitle>
          <Badge variant="secondary">Voice & SMS</Badge>
        </div>
        <CardDescription>
          Configure SignalWire for voice calls and SMS messaging. Follow these steps to enable two-way communication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intro Alert - Why Your Own SignalWire Account */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <strong className="text-foreground">Why connect your own SignalWire account?</strong>
            <p className="text-foreground/80 mt-1">
              To keep your costs separate and ensure compliance with US carrier regulations, each client must use their own SignalWire account. This means you control your own messaging spend and registration.
            </p>
          </AlertDescription>
        </Alert>

        {/* SignalWire Benefits */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-600 dark:text-green-400 text-xs">
            <strong>💡 Why SignalWire?</strong> Up to 40% cheaper SMS ($0.004/msg vs $0.0079), lower voice rates ($0.01/min), and full Twilio API compatibility for easy migration.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {/* Step 1: A2P 10DLC Overview */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-amber-500 text-white border-amber-500">1</Badge>
                What is A2P 10DLC?
                <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300">Required for US SMS</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Application-to-Person 10-Digit Long Code</p>
                    <p className="text-foreground/70 mt-1">
                      A2P 10DLC is a US carrier requirement for businesses sending SMS from applications (like appointment reminders or notifications) to US phone numbers using standard 10-digit numbers.
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-foreground">Why is it required?</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-foreground/70 ml-6">
                    <li>US carriers require registration for all business SMS to US numbers</li>
                    <li>Unregistered messages may be <strong className="text-foreground">blocked or filtered</strong></li>
                    <li>Registration ensures reliable delivery and compliance</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    <strong>💡 Note:</strong> If you're not sending SMS to US numbers, A2P 10DLC registration is not required.
                  </p>
                </div>

                <a 
                  href="https://signalwire.com/blogs/product/a2p-10dlc-messaging-compliance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-secondary hover:underline"
                >
                  Learn more about A2P 10DLC <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Create Account */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">2</Badge>
                Create SignalWire Account
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://signalwire.com/signup" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">signalwire.com/signup</a></li>
                <li>Sign up for a free trial account (includes $5 credit)</li>
                <li>Verify your email and phone number</li>
                <li>Create a new Space (your project name)</li>
              </ol>
              <a 
                href="https://signalwire.com/signup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create SignalWire Account <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Get Credentials */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">3</Badge>
                Get API Credentials
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Find your credentials in the SignalWire Dashboard:</p>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground">Space URL</span>
                </div>
                <p className="text-xs text-foreground/70">Found at the top of your dashboard (e.g., yourspace.signalwire.com)</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground">Project ID</span>
                </div>
                <p className="text-xs text-foreground/70">Go to API → API Credentials. Your Project ID is displayed here.</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground">API Token</span>
                </div>
                <p className="text-xs text-foreground/70">Create a new API Token in API → API Credentials. Keep this secret!</p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  <strong>🔒 Security Tip:</strong> You can create multiple API tokens with different permissions for enhanced security.
                </p>
              </div>
              
              <a 
                href="https://signalwire.com/signin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Open SignalWire Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Register for A2P 10DLC */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-amber-500 text-white border-amber-500">4</Badge>
                Register for A2P 10DLC
                <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300">Required for US SMS</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-4">
              <p>To send SMS to US numbers, you must register your business and use case with SignalWire:</p>
              
              {/* Brand Registration */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground">Step 1: Register Your Brand</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-foreground/70 ml-4">
                  <li>Go to SignalWire Dashboard → <strong className="text-foreground">Messaging → Campaign Registry</strong></li>
                  <li>Click "Register Brand" and enter your business details:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Company legal name and address</li>
                      <li>EIN (Employer Identification Number)</li>
                      <li>Business type and website</li>
                    </ul>
                  </li>
                  <li>Submit for approval (usually 1-2 business days)</li>
                </ol>
              </div>

              {/* Campaign Registration */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-foreground">Step 2: Register Your Campaign</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-foreground/70 ml-4">
                  <li>After brand approval, create a Campaign</li>
                  <li>Select use case: <strong className="text-foreground">"Appointment Reminders"</strong> or "Notifications"</li>
                  <li>Provide:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Sample message content (e.g., your reminder template)</li>
                      <li>How customers opt-in (e.g., booking appointment)</li>
                      <li>How customers opt-out (e.g., reply STOP)</li>
                    </ul>
                  </li>
                  <li>Submit for approval (usually 1-7 business days)</li>
                </ol>
              </div>

              {/* Link Phone Number */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-foreground">Step 3: Link Your Phone Number</span>
                </div>
                <p className="text-foreground/70 ml-4">
                  After campaign approval, link your SignalWire phone number to the registered campaign. This enables compliant SMS delivery.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  <strong>⏱️ Timeline:</strong> Full registration typically takes 3-10 business days. Plan ahead before launching SMS features.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://signalwire.com/signin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-secondary hover:underline"
                >
                  Open Campaign Registry <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-foreground/30">|</span>
                <a 
                  href="https://signalwire.com/blogs/product/a2p-10dlc-messaging-compliance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-secondary hover:underline"
                >
                  A2P 10DLC Guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: Purchase Phone Number */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">5</Badge>
                Purchase a Phone Number
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>In Dashboard, go to <strong className="text-foreground">Phone Numbers → Buy</strong></li>
                <li>Search for a number in your desired area code</li>
                <li>Ensure the number has <Badge variant="outline" className="mx-1 text-foreground">Voice</Badge> and <Badge variant="outline" className="mx-1 text-foreground">SMS</Badge> capabilities</li>
                <li>Purchase the number (~$2.00/month)</li>
              </ol>
              
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-xs">
                  <strong>⚠️ Important:</strong> For US SMS, your phone number <strong>must be linked to an approved A2P 10DLC Campaign</strong> (Step 4) before sending messages. Unregistered numbers may have messages blocked.
                </p>
              </div>
              
              <a 
                href="https://signalwire.com/signin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                <CreditCard className="w-3 h-3" /> Buy Phone Number <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 6: Configure Webhooks */}
          <AccordionItem value="step-6">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">6</Badge>
                Configure Webhooks (Required for AI Features)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>To enable AI voice handling and missed call callbacks, configure these webhook URLs on your SignalWire phone number:</p>
              
              {/* Voice Webhook */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-foreground">Call Request URL (Inbound Calls)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(VOICE_WEBHOOK_URL, 'voice-webhook')}
                  >
                    {copiedItems['voice-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block text-foreground/70">{VOICE_WEBHOOK_URL}</code>
                <p className="text-xs text-foreground/70">Method: POST — Receives incoming call events</p>
              </div>

              {/* Call Status Callback */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-foreground">Call Status Callback URL</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(MISSED_CALL_WEBHOOK_URL, 'missed-webhook')}
                  >
                    {copiedItems['missed-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block text-foreground/70">{MISSED_CALL_WEBHOOK_URL}</code>
                <p className="text-xs text-foreground/70">Method: POST — Receives call completion events (missed calls trigger AI callback or SMS)</p>
              </div>

              {/* Status Callback */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-foreground">Status Callback URL (Recordings)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(STATUS_CALLBACK_URL, 'status-webhook')}
                  >
                    {copiedItems['status-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block text-foreground/70">{STATUS_CALLBACK_URL}</code>
                <p className="text-xs text-foreground/70">Method: POST — Receives call status events & recordings</p>
              </div>

              {/* SMS Webhook */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-foreground">Message Request URL (Inbound SMS)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(SMS_WEBHOOK_URL, 'sms-webhook')}
                  >
                    {copiedItems['sms-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block text-foreground/70">{SMS_WEBHOOK_URL}</code>
                <p className="text-xs text-foreground/70">Method: POST — Receives incoming SMS events</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  <strong>📍 Where to configure:</strong> In SignalWire Dashboard, go to <strong>Phone Numbers</strong> → click your number → <strong>Settings</strong> tab → scroll to <strong>LaML Webhooks</strong> section.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 7: Enter Credentials */}
          <AccordionItem value="step-7">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-green-500 text-white border-green-500">7</Badge>
                Enter Credentials Below
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Use the form below to enter your SignalWire credentials:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground/70 ml-4">
                <li><strong className="text-foreground">Space URL</strong> - Your SignalWire space (e.g., yourspace.signalwire.com)</li>
                <li><strong className="text-foreground">Project ID</strong> - Found in API → API Credentials</li>
                <li><strong className="text-foreground">API Token</strong> - Created in API → API Credentials</li>
                <li><strong className="text-foreground">Phone Number</strong> - In E.164 format (e.g., +14155551234)</li>
              </ul>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-600 dark:text-green-400 text-xs">
                  <strong>✅ You're all set!</strong> Once configured, Aura will handle voice calls, SMS messages, and missed call follow-ups automatically.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
