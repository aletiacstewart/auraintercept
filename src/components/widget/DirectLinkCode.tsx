import { useState } from 'react';
import { getPublishedDomain } from '@/lib/url';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DirectLinkCodeProps {
  companySlug: string;
}

export const DirectLinkCode = ({ companySlug }: DirectLinkCodeProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const baseUrl = getPublishedDomain();
  const directLink = `${baseUrl}/chat/${companySlug}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(directLink);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Direct link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <Label>Direct Link (QR Codes / Marketing)</Label>
      <div className="flex gap-2">
        <div className="flex-1 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm truncate border border-slate-700">
          {directLink}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          asChild
        >
          <a href={directLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <p className="text-xs text-foreground/70">
        Use this link for QR codes, email signatures, social media, or as a "Chat with us" button.
      </p>
    </div>
  );
};
