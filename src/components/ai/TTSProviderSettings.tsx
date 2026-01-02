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
  const hasGoogle = !!googleApiKey;
  const connectedProviders = [
    hasElevenLabs && 'elevenlabs',
    hasGoogle && 'google',
  ].filter(Boolean) as string[];

  const handleTestVoice = async () => {
    setIsTestingVoice(true);

    const speakWithBrowser = (text: string) => {
      if (!('speechSynthesis' in window)) return false;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    };

    const testText = "Hello! I'm your AI assistant. How can I help you today?";

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {
        text: testText,
      };

      switch (ttsProvider) {
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
        // ElevenLabs can hard-fail (e.g. blocked free-tier). Fall back to browser TTS for preview.
        if (endpoint === 'elevenlabs-tts' && response.status === 401) {
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
