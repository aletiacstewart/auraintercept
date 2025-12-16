import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Volume2, Play, Loader2, DollarSign, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

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

const PRICING_INFO = {
  elevenlabs: { price: '$0.30/1K chars', quality: 'Highest', note: '~$22-99/mo typical' },
  openai: { price: '$0.015/1K chars', quality: 'High', note: '80% cheaper than ElevenLabs' },
  google: { price: '$0.004-0.016/1K chars', quality: 'Good', note: '1M chars free/month' },
};

export function TTSProviderSettings({
  ttsProvider,
  setTtsProvider,
  openaiApiKey,
  setOpenaiApiKey,
  openaiVoice,
  setOpenaiVoice,
  openaiModel,
  setOpenaiModel,
  googleApiKey,
  setGoogleApiKey,
  googleVoice,
  setGoogleVoice,
  googleModel,
  setGoogleModel,
  hasElevenLabs,
  companyId,
}: TTSProviderSettingsProps) {
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    try {
      let endpoint = '';
      let body: Record<string, unknown> = {
        text: "Hello! I'm your AI assistant. How can I help you today?",
      };

      switch (ttsProvider) {
        case 'openai':
          if (!openaiApiKey) {
            toast.error('Please enter your OpenAI API key first');
            return;
          }
          endpoint = 'openai-tts';
          body = { ...body, api_key: openaiApiKey, voice: openaiVoice, model: openaiModel };
          break;
        case 'google':
          if (!googleApiKey) {
            toast.error('Please enter your Google Cloud API key first');
            return;
          }
          endpoint = 'google-tts';
          body = { ...body, api_key: googleApiKey, voice: googleVoice, model: googleModel };
          break;
        case 'elevenlabs':
        default:
          if (!hasElevenLabs) {
            toast.error('Please configure ElevenLabs in Integrations first');
            return;
          }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          TTS Provider
          <Badge variant="outline" className="ml-2 text-xs">
            Cost Optimization
          </Badge>
        </CardTitle>
        <CardDescription>
          Choose your Text-to-Speech provider. OpenAI and Google Cloud offer significant cost savings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <RadioGroup value={ttsProvider} onValueChange={setTtsProvider} className="space-y-3">
          {/* ElevenLabs */}
          <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'elevenlabs' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <RadioGroupItem value="elevenlabs" id="elevenlabs" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="elevenlabs" className="font-medium cursor-pointer">ElevenLabs</Label>
                <Badge variant="secondary" className="text-xs">Premium</Badge>
                {hasElevenLabs && <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Connected</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Highest quality AI voices with voice cloning support.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {PRICING_INFO.elevenlabs.price}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {PRICING_INFO.elevenlabs.quality} quality
                </span>
              </div>
            </div>
          </div>

          {/* OpenAI TTS */}
          <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'openai' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <RadioGroupItem value="openai" id="openai" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="openai" className="font-medium cursor-pointer">OpenAI TTS</Label>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">80% Cheaper</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                High-quality voices at a fraction of the cost. Great balance of quality and price.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {PRICING_INFO.openai.price}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {PRICING_INFO.openai.quality} quality
                </span>
              </div>
            </div>
          </div>

          {/* Google Cloud TTS */}
          <div className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${ttsProvider === 'google' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <RadioGroupItem value="google" id="google" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="google" className="font-medium cursor-pointer">Google Cloud TTS</Label>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">Free Tier</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                1 million characters free per month. Best for high-volume usage.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {PRICING_INFO.google.price}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {PRICING_INFO.google.quality} quality
                </span>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Provider-specific settings */}
        {ttsProvider === 'openai' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  OpenAI Platform <ExternalLink className="h-3 w-3 inline" />
                </a>
              </p>
            </div>
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
                    <SelectItem value="tts-1">TTS-1 (Fast, cheaper)</SelectItem>
                    <SelectItem value="tts-1-hd">TTS-1 HD (Higher quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {ttsProvider === 'google' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Google Cloud API Key</Label>
              <Input
                type="password"
                placeholder="Your Google Cloud API key"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google Cloud Console <ExternalLink className="h-3 w-3 inline" />
                </a>
                . Enable the Cloud Text-to-Speech API first.
              </p>
            </div>
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
                    <SelectItem value="standard">Standard ($4/1M chars)</SelectItem>
                    <SelectItem value="wavenet">WaveNet ($16/1M chars)</SelectItem>
                    <SelectItem value="neural2">Neural2 ($16/1M chars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {ttsProvider === 'elevenlabs' && !hasElevenLabs && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Configure ElevenLabs API key in Integrations to use this provider.</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href="/dashboard/integrations">
                  Go to Integrations <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Voice Button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={handleTestVoice}
            disabled={isTestingVoice || (ttsProvider === 'elevenlabs' && !hasElevenLabs) || (ttsProvider === 'openai' && !openaiApiKey) || (ttsProvider === 'google' && !googleApiKey)}
          >
            {isTestingVoice ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Voice
          </Button>
        </div>

        {/* Cost Comparison */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h4 className="text-sm font-medium">Monthly Cost Estimate (100 appointments, 2 reminders each)</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`p-2 rounded ${ttsProvider === 'elevenlabs' ? 'bg-primary/10 ring-1 ring-primary' : ''}`}>
              <p className="text-lg font-bold">~$22</p>
              <p className="text-xs text-muted-foreground">ElevenLabs</p>
            </div>
            <div className={`p-2 rounded ${ttsProvider === 'openai' ? 'bg-primary/10 ring-1 ring-primary' : ''}`}>
              <p className="text-lg font-bold text-green-600">~$3</p>
              <p className="text-xs text-muted-foreground">OpenAI TTS</p>
            </div>
            <div className={`p-2 rounded ${ttsProvider === 'google' ? 'bg-primary/10 ring-1 ring-primary' : ''}`}>
              <p className="text-lg font-bold text-blue-600">~$0*</p>
              <p className="text-xs text-muted-foreground">Google (free tier)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            * Within free tier limits (1M chars/month)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
