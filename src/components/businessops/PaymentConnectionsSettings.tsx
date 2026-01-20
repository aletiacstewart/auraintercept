import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Key, 
  Check, 
  ArrowLeft,
  Shield,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

interface PaymentConnectionsSettingsProps {
  companyId: string;
  onBack: () => void;
}

export function PaymentConnectionsSettings({ companyId, onBack }: PaymentConnectionsSettingsProps) {
  const queryClient = useQueryClient();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Fetch existing Stripe credentials
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['stripe-integration', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('stripe_publishable_key, stripe_secret_key, stripe_webhook_secret')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (integrations) {
      setPublishableKey(integrations.stripe_publishable_key || '');
      setSecretKey(integrations.stripe_secret_key || '');
      setWebhookSecret(integrations.stripe_webhook_secret || '');
    }
  }, [integrations]);

  const isEnabled = !!(integrations?.stripe_publishable_key && integrations?.stripe_secret_key);

  const saveMutation = useMutation({
    mutationFn: async (data: { 
      stripe_publishable_key: string; 
      stripe_secret_key: string; 
      stripe_webhook_secret: string | null;
    }) => {
      const { error } = await supabase
        .from('tenant_integrations')
        .upsert({
          company_id: companyId,
          stripe_publishable_key: data.stripe_publishable_key,
          stripe_secret_key: data.stripe_secret_key,
          stripe_webhook_secret: data.stripe_webhook_secret || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-integration', companyId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', companyId] });
      toast.success('Stripe settings saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save Stripe settings:', error);
      toast.error('Failed to save Stripe settings');
    },
  });

  const handleSave = async () => {
    if (!publishableKey.startsWith('pk_')) {
      toast.error('Invalid publishable key format. Should start with pk_');
      return;
    }
    if (!secretKey.startsWith('sk_')) {
      toast.error('Invalid secret key format. Should start with sk_');
      return;
    }

    saveMutation.mutate({
      stripe_publishable_key: publishableKey,
      stripe_secret_key: secretKey,
      stripe_webhook_secret: webhookSecret || null,
    });
  };

  const handleDisconnect = async () => {
    saveMutation.mutate({
      stripe_publishable_key: '',
      stripe_secret_key: '',
      stripe_webhook_secret: '',
    });
    setPublishableKey('');
    setSecretKey('');
    setWebhookSecret('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment Connections</h2>
            <p className="text-xs text-muted-foreground">Configure your Stripe account for invoicing</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className={`glass-panel ${isEnabled ? 'border-green-500/40' : 'border-accent/20'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                <CreditCard className={`h-5 w-5 ${isEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-medium">Your Stripe Account</h3>
                <p className="text-sm text-muted-foreground">
                  Accept payments directly on invoices
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={isEnabled 
                ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                : 'bg-muted text-muted-foreground'
              }
            >
              {isEnabled ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                'Not Connected'
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className="glass-panel border-accent/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4 text-accent" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Enter your Stripe API keys from the{' '}
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              Stripe Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Publishable Key</Label>
            <Input
              value={publishableKey}
              onChange={e => setPublishableKey(e.target.value)}
              placeholder="pk_live_..."
              className="font-mono text-sm bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Starts with pk_live_ or pk_test_
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Secret Key</Label>
            <div className="relative">
              <Input
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="font-mono text-sm bg-background/50 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts with sk_live_ or sk_test_. Never share this key.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Webhook Secret (Optional)</Label>
            <Input
              type="password"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="font-mono text-sm bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Required for automatic payment status updates
            </p>
          </div>

          <Alert className="bg-accent/5 border-accent/20">
            <Shield className="h-4 w-4 text-accent" />
            <AlertDescription className="text-xs text-muted-foreground">
              Your API keys are securely stored. Payments go directly to your Stripe account.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-2">
            {isEnabled ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  Disconnect
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Update Settings'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending || !publishableKey || !secretKey}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {saveMutation.isPending ? 'Connecting...' : 'Connect Stripe'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card className="glass-panel border-accent/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium">What You Can Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Accept credit card payments on invoices
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Automatic payment status tracking
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              Send payment links via email or SMS
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              View transaction history and refunds
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
