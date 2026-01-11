import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IframeEmbedCodeProps {
  companySlug: string;
}

export const IframeEmbedCode = ({ companySlug }: IframeEmbedCodeProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const iframeCode = `<iframe 
  src="${baseUrl}/chat/${companySlug}?embed=true" 
  width="400" 
  height="600" 
  style="border:none;border-radius:16px;position:fixed;bottom:20px;right:20px;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.2);"
  allow="microphone"
></iframe>`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Iframe embed code copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <Label>Iframe Embed (WordPress / Wix / Squarespace)</Label>
      <div className="relative">
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap border border-slate-700">
          {iframeCode}
        </pre>
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-foreground/70">
        Best for WordPress, Wix, Squarespace, and other website builders. 
        Simply paste into a Custom HTML block.
      </p>
    </div>
  );
};
