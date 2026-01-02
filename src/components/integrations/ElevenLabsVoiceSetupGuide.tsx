import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Mic, Shield, CheckCircle, Volume2 } from 'lucide-react';

export function ElevenLabsVoiceSetupGuide() {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      toast.success('Copied to clipboard!');
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg">ElevenLabs Setup Guide</CardTitle>
          <Badge variant="secondary">Voice AI</Badge>
        </div>
        <CardDescription>
          Configure ElevenLabs for premium AI voice synthesis with natural emotions and multilingual support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Create Account */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">1</span>
            Create ElevenLabs Account
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">elevenlabs.io</a></li>
              <li>Click <strong>Sign Up</strong> in the top right</li>
              <li>Create account with email or Google/GitHub</li>
              <li>Verify your email address</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create ElevenLabs Account
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Get API Key */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">2</span>
            Get API Key
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Click your profile icon (bottom left of sidebar)</li>
              <li>Select <strong>Profile + API key</strong></li>
              <li>Or go directly to <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → API Keys</a></li>
              <li>Click the <strong>eye icon</strong> to reveal your API key</li>
              <li>Copy the key</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-foreground">API Key Location</span>
              </div>
              <p className="text-xs">Your API key is found under your profile settings, not in a separate API section.</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Get API Key
              </a>
            </Button>
          </div>
        </div>

        {/* Step 3: Choose a Voice */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">3</span>
            Choose a Voice
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Voice Library</a></li>
              <li>Browse thousands of voices or use pre-made ones</li>
              <li>Click <strong>Add to VoiceLab</strong> on voices you like</li>
              <li>Copy the <strong>Voice ID</strong> from VoiceLab</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-foreground">Popular Voice IDs</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Rachel:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 gap-1 text-xs"
                    onClick={() => copyToClipboard('21m00Tcm4TlvDq8ikWAM', 'rachel')}
                  >
                    {copiedItems['rachel'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    21m00Tcm...
                  </Button>
                </div>
                <div className="flex justify-between">
                  <span>Adam:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 gap-1 text-xs"
                    onClick={() => copyToClipboard('pNInz6obpgDQGcFmaJgB', 'adam')}
                  >
                    {copiedItems['adam'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    pNInz6ob...
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Browse Voice Library
              </a>
            </Button>
          </div>
        </div>

        {/* Step 4: Create Conversational AI Agent (Optional) */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">4</span>
            Create Conversational Agent (Optional)
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>For interactive voice agents that can handle conversations:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Conversational AI</a></li>
              <li>Click <strong>Create Agent</strong></li>
              <li>Configure your agent's voice, personality, and capabilities</li>
              <li>Copy the <strong>Agent ID</strong> (starts with "agent_")</li>
              <li>Configure webhook tools for booking/scheduling (see advanced guide)</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>💡 Pro tip:</strong> After connecting your API key, an advanced ElevenLabs Agent Setup Guide will appear with full webhook tool configuration.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create Agent
              </a>
            </Button>
          </div>
        </div>

        {/* Step 5: Pricing */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">5</span>
            Pricing & Usage
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Free Tier: 10,000 characters/month</span>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span>Starter Plan</span>
                  <span className="font-medium">$5/month (30K chars)</span>
                </div>
                <div className="flex justify-between">
                  <span>Creator Plan</span>
                  <span className="font-medium">$22/month (100K chars)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost per 1K chars</span>
                  <span className="font-medium">~$0.18-0.30</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Includes high-quality neural voices, 29+ languages, voice cloning, and conversational AI.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
