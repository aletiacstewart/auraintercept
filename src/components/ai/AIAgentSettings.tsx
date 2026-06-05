import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIndustryVoiceGreeting } from '@/lib/industryVoiceGreetings';
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
import { Mic, MessageSquare, Save, Loader2, RotateCcw, Play, Volume2, AlertCircle, ExternalLink, Gauge, Sparkles, Phone, MessageCircle, FileText } from 'lucide-react';
import { Languages } from 'lucide-react';
import { VoiceCloningCard } from './VoiceCloningCard';
import { TTSProviderSettings } from './TTSProviderSettings';
import { AIContentButton, ContentType } from './AIContentButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Script template presets
const SCRIPT_TEMPLATES: Record<string, { label: string; templates: { name: string; text: string }[] }> = {
  missed_call_sms: {
    label: 'Missed Call SMS',
    templates: [
      { name: 'Professional', text: 'We missed your call at {companyName}. Reply here or call us back and we\'ll be happy to assist.' },
      { name: 'Friendly', text: 'Hey! We saw we missed your call at {companyName}. Text us back or give us a ring — we\'re here to help! 😊' },
      { name: 'Urgent', text: 'We missed your call at {companyName}. We\'re available now — call or text us back for immediate assistance.' },
    ],
  },
  missed_call_callback: {
    label: 'Missed Call Callback',
    templates: [
      { name: 'Professional', text: 'Hello, this is {companyName} returning your call. We noticed we missed your call and wanted to follow up. How can we help you today?' },
      { name: 'Friendly', text: 'Hi there! This is {companyName} calling you back. Sorry we missed you earlier! What can we do for you?' },
    ],
  },
  reminder_call: {
    label: 'Appointment Reminder',
    templates: [
      { name: 'Standard', text: 'Hi {customerName}, this is {companyName} reminding you about your {service} appointment on {dateTime} with {employeeName}. Press 1 to confirm or 2 to reschedule.' },
      { name: 'Brief', text: 'Hi {customerName}, reminder: {service} on {dateTime}. Press 1 to confirm, 2 to reschedule.' },
      { name: 'Detailed', text: 'Hello {customerName}, this is {companyName}. We\'re looking forward to your {service} appointment scheduled for {dateTime}. {employeeName} will be assisting you. Press 1 to confirm, 2 to reschedule, or 3 to speak with someone.' },
    ],
  },
  followup_call: {
    label: 'Follow-up Call',
    templates: [
      { name: 'Professional', text: 'Hello {customerName}, this is {companyName} following up on your recent service. We hope everything went well. Press 1 if you were satisfied, or 2 to speak with a manager.' },
      { name: 'Friendly', text: 'Hi {customerName}! {companyName} here. We just wanted to check in after your recent visit. How did everything go? Press 1 for great, 2 if we can improve.' },
    ],
  },
  default_outbound: {
    label: 'Default Outbound',
    templates: [
      { name: 'Professional', text: 'Hello {customerName}, this is {companyName}. Thank you for your time. How can we assist you today?' },
      { name: 'Friendly', text: 'Hi {customerName}! This is {companyName} reaching out. We\'d love to help — what can we do for you?' },
    ],
  },
};

// Reusable ScriptField component with AI generation and template dropdown
function ScriptField({
  id,
  icon,
  label,
  value,
  onChange,
  placeholder,
  tokens,
  contentType,
  templateKey,
  companyId,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  tokens: string[];
  contentType: ContentType;
  templateKey: string;
  companyId: string | null;
}) {
  const templates = SCRIPT_TEMPLATES[templateKey]?.templates || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <div className="flex items-center gap-1">
          {templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {templates.map((t) => (
                  <DropdownMenuItem key={t.name} onClick={() => onChange(t.text)}>
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <AIContentButton
            contentType={contentType}
            existingContent={value}
            onGenerate={onChange}
            context={{ companyName: companyId || undefined }}
          />
        </div>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
      />
      <p className="text-xs text-white">
        Tokens: {tokens.map((token) => (
          <code key={token} className="bg-muted px-1 rounded mr-1">{token}</code>
        ))}
      </p>
    </div>
  );
}

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

  // Script templates
  const [missedCallSmsTemplate, setMissedCallSmsTemplate] = useState('');
  const [missedCallCallbackScript, setMissedCallCallbackScript] = useState('');
  const [reminderCallScript, setReminderCallScript] = useState('');
  const [followupCallScript, setFollowupCallScript] = useState('');
  const [defaultOutboundScript, setDefaultOutboundScript] = useState('');

  // Language preferences
  const [defaultLanguage, setDefaultLanguage] = useState<'en' | 'es' | 'auto'>('en');
  const [spanishEnabled, setSpanishEnabled] = useState(false);

  // Fetch company settings
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-ai-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('ai_voice_greeting, ai_agent_prompt, missed_call_sms_template, missed_call_callback_script, reminder_call_script, followup_call_script, default_outbound_script, default_language, supported_languages')
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
        .from('tenant_integrations_safe')
        .select('id, has_elevenlabs, elevenlabs_voice_id, elevenlabs_voice_stability, elevenlabs_voice_similarity, elevenlabs_voice_style, elevenlabs_voice_speed, tts_provider')
        .eq('company_id', companyId)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const hasElevenLabs = !!integrations?.has_elevenlabs;
  const isLoading = isLoadingCompany || isLoadingIntegrations;

  // Update local state when data loads
  useEffect(() => {
    if (company) {
      setVoiceGreeting(company.ai_voice_greeting || 'Hello! Thank you for calling. How can I assist you today?');
      setAgentPrompt(company.ai_agent_prompt || 'You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.');
      setMissedCallSmsTemplate((company as any).missed_call_sms_template || '');
      setMissedCallCallbackScript((company as any).missed_call_callback_script || '');
      setReminderCallScript((company as any).reminder_call_script || '');
      setFollowupCallScript((company as any).followup_call_script || '');
      setDefaultOutboundScript((company as any).default_outbound_script || '');
      const dl = (company as any).default_language;
      if (dl === 'en' || dl === 'es' || dl === 'auto') setDefaultLanguage(dl);
      const sl = (company as any).supported_languages;
      setSpanishEnabled(Array.isArray(sl) ? sl.includes('es') : false);
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
    if (integrations) {
      setVoiceStability(integrations.elevenlabs_voice_stability ?? 0.5);
      setVoiceSimilarity(integrations.elevenlabs_voice_similarity ?? 0.75);
      setVoiceStyle(integrations.elevenlabs_voice_style ?? 0.5);
      setVoiceSpeed(integrations.elevenlabs_voice_speed ?? 1.0);
      // Load TTS provider settings
      setTtsProvider(integrations.tts_provider || 'elevenlabs');
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
          missed_call_sms_template: missedCallSmsTemplate || null,
          missed_call_callback_script: missedCallCallbackScript || null,
          reminder_call_script: reminderCallScript || null,
          followup_call_script: followupCallScript || null,
          default_outbound_script: defaultOutboundScript || null,
          default_language: defaultLanguage,
          supported_languages: spanishEnabled || defaultLanguage !== 'en'
            ? Array.from(new Set(['en', 'es']))
            : ['en'],
        } as any)
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
    setMissedCallSmsTemplate('');
    setMissedCallCallbackScript('');
    setReminderCallScript('');
    setFollowupCallScript('');
    setDefaultOutboundScript('');
  };

  const handlePreviewGreeting = async () => {
    if (!hasElevenLabs) {
      toast.error('Please configure ElevenLabs in Integrations first');
      return;
    }

    const { speakSimple } = await import('@/lib/browserTts');
    const speakWithBrowser = (text: string) => speakSimple(text);

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
        // ElevenLabs can be blocked (401) on free tier; allow preview using browser TTS.
        if (response.status === 401) {
          const raw = await response.text().catch(() => '');
          const played = speakWithBrowser(voiceGreeting);
          toast.error(
            raw.toLowerCase().includes('unusual activity')
              ? 'ElevenLabs blocked this key (unusual activity). Using browser voice for preview.'
              : 'ElevenLabs unavailable. Using browser voice for preview.'
          );
          if (played) return;
        }

        let message = 'Failed to generate voice preview';
        try {
          const errJson = await response.json();
          message = errJson.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
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

    const { speakSimple } = await import('@/lib/browserTts');
    const speakWithBrowser = (text: string) => speakSimple(text);

    const testText = "Hello! I'm your AI assistant. How can I help you today?";

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
            text: testText,
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
        if (response.status === 401) {
          const raw = await response.text().catch(() => '');
          const played = speakWithBrowser(testText);
          toast.error(
            raw.toLowerCase().includes('unusual activity')
              ? 'ElevenLabs blocked this key (unusual activity). Using browser voice for preview.'
              : 'ElevenLabs unavailable. Using browser voice for preview.'
          );
          if (played) return;
        }

        let message = 'Failed to generate voice preview';
        try {
          const errJson = await response.json();
          message = errJson.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
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
                  <a href="/dashboard/3rd-party-overview">
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
                            <Volume2 className="w-3 h-3 text-white" />
                            <span>{voice.name}</span>
                            <span className="text-white text-xs">({voice.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3 text-white" />
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
                    <p className="text-xs text-white">
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
                  <Gauge className="h-4 w-4 text-white" />
                  Voice Fine-Tuning
                </div>

                {/* Stability */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stability</Label>
                    <span className="text-xs text-white">{Math.round(voiceStability * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceStability]}
                    onValueChange={([value]) => setVoiceStability(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-white">
                    Lower = more expressive & variable. Higher = more consistent.
                  </p>
                </div>

                {/* Similarity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Clarity + Similarity</Label>
                    <span className="text-xs text-white">{Math.round(voiceSimilarity * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceSimilarity]}
                    onValueChange={([value]) => setVoiceSimilarity(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-white">
                    How closely the AI matches the original voice characteristics.
                  </p>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1">
                      Style Exaggeration
                      <Sparkles className="h-3 w-3 text-white" />
                    </Label>
                    <span className="text-xs text-white">{Math.round(voiceStyle * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceStyle]}
                    onValueChange={([value]) => setVoiceStyle(value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-white">
                    Higher values amplify the voice's unique style.
                  </p>
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Speaking Speed</Label>
                    <span className="text-xs text-white">{voiceSpeed.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[voiceSpeed]}
                    onValueChange={([value]) => setVoiceSpeed(value)}
                    min={0.7}
                    max={1.2}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-white">
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
                <Volume2 className="h-4 w-4 text-white" />
                Voice Greeting
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!companyId) return;
                  const { data: c } = await supabase
                    .from('companies')
                    .select('industry_vertical, name')
                    .eq('id', companyId)
                    .maybeSingle();
                  setVoiceGreeting(getIndustryVoiceGreeting(c?.industry_vertical, c?.name));
                }}
              >
                Reset to industry default
              </Button>
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
            <p className="text-xs text-white">
              This is what the AI agent will say when someone calls your business. Keep it friendly and concise.
            </p>
          </div>

          {/* Agent System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="agent-prompt" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-white" />
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
            <p className="text-xs text-white">
              This guides how your AI agent responds. Include your business tone, special instructions, and any restrictions.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Call & SMS Scripts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call & SMS Scripts
          </CardTitle>
          <CardDescription>
            Customize the messages your AI agent uses for outbound calls and SMS. Use the AI button to generate or the templates dropdown for quick presets. Leave blank to use defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Missed Call SMS */}
          <ScriptField
            id="missed-call-sms"
            icon={<MessageCircle className="h-4 w-4 text-white" />}
            label="Missed Call SMS"
            value={missedCallSmsTemplate}
            onChange={setMissedCallSmsTemplate}
            placeholder="Hi, we noticed we missed your call at {companyName}. How can we help? Reply to this message or call us back at your convenience."
            tokens={['{companyName}']}
            contentType="missed_call_sms"
            templateKey="missed_call_sms"
            companyId={companyId}
          />

          {/* Missed Call Callback Script */}
          <ScriptField
            id="missed-call-callback"
            icon={<Phone className="h-4 w-4 text-white" />}
            label="Missed Call Callback Script"
            value={missedCallCallbackScript}
            onChange={setMissedCallCallbackScript}
            placeholder="Hello, this is {companyName} returning your call. We noticed we missed your call and wanted to follow up. How can we help you today?"
            tokens={['{companyName}']}
            contentType="missed_call_callback"
            templateKey="missed_call_callback"
            companyId={companyId}
          />

          {/* Appointment Reminder Script */}
          <ScriptField
            id="reminder-script"
            icon={<Phone className="h-4 w-4 text-white" />}
            label="Appointment Reminder Script"
            value={reminderCallScript}
            onChange={setReminderCallScript}
            placeholder="Hello {customerName}, this is a reminder about your {service} appointment on {dateTime}. {employeeName} will be your technician. Press 1 to confirm, or 2 to request a callback."
            tokens={['{customerName}', '{service}', '{dateTime}', '{employeeName}', '{companyName}']}
            contentType="reminder_call"
            templateKey="reminder_call"
            companyId={companyId}
          />

          {/* Follow-up Call Script */}
          <ScriptField
            id="followup-script"
            icon={<Phone className="h-4 w-4 text-white" />}
            label="Follow-up Call Script"
            value={followupCallScript}
            onChange={setFollowupCallScript}
            placeholder="Hello {customerName}, we're following up regarding your recent service. We'd love to hear about your experience. Press 1 if you were satisfied, or 2 to speak with a manager."
            tokens={['{customerName}', '{companyName}']}
            contentType="followup_call"
            templateKey="followup_call"
            companyId={companyId}
          />

          {/* Default Outbound Script */}
          <ScriptField
            id="default-outbound"
            icon={<Phone className="h-4 w-4 text-white" />}
            label="Default Outbound Script"
            value={defaultOutboundScript}
            onChange={setDefaultOutboundScript}
            placeholder="Hello {customerName}, thank you for your time."
            tokens={['{customerName}', '{companyName}']}
            contentType="default_outbound"
            templateKey="default_outbound"
            companyId={companyId}
          />
        </CardContent>
      </Card>

      {/* Voice Cloning Card */}
      <VoiceCloningCard hasElevenLabs={hasElevenLabs} />

      {/* Save / Reset Actions */}
      <div className="flex gap-3 pt-4 pb-2 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 -mx-4 py-4">
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
    </div>
  );
};
