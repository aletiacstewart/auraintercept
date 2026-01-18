import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { ElevenLabsSetupGuide } from '@/components/integrations/ElevenLabsSetupGuide';
import { ElevenLabsVoiceSetupGuide } from '@/components/integrations/ElevenLabsVoiceSetupGuide';
import { GoogleTTSSetupGuide } from '@/components/integrations/GoogleTTSSetupGuide';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Mic, Volume2, Check, ExternalLink, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  required: boolean;
  helpText?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
  fields: IntegrationField[];
  checkConnection: (data: Record<string, string>) => boolean;
  note?: string;
}

const VOICE_INTEGRATIONS: Integration[] = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Premium AI voice synthesis with natural emotions.',
    icon: Mic,
    color: 'bg-blue-500',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'Your ElevenLabs API key', type: 'password', required: true, helpText: 'Get from elevenlabs.io/app/settings/api-keys' },
      { key: 'elevenlabs_agent_id', label: 'Agent ID', placeholder: 'agent_... (or paste without the agent_ prefix)', type: 'text', required: false, helpText: 'Optional: Create in ElevenLabs Conversational AI. We accept either "agent_..." or the raw id.' },
    ],
    checkConnection: (data) => !!data.elevenlabs_api_key,
    note: '💡 Best for: High-quality, emotional voices. ~$0.30/1K chars. Choose if voice quality is priority.',
  },
  {
    id: 'google-tts',
    name: 'Google TTS',
    description: 'Enterprise-grade WaveNet voices.',
    icon: Volume2,
    color: 'bg-amber-500',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    fields: [
      { key: 'google_tts_api_key', label: 'API Key', placeholder: 'Your Google Cloud API key', type: 'password', required: true, helpText: 'Enable Cloud Text-to-Speech API first' },
    ],
    checkConnection: (data) => !!data.google_tts_api_key,
    note: '💡 Best for: Enterprise scale. $4-16/1M chars + 1M free/mo. Cheapest at high volume.',
  },
];

export default function VoiceIntegration() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

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

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (!companyId) throw new Error('No company ID');
      const payload = { company_id: companyId, ...data };
      if (integrations?.id) {
        const { error } = await supabase.from('tenant_integrations').update(payload).eq('id', integrations.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tenant_integrations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration saved!');
      setSelectedIntegration(null);
      setFormData({});
    },
    onError: () => toast.error('Failed to save integration'),
  });

  const handleOpenSetup = (integration: Integration) => {
    const existingData: Record<string, string> = {};
    integration.fields.forEach((field) => {
      const value = integrations?.[field.key as keyof typeof integrations];
      if (value && typeof value === 'string') existingData[field.key] = value;
    });
    setFormData(existingData);
    setSelectedIntegration(integration);
  };

  const handleSave = () => {
    if (!selectedIntegration) return;
    const missingFields = selectedIntegration.fields.filter((f) => f.required && !formData[f.key]).map((f) => f.label);
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
      if (value && typeof value === 'string') data[field.key] = value;
    });
    return integration.checkConnection(data);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Mic}
            title="Voice Integration"
            description="Configure AI voice synthesis for calls and reminders"
            action={
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/integrations">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            }
          />

          {/* ElevenLabs Setup Guide */}
          <ElevenLabsVoiceSetupGuide />

          {/* Google Cloud TTS Setup Guide */}
          <GoogleTTSSetupGuide />

          {/* Integration Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {VOICE_INTEGRATIONS.map((integration) => {
              const isConnected = getConnectionStatus(integration);
              const Icon = integration.icon;
              return (
                <Card key={integration.id} className="border-border/50 relative">
                  {isConnected && (
                    <Badge className="absolute top-3 right-3 bg-green-500/10 text-green-600 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', integration.color)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                    {integration.note && (
                      <p className="text-xs text-foreground/80 mb-3 p-2 rounded bg-muted border border-border">
                        {integration.note}
                      </p>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant={isConnected ? 'outline' : 'default'}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenSetup(integration)}
                        >
                          {isConnected ? 'Update' : 'Connect'}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ElevenLabs Voice Agent Setup Guide */}
          {integrations?.elevenlabs_api_key && companyId && (
            <ElevenLabsSetupGuide 
              companyId={companyId} 
              agentId={integrations?.elevenlabs_agent_id || undefined}
            />
          )}

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
                <DialogDescription>Enter your API credentials</DialogDescription>
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
                            {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedIntegration(null)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
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
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
