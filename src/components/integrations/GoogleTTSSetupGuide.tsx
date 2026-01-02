import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Volume2, Shield, CheckCircle, Settings, Key } from 'lucide-react';

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
          <Badge variant="secondary">Voice</Badge>
        </div>
        <CardDescription>
          Configure Google Cloud Text-to-Speech for enterprise-grade WaveNet and Neural2 voices at scale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Create Google Cloud Project */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">1</span>
            Create Google Cloud Project
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.cloud.google.com</a></li>
              <li>Click the project dropdown (top left, next to "Google Cloud")</li>
              <li>Click <strong>New Project</strong></li>
              <li>Enter a project name (e.g., "My Voice App")</li>
              <li>Click <strong>Create</strong></li>
              <li>Wait for creation, then select your new project from the dropdown</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                <strong>💡 First time?</strong> You may need to set up billing. Google offers $300 free credits for new accounts.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create New Project
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Enable Text-to-Speech API */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">2</span>
            Enable Text-to-Speech API
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to <a href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloud Text-to-Speech API</a></li>
              <li>Make sure your project is selected in the top dropdown</li>
              <li>Click <strong>Enable</strong></li>
              <li>Wait for the API to be enabled (usually a few seconds)</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-foreground">API Must Be Enabled First</span>
              </div>
              <p className="text-xs">API keys won't work until the Text-to-Speech API is enabled for your project.</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Enable API
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
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">APIs & Services → Credentials</a></li>
              <li>Click <strong>+ Create Credentials</strong> at the top</li>
              <li>Select <strong>API key</strong></li>
              <li>Your API key will be created and displayed</li>
              <li>Click <strong>Copy</strong> to copy it</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-foreground">API Key Format</span>
              </div>
              <code className="text-xs">AIzaSy.............................</code>
              <p className="text-xs text-muted-foreground">Starts with "AIza" followed by a long alphanumeric string</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create API Key
              </a>
            </Button>
          </div>
        </div>

        {/* Step 4: Restrict API Key (Recommended) */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">4</span>
            Restrict API Key (Recommended)
          </h3>
          <div className="ml-8 space-y-3 text-sm text-muted-foreground">
            <p>For security, restrict your API key to only the Text-to-Speech API:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Click on your newly created API key name</li>
              <li>Under <strong>API restrictions</strong>, select <strong>Restrict key</strong></li>
              <li>Check <strong>Cloud Text-to-Speech API</strong></li>
              <li>Click <strong>Save</strong></li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-foreground">Security Best Practice</span>
              </div>
              <p className="text-xs">Restricting your key prevents unauthorized use if it's ever exposed.</p>
            </div>
          </div>
        </div>

        {/* Step 5: Voice Types */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">5</span>
            Available Voice Types
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Standard Voices</span>
                  <Badge variant="outline">$4/1M chars</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Basic quality, lowest cost</p>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">WaveNet Voices</span>
                  <Badge variant="outline">$16/1M chars</Badge>
                </div>
                <p className="text-xs text-muted-foreground">High quality, natural sounding</p>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Neural2 Voices</span>
                  <Badge variant="outline">$16/1M chars</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Highest quality, most natural</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: Pricing */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm flex items-center justify-center">6</span>
            Pricing & Free Tier
          </h3>
          <div className="ml-8">
            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Free Tier: 1 million characters/month</span>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span>Standard voices</span>
                  <span className="font-medium">$4/1M chars</span>
                </div>
                <div className="flex justify-between">
                  <span>WaveNet / Neural2</span>
                  <span className="font-medium">$16/1M chars</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Google's free tier resets monthly. Best value for high-volume voice synthesis.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
