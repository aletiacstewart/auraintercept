import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    <Card className="guide-card guide-card-voice">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          <CardTitle className="text-lg">ElevenLabs Setup Guide</CardTitle>
          <Badge variant="secondary">Voice AI</Badge>
        </div>
        <CardDescription>
          Configure ElevenLabs for premium AI voice synthesis with natural emotions and multilingual support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Step 1: Create Account */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">1</Badge>
                Create ElevenLabs Account
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">elevenlabs.io</a></li>
                <li>Click <strong>Sign Up</strong> in the top right</li>
                <li>Create account with email or Google/GitHub</li>
                <li>Verify your email address</li>
              </ol>
              <a 
                href="https://elevenlabs.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create ElevenLabs Account <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Get API Key */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">2</Badge>
                Get API Key
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Click your profile icon (bottom left of sidebar)</li>
                <li>Select <strong>Profile + API key</strong></li>
                <li>Or go directly to <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Settings → API Keys</a></li>
                <li>Click the <strong>eye icon</strong> to reveal your API key</li>
                <li>Copy the key</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-foreground">API Key Location</span>
                </div>
                <p className="text-xs">Your API key is found under your profile settings, not in a separate API section.</p>
              </div>
              <a 
                href="https://elevenlabs.io/app/settings/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Choose a Voice */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">3</Badge>
                Choose a Voice
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Voice Library</a></li>
                <li>Browse thousands of voices or use pre-made ones</li>
                <li>Click <strong>Add to VoiceLab</strong> on voices you like</li>
                <li>Copy the <strong>Voice ID</strong> from VoiceLab</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
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
                    <span>Jessica:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 gap-1 text-xs"
                      onClick={() => copyToClipboard('cgSgspJ2msm6clMCkdW9', 'jessica')}
                    >
                      {copiedItems['jessica'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      cgSgspJ2...
                    </Button>
                  </div>
                </div>
              </div>
              <a 
                href="https://elevenlabs.io/voice-library" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Browse Voice Library <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Create Conversational Agent */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">4</Badge>
                Create Conversational Agent (Optional)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>For interactive voice agents that can handle conversations:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Conversational AI</a></li>
                <li>Click <strong>Create Agent</strong></li>
                <li>Configure your agent's voice, personality, and capabilities</li>
                <li>Copy the <strong>Agent ID</strong> (starts with "agent_")</li>
                <li>Configure webhook tools for booking/scheduling (see advanced guide)</li>
              </ol>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-destructive text-xs">
                  <strong>⚠️ Critical Timing Settings:</strong> In your agent's <strong>Conversational behavior</strong> section, set <strong>Eagerness</strong> to <strong>Patient</strong> and <strong>Spelling patience</strong> to <strong>Auto</strong>. Without this, the agent will cut off callers before they finish speaking their name or phone number.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  <strong>💡 Pro tip:</strong> After connecting your API key, an advanced ElevenLabs Agent Setup Guide will appear with full webhook tool configuration.
                </p>
              </div>
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create Agent <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: Pricing */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-blue-500 text-white border-blue-500">5</Badge>
                Pricing & Free Tier
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Free Tier: ~15 min/month (10K credits) — no card required</span>
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
                    <span>Pro Plan</span>
                    <span className="font-medium">$99/month (500K chars)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per 1K chars</span>
                    <span className="font-medium">~$0.18-0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pay-as-you-go</span>
                    <span className="font-medium">Available — billed directly by ElevenLabs</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Includes high-quality neural voices, 29+ languages, voice cloning, and conversational AI.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
