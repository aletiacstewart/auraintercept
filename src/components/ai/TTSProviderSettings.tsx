import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Volume2, Play, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface TTSProviderSettingsProps {
  ttsProvider: string;
  setTtsProvider: (provider: string) => void;
  // ElevenLabs status
  hasElevenLabs: boolean;
  companyId: string | null;
}

export function TTSProviderSettings({
  ttsProvider,
  setTtsProvider,
  hasElevenLabs,
  companyId,
}: TTSProviderSettingsProps) {
  const [isTestingVoice, setIsTestingVoice] = useState(false);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: testText, company_id: companyId }),
        }
      );

      if (!response.ok) {
        // ElevenLabs can hard-fail (e.g. blocked free-tier). Fall back to browser TTS for preview.
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
      console.error('Voice test error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to test voice');
    } finally {
      setIsTestingVoice(false);
    }
  };

  // No providers connected
  if (!hasElevenLabs) {
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
              <span>No TTS provider configured. Set up ElevenLabs in Integrations first.</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href="/dashboard/3rd-party-overview">
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
          ElevenLabs is configured for AI voice synthesis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start space-x-3 rounded-lg border border-primary bg-primary/5 p-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">ElevenLabs</span>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Connected</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Highest quality AI voices with voice cloning support.
            </p>
          </div>
        </div>

        {/* Test Voice Button */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/integrations">
              Manage integration <ExternalLink className="w-3 h-3 ml-1" />
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
