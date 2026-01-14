import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Phone, MessageSquare, Shield, CreditCard } from 'lucide-react';

export function TwilioSetupGuide() {
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
          <Phone className="w-5 h-5 text-red-500" />
          <CardTitle className="text-lg">Twilio Setup Guide</CardTitle>
          <Badge variant="secondary">Voice & SMS</Badge>
        </div>
        <CardDescription>
          Configure Twilio for voice calls and SMS messaging. Follow these steps to enable two-way communication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Step 1: Create Account */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">1</Badge>
                Create Twilio Account
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">twilio.com/try-twilio</a></li>
                <li>Sign up for a free trial account</li>
                <li>Verify your email and phone number</li>
                <li>Complete the account setup wizard</li>
              </ol>
              <a 
                href="https://www.twilio.com/try-twilio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create Twilio Account <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Get Credentials */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">2</Badge>
                Get API Credentials
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Find your credentials in the Twilio Console:</p>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-foreground">Account SID</span>
                </div>
                <p className="text-xs text-foreground/70">Found on your Console Dashboard. Starts with "AC"</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-foreground">Auth Token</span>
                </div>
                <p className="text-xs text-foreground/70">Click "Show" next to Auth Token on Dashboard. Keep this secret!</p>
              </div>
              <a 
                href="https://console.twilio.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Open Twilio Console <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Purchase Phone Number */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">3</Badge>
                Purchase a Phone Number
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>In Console, go to <strong className="text-foreground">Phone Numbers → Manage → Buy a Number</strong></li>
                <li>Search for a number in your desired area code</li>
                <li>Ensure the number has <Badge variant="outline" className="mx-1 text-foreground">Voice</Badge> and <Badge variant="outline" className="mx-1 text-foreground">SMS</Badge> capabilities</li>
                <li>Purchase the number (~$1.15/month)</li>
              </ol>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  <strong>💡 Tip:</strong> For toll-free numbers (800, 888, etc.), you'll need to complete A2P 10DLC registration for SMS.
                </p>
              </div>
              <a 
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/search" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                <CreditCard className="w-3 h-3" /> Buy Phone Number <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Configure Webhooks */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">4</Badge>
                Configure Webhooks (Required for AI Features)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>To enable AI voice handling and missed call callbacks, configure these webhook URLs on your Twilio phone number:</p>
              
              {/* Voice Webhook */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-foreground">Voice "A Call Comes In"</span>
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
                <p className="text-xs text-foreground/70">Set to HTTP POST - Handles incoming calls with AI</p>
              </div>

              {/* Primary Handler Fails (Missed Call) */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-foreground">Voice "Primary Handler Fails"</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(MISSED_CALL_WEBHOOK_URL, 'missed-call-webhook')}
                  >
                    {copiedItems['missed-call-webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block text-foreground/70">{MISSED_CALL_WEBHOOK_URL}</code>
                <p className="text-xs text-foreground/70">Set to HTTP POST - Triggers AI callback or SMS for missed calls</p>
              </div>

              {/* Status Callback */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-foreground">Voice "Call Status Changes"</span>
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
                <p className="text-xs text-foreground/70">Set to HTTP POST - Tracks call completion status</p>
              </div>

              {/* SMS Webhook */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-foreground">SMS "A Message Comes In"</span>
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
                <p className="text-xs text-foreground/70">Set to HTTP POST - Routes incoming SMS to AI Agent for intelligent responses (e.g. when customers reply HELP)</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  <strong>💡 Important:</strong> All webhooks must be set to HTTP POST. The SMS webhook enables AI-powered responses when customers reply to messages (like "HELP").
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: Configure Missed Call Settings */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">5</Badge>
                Configure AI Missed Call Callbacks
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Enable automatic AI-powered callbacks when customer calls are missed:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong className="text-foreground">Settings → Missed Calls</strong> in your dashboard</li>
                <li>Choose your preferred action:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong className="text-foreground">SMS Only</strong> - Send a follow-up text message</li>
                    <li><strong className="text-foreground">AI Callback Only</strong> - Initiate an AI-powered return call</li>
                    <li><strong className="text-foreground">Callback then SMS</strong> - Try AI callback first, SMS if it fails</li>
                  </ul>
                </li>
                <li>Set the callback delay (how long to wait before calling back)</li>
                <li>Ensure ElevenLabs is configured for AI voice callbacks</li>
              </ol>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-600 dark:text-green-400 text-xs">
                  <strong>✅ How it works:</strong> When a call is missed, the system waits for your configured delay (default 30s), then automatically calls the customer back with an AI agent to help them book an appointment or get assistance.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 6: Pricing */}
          <AccordionItem value="step-6">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-red-500 text-white border-red-500">6</Badge>
                Pricing Overview
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-foreground/80">Phone Number</span>
                  <span className="font-medium text-foreground">~$1.15/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/80">Outbound SMS</span>
                  <span className="font-medium text-foreground">~$0.0079/message</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/80">Outbound Voice</span>
                  <span className="font-medium text-foreground">~$0.014/minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/80">Inbound Voice</span>
                  <span className="font-medium text-foreground">~$0.0085/minute</span>
                </div>
                <p className="text-xs text-foreground/70 pt-2 border-t">
                  Prices vary by country. Free trial includes ~$15 credit.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
