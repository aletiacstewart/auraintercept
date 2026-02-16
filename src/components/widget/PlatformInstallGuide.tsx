import React, { useState, forwardRef } from 'react';
import { getPublishedDomain } from '@/lib/url';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Code, FileCode, Link as LinkIcon, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformInstallGuideProps {
  companySlug: string;
}

type Platform = 'wordpress' | 'wix' | 'squarespace' | 'shopify' | 'weebly' | 'html';

const PLATFORM_INFO: Record<Platform, { name: string; color: string; description: string }> = {
  wordpress: { name: 'WordPress', color: 'bg-blue-500', description: 'Add to any page or site-wide via theme settings' },
  wix: { name: 'Wix', color: 'bg-purple-500', description: 'Use Embed Code element or Wix Editor' },
  squarespace: { name: 'Squarespace', color: 'bg-gray-800', description: 'Add via Code Injection in site settings' },
  shopify: { name: 'Shopify', color: 'bg-green-500', description: 'Add to theme.liquid or use a custom section' },
  weebly: { name: 'Weebly', color: 'bg-orange-500', description: 'Use Embed Code element in the editor' },
  html: { name: 'HTML', color: 'bg-red-500', description: 'Add directly to any HTML page' },
};

export const PlatformInstallGuide = forwardRef<HTMLDivElement, PlatformInstallGuideProps>(
  ({ companySlug }, ref) => {
    const { toast } = useToast();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('wordpress');

    const baseUrl = getPublishedDomain();
    const iframeSrc = `${baseUrl}/chat/${companySlug}?embed=true`;
    const directLink = `${baseUrl}/chat/${companySlug}`;
    const widgetUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-widget`;

    const copyToClipboard = async (code: string, label: string) => {
      await navigator.clipboard.writeText(code);
      setCopiedCode(label);
      toast({ title: 'Copied!', description: `${label} code copied to clipboard` });
      setTimeout(() => setCopiedCode(null), 2000);
    };

    const getIframeCode = () => `<iframe 
  src="${iframeSrc}" 
  width="400" 
  height="600" 
  style="border:none;border-radius:16px;position:fixed;bottom:20px;right:20px;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.2);"
  allow="microphone"
></iframe>`;

    const getScriptCode = () => `<script src="${widgetUrl}" data-company="${companySlug}" defer></script>`;

    const getPlatformCode = (platform: Platform): { code: string; instructions: string[] } => {
      const iframeCode = getIframeCode();

      switch (platform) {
        case 'wordpress':
          return {
            code: iframeCode,
            instructions: [
              'Go to your WordPress admin dashboard',
              'Navigate to Appearance → Customize → Additional CSS (for styling) or use a Custom HTML block',
              'Add a Custom HTML block to your page/post or use a plugin like "Insert Headers and Footers"',
              'Paste the code below into the HTML block or the Footer Scripts section',
              'For site-wide installation, add to footer.php in your theme or use a plugin',
            ],
          };
        case 'wix':
          return {
            code: iframeCode,
            instructions: [
              'Open your Wix Editor',
              'Click the + button to add elements',
              'Select "Embed Code" → "Embed HTML"',
              'Paste the code below into the HTML Settings',
              'Position the element where you want the chat to appear',
              'For a floating chat, set the HTML element position to fixed',
            ],
          };
        case 'squarespace':
          return {
            code: iframeCode,
            instructions: [
              'Go to your Squarespace dashboard',
              'Navigate to Settings → Advanced → Code Injection',
              'Paste the code in the Footer section for site-wide installation',
              'Alternatively, add a Code Block to individual pages',
              'Save and publish your changes',
            ],
          };
        case 'shopify':
          return {
            code: `<!-- Add this before </body> in theme.liquid -->
${iframeCode}`,
            instructions: [
              'Go to your Shopify admin',
              'Navigate to Online Store → Themes',
              'Click Actions → Edit code',
              'Find theme.liquid file',
              'Paste the code just before the closing </body> tag',
              'Save your changes',
            ],
          };
        case 'weebly':
          return {
            code: iframeCode,
            instructions: [
              'Open your Weebly editor',
              'Drag an "Embed Code" element onto your page',
              'Click "Edit Custom HTML"',
              'Paste the code below',
              'Click outside the element to save',
              'For site-wide, use Settings → SEO → Footer Code',
            ],
          };
        case 'html':
          return {
            code: `<!DOCTYPE html>
<html>
<head>
  <title>Your Website</title>
</head>
<body>
  <!-- Your website content -->
  
  <!-- Chat Widget - Add before closing body tag -->
  ${iframeCode}
</body>
</html>`,
            instructions: [
              'Open your HTML file in any text editor',
              'Find the closing </body> tag',
              'Paste the iframe code just before it',
              'Save and upload your file to your web server',
            ],
          };
        default:
          return { code: iframeCode, instructions: [] };
      }
    };

    const platformCode = getPlatformCode(selectedPlatform);

    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            AI Agent Virtual Assistant Installation Guides
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Step-by-step instructions for adding the AI Agent Virtual Assistant for Customers to your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selector */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_INFO) as Platform[]).map((platform) => (
              <Button
                key={platform}
                variant={selectedPlatform === platform ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(platform)}
                className="gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${PLATFORM_INFO[platform].color}`} />
                {PLATFORM_INFO[platform].name}
              </Button>
            ))}
          </div>

          {/* Selected Platform Instructions */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${PLATFORM_INFO[selectedPlatform].color}`} />
                  {PLATFORM_INFO[selectedPlatform].name} Installation
                </h4>
                <p className="text-sm text-muted-foreground">{PLATFORM_INFO[selectedPlatform].description}</p>
              </div>
              <Badge variant="secondary">{selectedPlatform === 'html' ? 'Universal' : 'Platform-specific'}</Badge>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Steps:</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {platformCode.instructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
            </div>

            {/* Code block */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Code to paste:</h5>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap border border-slate-700">
                  {platformCode.code}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(platformCode.code, PLATFORM_INFO[selectedPlatform].name)}
                >
                  {copiedCode === PLATFORM_INFO[selectedPlatform].name ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Embed Method Tabs */}
          <Tabs defaultValue="iframe" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="iframe" className="gap-2">
                <FileCode className="h-4 w-4" />
                Iframe
              </TabsTrigger>
              <TabsTrigger value="script" className="gap-2">
                <Code className="h-4 w-4" />
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <LinkIcon className="h-4 w-4" />
                Direct Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Recommended:</strong> Works on all platforms. Displays as a floating AI Assistant window.
              </p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap border border-slate-700">
                  {getIframeCode()}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getIframeCode(), 'Iframe')}
                >
                  {copiedCode === 'Iframe' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="script" className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Advanced:</strong> Creates a floating AI Assistant button with more customization options.
              </p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-slate-700">
                  {getScriptCode()}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getScriptCode(), 'Script')}
                >
                  {copiedCode === 'Script' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="link" className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Simple:</strong> Share as a direct link in emails, QR codes, or social media.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm truncate border border-slate-700">
                  {directLink}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(directLink, 'Link')}
                >
                  {copiedCode === 'Link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={directLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }
);

PlatformInstallGuide.displayName = 'PlatformInstallGuide';
