import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Phone, 
  Mic, 
  Mail,
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
  fields: IntegrationField[];
  checkConnection: (data: Record<string, string>) => boolean;
}

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  required: boolean;
  helpText?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions for your customers.',
    icon: CreditCard,
    color: 'bg-purple-500',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [],
    checkConnection: () => false,
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Enable voice calls and SMS messaging for your AI agent.',
    icon: Phone,
    color: 'bg-red-500',
    docsUrl: 'https://console.twilio.com',
    fields: [
      { key: 'twilio_account_sid', label: 'Account SID', placeholder: 'AC...', type: 'text', required: true },
      { key: 'twilio_auth_token', label: 'Auth Token', placeholder: 'Your auth token', type: 'password', required: true },
      { key: 'twilio_phone_number', label: 'Phone Number', placeholder: '+1234567890', type: 'text', required: true, helpText: 'Your Twilio phone number in E.164 format' },
    ],
    checkConnection: (data) => !!(data.twilio_account_sid && data.twilio_auth_token && data.twilio_phone_number),
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Add natural-sounding AI voices to your phone calls.',
    icon: Mic,
    color: 'bg-blue-500',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'Your ElevenLabs API key', type: 'password', required: true },
      { key: 'elevenlabs_voice_id', label: 'Voice ID', placeholder: 'Voice ID (optional)', type: 'text', required: false, helpText: 'Leave blank to use default voice' },
      { key: 'elevenlabs_agent_id', label: 'Conversational AI Agent ID', placeholder: 'Agent ID for voice chat', type: 'text', required: false, helpText: 'Create an agent at elevenlabs.io/conversational-ai to get the Agent ID' },
    ],
    checkConnection: (data) => !!data.elevenlabs_api_key,
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Send email notifications for appointments and reminders.',
    icon: Mail,
    color: 'bg-emerald-500',
    docsUrl: 'https://resend.com/api-keys',
    fields: [
      { key: 'resend_api_key', label: 'API Key', placeholder: 're_...', type: 'password', required: true, helpText: 'Get your API key from resend.com/api-keys' },
    ],
    checkConnection: (data) => !!data.resend_api_key,
  },
];

export default function Integrations() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Fetch current integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Save integration mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (!companyId) throw new Error('No company ID');

      const payload = {
        company_id: companyId,
        ...data,
      };

      if (integrations?.id) {
        const { error } = await supabase
          .from('tenant_integrations')
          .update(payload)
          .eq('id', integrations.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_integrations')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration saved successfully!');
      setSelectedIntegration(null);
      setFormData({});
    },
    onError: (error) => {
      console.error('Error saving integration:', error);
      toast.error('Failed to save integration');
    },
  });

  const handleOpenSetup = (integration: Integration) => {
    // Pre-fill form with existing data
    const existingData: Record<string, string> = {};
    integration.fields.forEach((field) => {
      const value = integrations?.[field.key as keyof typeof integrations];
      if (value && typeof value === 'string') {
        existingData[field.key] = value;
      }
    });
    setFormData(existingData);
    setSelectedIntegration(integration);
  };

  const handleSave = () => {
    if (!selectedIntegration) return;

    // Validate required fields
    const missingFields = selectedIntegration.fields
      .filter((f) => f.required && !formData[f.key])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    saveMutation.mutate(formData);
  };

  const getConnectionStatus = (integration: Integration) => {
    if (!integrations) return false;
    const data: Record<string, string> = {};
    integration.fields.forEach((field) => {
      const value = integrations[field.key as keyof typeof integrations];
      if (value && typeof value === 'string') {
        data[field.key] = value;
      }
    });
    return integration.checkConnection(data);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to power your AI agent
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => {
            const isConnected = getConnectionStatus(integration);
            const Icon = integration.icon;

            return (
              <Card key={integration.id} className="border-border/50 relative overflow-hidden">
                {isConnected && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', integration.color)}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : integration.id === 'stripe' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Stripe is managed at the platform level. Contact your administrator for billing setup.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Stripe Dashboard
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant={isConnected ? 'outline' : 'default'}
                        className="w-full"
                        onClick={() => handleOpenSetup(integration)}
                      >
                        {isConnected ? 'Update Settings' : 'Connect'}
                      </Button>
                      <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Get API Keys
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Webhook Configuration */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Voice Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure your Twilio phone number to use the AI voice handler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Voice Webhook URL (for incoming calls)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText('https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming');
                    toast.success('Webhook URL copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set this as the "A CALL COMES IN" webhook in your Twilio phone number settings. Select HTTP POST.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status Callback URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=status`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText('https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=status');
                    toast.success('Status URL copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set this as the "STATUS CALLBACK URL" to track call status updates.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-border/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Twilio Setup</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Create a Twilio account at twilio.com</li>
                  <li>Get your Account SID and Auth Token from the Console</li>
                  <li>Purchase a phone number with Voice capabilities</li>
                  <li>Enter your credentials above</li>
                  <li>Go to Phone Numbers → Active Numbers</li>
                  <li>Configure the Voice webhook URL (copy from above)</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">ElevenLabs Setup</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Create an ElevenLabs account at elevenlabs.io</li>
                  <li>Go to Settings → API Keys</li>
                  <li>Generate a new API key</li>
                  <li>Optionally, select a voice from the Voice Library</li>
                  <li>For voice chat: Go to Conversational AI → Create Agent</li>
                  <li>Configure your agent and copy the Agent ID</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Resend Setup</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Create a Resend account at resend.com</li>
                  <li>Verify your email domain at resend.com/domains</li>
                  <li>Go to API Keys and create a new key</li>
                  <li>Enter your API key above</li>
                  <li>Test by creating an appointment with a customer email</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', selectedIntegration.color)}>
                    <selectedIntegration.icon className="w-4 h-4 text-white" />
                  </div>
                  Connect {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="space-y-4 pt-4">
              {selectedIntegration.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedIntegration(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
