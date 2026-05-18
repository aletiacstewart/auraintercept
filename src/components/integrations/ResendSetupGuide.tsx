import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mail, Globe, Shield, CheckCircle } from 'lucide-react';

export function ResendSetupGuide() {
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

  const WEBHOOK_URL = 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/resend-webhook';

  return (
    <Card className="guide-card guide-card-email">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-lg">Resend Setup Guide</CardTitle>
          <Badge variant="secondary">Email</Badge>
        </div>
        <CardDescription>
          Configure Resend for sending email notifications and reminders. Most cost-effective communication channel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Step 1: Create Account */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-emerald-500 text-white border-emerald-500">1</Badge>
                Create Resend Account
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">resend.com/signup</a></li>
                <li>Sign up with your email or GitHub account</li>
                <li>Verify your email address</li>
              </ol>
              <a 
                href="https://resend.com/signup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create Resend Account <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Add Domain */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-emerald-500 text-white border-emerald-500">2</Badge>
                Add Your Domain (Recommended)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>For better deliverability and professional emails:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong>Domains</strong> in Resend dashboard</li>
                <li>Click <strong>Add Domain</strong></li>
                <li>Enter your domain (e.g., yourbusiness.com)</li>
                <li>Add the provided DNS records to your domain registrar</li>
                <li>Wait for verification (usually 24-48 hours)</li>
              </ol>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  <strong>💡 Without a custom domain:</strong> You can still send emails from onboarding@resend.dev for testing, but production emails should use your own domain.
                </p>
              </div>
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                <Globe className="w-3 h-3" /> Manage Domains <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Get API Key */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-emerald-500 text-white border-emerald-500">3</Badge>
                Get API Key
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong>API Keys</strong> in the Resend dashboard</li>
                <li>Click <strong>Create API Key</strong></li>
                <li>Give it a name (e.g., "Production" or "My App")</li>
                <li>Select permission: <Badge variant="outline" className="mx-1">Full Access</Badge> or <Badge variant="outline" className="mx-1">Sending Access</Badge></li>
                <li>Copy the key immediately - it won't be shown again!</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-foreground">API Key Format</span>
                </div>
                <code className="text-xs">re_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx</code>
                <p className="text-xs text-muted-foreground">Starts with "re_" followed by a unique identifier</p>
              </div>
              <a 
                href="https://resend.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Configure Webhook */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-emerald-500 text-white border-emerald-500">4</Badge>
                Configure Webhook (Optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>To track email delivery, opens, and bounces:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong>Webhooks</strong> in Resend dashboard</li>
                <li>Click <strong>Add Webhook</strong></li>
                <li>Paste the webhook URL below</li>
                <li>Select events: <strong>email.delivered</strong>, <strong>email.opened</strong>, <strong>email.bounced</strong></li>
              </ol>
              
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Webhook URL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook')}
                  >
                    {copiedItems['webhook'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all block">{WEBHOOK_URL}</code>
              </div>
              <a 
                href="https://resend.com/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Configure Webhooks <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: Pricing */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-emerald-500 text-white border-emerald-500">5</Badge>
                Pricing & Features
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Your own Resend account · valid credit card on file · billed directly by Resend</span>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Free tier</span>
                    <span className="font-medium">3,000 emails/month · 100/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro plan</span>
                    <span className="font-medium">$20/month (50,000 emails)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scale plan</span>
                    <span className="font-medium">$90+/month (100K+ emails)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default daily cap</span>
                    <span className="font-medium">100 emails/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset cadence</span>
                    <span className="font-medium">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overage rate</span>
                    <span className="font-medium">$0.90 per 1,000 emails</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High-volume runs (&gt;10,000)</span>
                    <span className="font-medium">$0.0015 / run</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Includes delivery tracking and analytics. Resend invoices your card on file directly at the provider's published rates — separate from your Aura plan fee.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
