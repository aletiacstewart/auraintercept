import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Volume2, Shield, Settings, CheckCircle } from 'lucide-react';

export function GoogleTTSSetupGuide() {
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
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-lg">Google Cloud TTS Setup Guide</CardTitle>
          <Badge variant="secondary">Voice Synthesis</Badge>
        </div>
        <CardDescription>
          Configure Google Cloud Text-to-Speech for enterprise-grade WaveNet voices. Best for high-volume usage with free tier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Create GCP Project */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">1</span>
            Create Google Cloud Project
          </h3>
          <div className="ml-8 space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
              <li>Click the project dropdown at the top → <strong>New Project</strong></li>
              <li>Enter a project name (e.g., "My Business Voice")</li>
              <li>Click <strong>Create</strong> and wait for project creation</li>
              <li>Make sure the new project is selected</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create New Project
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Enable API */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">2</span>
            Enable Text-to-Speech API
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <strong>APIs & Services → Library</strong></li>
              <li>Search for <strong>"Cloud Text-to-Speech API"</strong></li>
              <li>Click on it and press <strong>Enable</strong></li>
              <li>Wait for the API to be enabled (a few seconds)</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>💡 Note:</strong> You may need to enable billing on your project first. Google offers $300 free credits for new accounts.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com" target="_blank" rel="noopener noreferrer">
                <Settings className="w-4 h-4" />
                Enable TTS API
              </a>
            </Button>
          </div>
        </div>

        {/* Step 3: Create API Key */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">3</span>
            Create API Key
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <strong>APIs & Services → Credentials</strong></li>
              <li>Click <strong>+ Create Credentials</strong> at the top</li>
              <li>Select <strong>API Key</strong></li>
              <li>Your API key will be created and displayed</li>
              <li>Click <strong>Edit API Key</strong> to add restrictions (recommended)</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-foreground">Recommended Restrictions</span>
              </div>
              <ul className="list-disc ml-4 space-y-1 text-xs">
                <li><strong>Application restrictions:</strong> HTTP referrers (for web apps) or IP addresses (for servers)</li>
                <li><strong>API restrictions:</strong> Restrict to "Cloud Text-to-Speech API" only</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create Credentials
              </a>
            </Button>
          </div>
        </div>

        {/* Step 4: Voice Options */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">4</span>
            Available Voice Types
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <div className="grid gap-2">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">Standard Voices</span>
                  <Badge variant="outline">$4/1M chars</Badge>
                </div>
                <p className="text-xs">Basic TTS voices, good for simple use cases</p>
              </div>
              <div className="bg-muted p-3 rounded-lg border-2 border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">WaveNet Voices</span>
                  <Badge variant="outline">$16/1M chars</Badge>
                </div>
                <p className="text-xs">Neural network-based, more natural sounding</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">Neural2 Voices</span>
                  <Badge variant="outline">$16/1M chars</Badge>
                </div>
                <p className="text-xs">Latest generation, highest quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Pricing */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">5</span>
            Pricing & Free Tier
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Free Tier: 1 Million characters/month</span>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">After free tier:</p>
                <div className="flex justify-between">
                  <span>Standard Voices</span>
                  <span className="font-medium">$4.00 per 1M characters</span>
                </div>
                <div className="flex justify-between">
                  <span>WaveNet/Neural2</span>
                  <span className="font-medium">$16.00 per 1M characters</span>
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-xs">
                <p className="text-green-600 dark:text-green-400">
                  <strong>💡 For most businesses:</strong> The free tier (1M chars/month) covers ~16 hours of audio or ~2,000 reminder calls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
