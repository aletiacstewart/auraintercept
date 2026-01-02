import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <Card className="border-emerald-500/20 bg-emerald-500/5">
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
      <CardContent className="space-y-6">
        {/* Step 1: Create Account */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">1</span>
            Create Resend Account
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/signup</a></li>
              <li>Sign up with your email or GitHub account</li>
              <li>Verify your email address</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create Resend Account
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Add Domain (Optional but Recommended) */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">2</span>
            Add Your Domain (Recommended)
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>For better deliverability and professional emails:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <strong>Domains</strong> in Resend dashboard</li>
              <li>Click <strong>Add Domain</strong></li>
              <li>Enter your domain (e.g., yourbusiness.com)</li>
              <li>Add the provided DNS records to your domain registrar</li>
              <li>Wait for verification (usually 24-48 hours)</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>💡 Without a custom domain:</strong> You can still send emails from onboarding@resend.dev for testing, but production emails should use your own domain.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4" />
                Manage Domains
              </a>
            </Button>
          </div>
        </div>

        {/* Step 3: Get API Key */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">3</span>
            Get API Key
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
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
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Get API Key
              </a>
            </Button>
          </div>
        </div>

        {/* Step 4: Configure Webhook (Optional) */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">4</span>
            Configure Webhook (Optional)
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>To track email delivery, opens, and bounces:</p>
            <ol className="list-decimal ml-4 space-y-1">
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
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Configure Webhooks
              </a>
            </Button>
          </div>
        </div>

        {/* Step 5: Pricing & Features */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">5</span>
            Pricing & Features
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Free Tier: 3,000 emails/month</span>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span>Pro Plan</span>
                  <span className="font-medium">$20/month for 50,000 emails</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Emails</span>
                  <span className="font-medium">~$0.001/email</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Includes delivery tracking, analytics, and dedicated IP options.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
