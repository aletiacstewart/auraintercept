import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const VOICE_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler';
  const SMS_WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/missed-call-handler';

  return (
    <Card className="border-red-500/20 bg-red-500/5">
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
      <CardContent className="space-y-6">
        {/* Step 1: Create Account */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">1</span>
            Create Twilio Account
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com/try-twilio</a></li>
              <li>Sign up for a free trial account</li>
              <li>Verify your email and phone number</li>
              <li>Complete the account setup wizard</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create Twilio Account
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Get Credentials */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">2</span>
            Get API Credentials
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>Find your credentials in the Twilio Console:</p>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="font-medium text-foreground">Account SID</span>
              </div>
              <p className="text-xs">Found on your Console Dashboard. Starts with "AC"</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="font-medium text-foreground">Auth Token</span>
              </div>
              <p className="text-xs">Click "Show" next to Auth Token on Dashboard. Keep this secret!</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Open Twilio Console
              </a>
            </Button>
          </div>
        </div>

        {/* Step 3: Purchase Phone Number */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">3</span>
            Purchase a Phone Number
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>In Console, go to <strong>Phone Numbers → Manage → Buy a Number</strong></li>
              <li>Search for a number in your desired area code</li>
              <li>Ensure the number has <Badge variant="outline" className="mx-1">Voice</Badge> and <Badge variant="outline" className="mx-1">SMS</Badge> capabilities</li>
              <li>Purchase the number (~$1.15/month)</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>💡 Tip:</strong> For toll-free numbers (800, 888, etc.), you'll need to complete A2P 10DLC registration for SMS.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/search" target="_blank" rel="noopener noreferrer">
                <CreditCard className="w-4 h-4" />
                Buy Phone Number
              </a>
            </Button>
          </div>
        </div>

        {/* Step 4: Configure Webhooks */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">4</span>
            Configure Webhooks (Optional)
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>To receive inbound calls and SMS, configure these webhook URLs on your Twilio phone number:</p>
            
            {/* Voice Webhook */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-foreground">Voice Webhook URL</span>
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
              <code className="text-xs break-all block">{VOICE_WEBHOOK_URL}</code>
              <p className="text-xs text-muted-foreground">Set this under "A Call Comes In" → HTTP POST</p>
            </div>

            {/* SMS Webhook */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-foreground">SMS Webhook URL</span>
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
              <code className="text-xs break-all block">{SMS_WEBHOOK_URL}</code>
              <p className="text-xs text-muted-foreground">Set this under "A Message Comes In" → HTTP POST</p>
            </div>
          </div>
        </div>

        {/* Step 5: Pricing Info */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center">5</span>
            Pricing Overview
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Phone Number</span>
                <span className="font-medium">~$1.15/month</span>
              </div>
              <div className="flex justify-between">
                <span>Outbound SMS</span>
                <span className="font-medium">~$0.0079/message</span>
              </div>
              <div className="flex justify-between">
                <span>Outbound Voice</span>
                <span className="font-medium">~$0.014/minute</span>
              </div>
              <div className="flex justify-between">
                <span>Inbound Voice</span>
                <span className="font-medium">~$0.0085/minute</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Prices vary by country. Free trial includes ~$15 credit.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
