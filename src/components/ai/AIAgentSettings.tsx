import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mic, MessageSquare, Save, Loader2, RotateCcw, Play, Volume2, AlertCircle, ExternalLink, Gauge, Sparkles } from 'lucide-react';
import { VoiceCloningCard } from './VoiceCloningCard';
import { TTSProviderSettings } from './TTSProviderSettings';

// Popular ElevenLabs voices
const ELEVENLABS_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Male, British, warm' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Female, American, soft' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Male, British' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Female, American' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Male, Australian' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Female, Australian' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Female, American, expressive' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Male, American' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Female, British' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Male, British, deep' },
];

export const AIAgentSettings = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [voiceGreeting, setVoiceGreeting] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [isPreviewingGreeting, setIsPreviewingGreeting] = useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  
  // Voice settings
  const [voiceStability, setVoiceStability] = useState(0.5);
  const [voiceSimilarity, setVoiceSimilarity] = useState(0.75);
  const [voiceStyle, setVoiceStyle] = useState(0.5);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // TTS Provider settings
  const [ttsProvider, setTtsProvider] = useState('elevenlabs');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiVoice, setOpenaiVoice] = useState('alloy');
  const [openaiModel, setOpenaiModel] = useState('tts-1');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleVoice, setGoogleVoice] = useState('en-US-Neural2-D');
  const [googleModel, setGoogleModel] = useState('neural2');

  // Fetch company settings
  const { data: company, isLoading: isLoadingCompany } = useQuery({
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

  // Fetch integrations
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['integrations-elevenlabs', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('id, elevenlabs_api_key, elevenlabs_voice_id, elevenlabs_voice_stability, elevenlabs_voice_similarity, elevenlabs_voice_style, elevenlabs_voice_speed, tts_provider, openai_api_key, openai_tts_voice, openai_tts_model, google_tts_api_key, google_tts_voice, google_tts_model')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const hasElevenLabs = !!integrations?.elevenlabs_api_key;
  const isLoading = isLoadingCompany || isLoadingIntegrations;

  // Update local state when data loads
  useEffect(() => {
    if (company) {
      setVoiceGreeting(company.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?');
      setAgentPrompt(company.ai_agent_prompt || 'You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.');
    }
  }, [company]);

  // Update voice selection when integrations load
  useEffect(() => {
    if (integrations?.elevenlabs_voice_id) {
      const isPresetVoice = ELEVENLABS_VOICES.some(v => v.id === integrations.elevenlabs_voice_id);
      if (isPresetVoice) {
        setSelectedVoiceId(integrations.elevenlabs_voice_id);
        setUseCustomVoice(false);
      } else {
        setUseCustomVoice(true);
        setCustomVoiceId(integrations.elevenlabs_voice_id);
      }
    }
    // Load voice settings
    if (integrations) {
      setVoiceStability(integrations.elevenlabs_voice_stability ?? 0.5);
      setVoiceSimilarity(integrations.elevenlabs_voice_similarity ?? 0.75);
      setVoiceStyle(integrations.elevenlabs_voice_style ?? 0.5);
      setVoiceSpeed(integrations.elevenlabs_voice_speed ?? 1.0);
      // Load TTS provider settings
      setTtsProvider(integrations.tts_provider || 'elevenlabs');
      setOpenaiApiKey(integrations.openai_api_key || '');
      setOpenaiVoice(integrations.openai_tts_voice || 'alloy');
      setOpenaiModel(integrations.openai_tts_model || 'tts-1');
      setGoogleApiKey(integrations.google_tts_api_key || '');
      setGoogleVoice(integrations.google_tts_voice || 'en-US-Neural2-D');
      setGoogleModel(integrations.google_tts_model || 'neural2');
    }
  }, [integrations]);

  // Save company settings mutation
  const saveCompanyMutation = useMutation({
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
    },
  });

  // Save voice selection mutation
  const saveVoiceMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const voiceId = useCustomVoice ? customVoiceId : selectedVoiceId;
      
      const updateData: Record<string, unknown> = {
        elevenlabs_voice_id: voiceId,
        elevenlabs_voice_stability: voiceStability,
        elevenlabs_voice_similarity: voiceSimilarity,
        elevenlabs_voice_style: voiceStyle,
        elevenlabs_voice_speed: voiceSpeed,
        tts_provider: ttsProvider,
        openai_api_key: openaiApiKey || null,
        openai_tts_voice: openaiVoice,
        openai_tts_model: openaiModel,
        google_tts_api_key: googleApiKey || null,
        google_tts_voice: googleVoice,
        google_tts_model: googleModel,
      };

      if (integrations?.id) {
        const { error } = await supabase
          .from('tenant_integrations')
          .update(updateData)
          .eq('id', integrations.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_integrations')
          .insert({ company_id: companyId, ...updateData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-elevenlabs'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        saveCompanyMutation.mutateAsync(),
        saveVoiceMutation.mutateAsync(),
      ]);
      toast.success('AI Agent settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setVoiceGreeting('Hello! Thank you for calling. How can I assist you today?');
    setAgentPrompt('You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.');
    setSelectedVoiceId('JBFqnCBsd6RMkjVDRZzb');
    setUseCustomVoice(false);
    setCustomVoiceId('');
    setVoiceStability(0.5);
    setVoiceSimilarity(0.75);
    setVoiceStyle(0.5);
    setVoiceSpeed(1.0);
    setTtsProvider('elevenlabs');
    setOpenaiApiKey('');
    setOpenaiVoice('alloy');
    setOpenaiModel('tts-1');
    setGoogleApiKey('');
    setGoogleVoice('en-US-Neural2-D');
    setGoogleModel('neural2');
  };

  const handlePreviewGreeting = async () => {
    if (!hasElevenLabs) {
      toast.error('Please configure ElevenLabs in Integrations first');
      return;
    }

    setIsPreviewingGreeting(true);
    try {
      const voiceId = useCustomVoice ? customVoiceId : selectedVoiceId;
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
            voice_id: voiceId,
            voice_settings: {
              stability: voiceStability,
              similarity_boost: voiceSimilarity,
              style: voiceStyle,
              speed: voiceSpeed,
            },
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

  const handlePreviewVoice = async () => {
    if (!hasElevenLabs) {
      toast.error('Please configure ElevenLabs in Integrations first');
      return;
    }

    const voiceId = useCustomVoice ? customVoiceId : selectedVoiceId;
    if (!voiceId) {
      toast.error('Please select a voice');
      return;
    }

    setIsPreviewingVoice(true);
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
            text: "Hello! I'm your AI assistant. How can I help you today?",
            company_id: companyId,
            voice_id: voiceId,
            voice_settings: {
              stability: voiceStability,
              similarity_boost: voiceSimilarity,
              style: voiceStyle,
              speed: voiceSpeed,
            },
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
      toast.success('Playing voice preview');
    } catch (error) {
      console.error('Voice preview error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to preview voice');
    } finally {
      setIsPreviewingVoice(false);
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

  const isSaving = saveCompanyMutation.isPending || saveVoiceMutation.isPending;

  return (
    <div className="space-y-6">
      {/* TTS Provider Selection */}
      <TTSProviderSettings
        ttsProvider={ttsProvider}
        setTtsProvider={setTtsProvider}
        openaiApiKey={openaiApiKey}
        setOpenaiApiKey={setOpenaiApiKey}
        openaiVoice={openaiVoice}
        setOpenaiVoice={setOpenaiVoice}
        openaiModel={openaiModel}
        setOpenaiModel={setOpenaiModel}
        googleApiKey={googleApiKey}
        setGoogleApiKey={setGoogleApiKey}
        googleVoice={googleVoice}
        setGoogleVoice={setGoogleVoice}
        googleModel={googleModel}
        setGoogleModel={setGoogleModel}
        hasElevenLabs={hasElevenLabs}
        companyId={companyId}
      />

      {/* ElevenLabs Voice Selection Card - only show when ElevenLabs is selected */}
      {ttsProvider === 'elevenlabs' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            ElevenLabs Voice Settings
          </CardTitle>
          <CardDescription>
            Fine-tune your ElevenLabs voice settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasElevenLabs ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Configure ElevenLabs API key in Integrations to enable voice features.</span>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href="/dashboard/integrations">
                    Go to Integrations <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-3">
                <Label>Voice Selection</Label>
                <div className="flex gap-2">
                  <Select
                    value={useCustomVoice ? 'custom' : selectedVoiceId}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setUseCustomVoice(true);
                      } else {
                        setUseCustomVoice(false);
                        setSelectedVoiceId(value);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {ELEVENLABS_VOICES.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3 h-3 text-muted-foreground" />
                            <span>{voice.name}</span>
                            <span className="text-muted-foreground text-xs">({voice.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3 text-muted-foreground" />
                          <span>Custom Voice ID</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePreviewVoice}
                    disabled={isPreviewingVoice}
                    title="Preview voice"
                  >
                    {isPreviewingVoice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {useCustomVoice && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter custom Voice ID"
                      value={customVoiceId}
                      onChange={(e) => setCustomVoiceId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Find more voices at{' '}
                      <a
                        href="https://elevenlabs.io/voice-library"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        ElevenLabs Voice Library
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Voice Settings Sliders */}
              <div className="pt-4 border-t space-y-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  Voice Fine-Tuning
                </div>

                {/* Stability */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stability</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(voiceStability * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceStability]}
                    onValueChange={([value]) => setVoiceStability(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = more expressive & variable. Higher = more consistent.
                  </p>
                </div>

                {/* Similarity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Clarity + Similarity</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(voiceSimilarity * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceSimilarity]}
                    onValueChange={([value]) => setVoiceSimilarity(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How closely the AI matches the original voice characteristics.
                  </p>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1">
                      Style Exaggeration
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <span className="text-xs text-muted-foreground">{Math.round(voiceStyle * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceStyle]}
                    onValueChange={([value]) => setVoiceStyle(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values amplify the voice's unique style.
                  </p>
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Speaking Speed</Label>
                    <span className="text-xs text-muted-foreground">{voiceSpeed.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[voiceSpeed]}
                    onValueChange={([value]) => setVoiceSpeed(value)}
                    min={0.7}
                    max={1.2}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust speech rate. 1.0x is normal speed.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}

      {/* Greeting & Prompt Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            AI Agent Behavior
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
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
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

      {/* Voice Cloning Card */}
      <VoiceCloningCard hasElevenLabs={hasElevenLabs} />
    </div>
  );
};
