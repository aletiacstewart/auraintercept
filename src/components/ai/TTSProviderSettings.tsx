import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Volume2, Play, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface TTSProviderSettingsProps {
  ttsProvider: string;
  setTtsProvider: (provider: string) => void;
  // OpenAI settings
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  openaiVoice: string;
  setOpenaiVoice: (voice: string) => void;
  openaiModel: string;
  setOpenaiModel: (model: string) => void;
  // Google settings
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;
  googleVoice: string;
  setGoogleVoice: (voice: string) => void;
  googleModel: string;
  setGoogleModel: (model: string) => void;
  // ElevenLabs status
  hasElevenLabs: boolean;
  companyId: string | null;
}

const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
  { id: 'echo', name: 'Echo', description: 'Male, warm' },
  { id: 'fable', name: 'Fable', description: 'British accent' },
  { id: 'onyx', name: 'Onyx', description: 'Male, deep' },
  { id: 'nova', name: 'Nova', description: 'Female, friendly' },
  { id: 'shimmer', name: 'Shimmer', description: 'Female, soft' },
];

const GOOGLE_VOICES = [
  { id: 'en-US-Neural2-D', name: 'Neural2-D', description: 'Male, American' },
  { id: 'en-US-Neural2-F', name: 'Neural2-F', description: 'Female, American' },
  { id: 'en-US-Neural2-A', name: 'Neural2-A', description: 'Male, American' },
  { id: 'en-US-Neural2-C', name: 'Neural2-C', description: 'Female, American' },
  { id: 'en-GB-Neural2-B', name: 'Neural2-B', description: 'Male, British' },
  { id: 'en-GB-Neural2-A', name: 'Neural2-A', description: 'Female, British' },
  { id: 'en-US-Wavenet-D', name: 'Wavenet-D', description: 'Male, WaveNet' },
  { id: 'en-US-Wavenet-F', name: 'Wavenet-F', description: 'Female, WaveNet' },
  { id: 'en-US-Standard-D', name: 'Standard-D', description: 'Male, Standard' },
  { id: 'en-US-Standard-F', name: 'Standard-F', description: 'Female, Standard' },
];

export function TTSProviderSettings({
  ttsProvider,
  setTtsProvider,
  openaiApiKey,
  openaiVoice,
  setOpenaiVoice,
  openaiModel,
  setOpenaiModel,
  googleApiKey,
  googleVoice,
  setGoogleVoice,
  googleModel,
  setGoogleModel,
  hasElevenLabs,
  companyId,
}: TTSProviderSettingsProps) {
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Check which providers are connected
  const hasOpenAI = !!openaiApiKey;
  const hasGoogle = !!googleApiKey;
  const connectedProviders = [
    hasElevenLabs && 'elevenlabs',
    hasOpenAI && 'openai',
    hasGoogle && 'google',
  ].filter(Boolean) as string[];

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    try {
      let endpoint = '';
      let body: Record<string, unknown> = {
        text: "Hello! I'm your AI assistant. How can I help you today?",
      };

      switch (ttsProvider) {
        case 'openai':
          endpoint = 'openai-tts';
          body = { ...body, api_key: openaiApiKey, voice: openaiVoice, model: openaiModel };
          break;
        case 'google':
          endpoint = 'google-tts';
          body = { ...body, api_key: googleApiKey, voice: googleVoice, model: googleModel };
          break;
        case 'elevenlabs':
        default:
          endpoint = 'elevenlabs-tts';
          body = { ...body, company_id: companyId };
          break;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
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
      console.error('Voice test error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to test voice');
    } finally {
      setIsTestingVoice(false);
    }
  };

  // No providers connected
  if (connectedProviders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Provider
          </CardTitle>
          <CardDescription>
            Configure your AI agent's voice for calls and reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No TTS provider configured. Set up a provider in Integrations first.</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href="/dashboard/integrations">
                  Go to Integrations <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Provider
        </CardTitle>
        <CardDescription>
          Select which connected TTS provider to use for AI voice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection - Only show connected providers */}
        <RadioGroup value={ttsProvider} onValueChange={setTtsProvider} className="space-y-3">
          {hasElevenLabs && (
            <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'elevenlabs' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <RadioGroupItem value="elevenlabs" id="elevenlabs" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="elevenlabs" className="font-medium cursor-pointer">ElevenLabs</Label>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Highest quality AI voices with voice cloning support.
                </p>
              </div>
            </div>
          )}

          {hasOpenAI && (
            <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'openai' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <RadioGroupItem value="openai" id="openai" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="openai" className="font-medium cursor-pointer">OpenAI TTS</Label>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  High-quality voices at a lower cost.
                </p>
              </div>
            </div>
          )}

          {hasGoogle && (
            <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'google' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <RadioGroupItem value="google" id="google" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="google" className="font-medium cursor-pointer">Google Cloud TTS</Label>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  1 million characters free per month.
                </p>
              </div>
            </div>
          )}
        </RadioGroup>

        {/* Voice selection for selected provider */}
        {ttsProvider === 'openai' && hasOpenAI && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={openaiVoice} onValueChange={setOpenaiVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <span>{voice.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">({voice.description})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={openaiModel} onValueChange={setOpenaiModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tts-1">TTS-1 (Fast)</SelectItem>
                    <SelectItem value="tts-1-hd">TTS-1 HD (Higher quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {ttsProvider === 'google' && hasGoogle && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={googleVoice} onValueChange={setGoogleVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOOGLE_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <span>{voice.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">({voice.description})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model Type</Label>
                <Select value={googleModel} onValueChange={setGoogleModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="wavenet">WaveNet</SelectItem>
                    <SelectItem value="neural2">Neural2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Test Voice Button */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/integrations">
              Configure more providers <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={handleTestVoice}
            disabled={isTestingVoice}
          >
            {isTestingVoice ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Voice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
