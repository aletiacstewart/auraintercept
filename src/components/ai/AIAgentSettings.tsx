import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Mic, MessageSquare, Save, Loader2, RotateCcw, Play, Volume2 } from 'lucide-react';

export const AIAgentSettings = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [voiceGreeting, setVoiceGreeting] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [isPreviewingGreeting, setIsPreviewingGreeting] = useState(false);

  // Fetch company settings
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-ai-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('ai_voice_greeting, ai_agent_prompt')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch integrations to check if ElevenLabs is configured
  const { data: integrations } = useQuery({
    queryKey: ['integrations-elevenlabs', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_voice_id')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const hasElevenLabs = !!integrations?.elevenlabs_api_key;

  // Update local state when data loads
  useEffect(() => {
    if (company) {
      setVoiceGreeting(company.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?');
      setAgentPrompt(company.ai_agent_prompt || 'You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.');
    }
  }, [company]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const { error } = await supabase
        .from('companies')
        .update({
          ai_voice_greeting: voiceGreeting,
          ai_agent_prompt: agentPrompt,
        })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-ai-settings'] });
      toast.success('AI Agent settings saved!');
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    },
  });

  const handleReset = () => {
    setVoiceGreeting('Hello! Thank you for calling. How can I assist you today?');
    setAgentPrompt('You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.');
  };

  const handlePreviewGreeting = async () => {
    if (!hasElevenLabs) {
      toast.error('Please configure ElevenLabs in Integrations to preview voice');
      return;
    }

    setIsPreviewingGreeting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: voiceGreeting,
            company_id: companyId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate voice preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      toast.success('Playing greeting preview');
    } catch (error) {
      console.error('Greeting preview error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to preview greeting');
    } finally {
      setIsPreviewingGreeting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          AI Agent Settings
        </CardTitle>
        <CardDescription>
          Configure how your AI agent greets callers and responds to inquiries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Greeting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-greeting" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              Voice Greeting
            </Label>
            {hasElevenLabs && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewGreeting}
                disabled={isPreviewingGreeting || !voiceGreeting.trim()}
              >
                {isPreviewingGreeting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="ml-1">Preview</span>
              </Button>
            )}
          </div>
          <Textarea
            id="voice-greeting"
            value={voiceGreeting}
            onChange={(e) => setVoiceGreeting(e.target.value)}
            placeholder="Enter the greeting message your AI agent will say when answering calls..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This is what the AI agent will say when someone calls your business. Keep it friendly and concise.
          </p>
        </div>

        {/* Agent System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="agent-prompt" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            AI Agent Personality & Instructions
          </Label>
          <Textarea
            id="agent-prompt"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="Enter instructions for how your AI agent should behave and respond..."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This guides how your AI agent responds. Include your business tone, special instructions, and any restrictions.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saveMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
