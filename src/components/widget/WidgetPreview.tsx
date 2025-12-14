import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const WidgetPreview = () => {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const [companySlug, setCompanySlug] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      const { data } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();
      if (data) setCompanySlug(data.slug);
    };
    fetchCompany();
  }, [companyId]);

  const widgetUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-widget`;
  const embedCode = `<script src="${widgetUrl}" data-company="${companySlug}" defer></script>`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Embed code copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Embeddable Chat Widget
          </CardTitle>
          <CardDescription>
            Add this code to your website to enable AI-powered customer chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Company Slug</Label>
            <Input value={companySlug} readOnly className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label>Embed Code</Label>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">
                {embedCode}
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
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Installation Instructions</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Copy the embed code above</li>
              <li>Paste it before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag on your website</li>
              <li>The chat widget will appear in the bottom-right corner</li>
              <li>Customize colors via your branding settings</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Test your widget before adding it to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg h-[500px] overflow-hidden border">
            {/* Mock website content */}
            <div className="p-8 space-y-4">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted/60 rounded w-full max-w-md" />
              <div className="h-4 bg-muted/60 rounded w-full max-w-sm" />
              <div className="h-32 bg-muted/40 rounded w-full max-w-lg mt-8" />
            </div>

            {/* Widget preview */}
            {isPreviewOpen && (
              <div className="absolute bottom-20 right-6 w-80 h-96 bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-4">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold flex-1">Your Company</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    ×
                  </Button>
                </div>
                <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground text-sm">
                  Hi! How can we help you today?
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Input placeholder="Type a message..." className="flex-1" disabled />
                  <Button size="icon" disabled>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Widget button */}
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
