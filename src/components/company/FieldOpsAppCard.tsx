import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone, Download, Share, Plus, MoreVertical,
  Check, Apple, Chrome, Copy, AlertTriangle, ExternalLink, Settings
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isLovablePreviewOrigin, normalizePublicBaseUrl } from '@/lib/url';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function FieldOpsAppCard() {
  const { companyId } = useAuth();
  const [publicAppUrl, setPublicAppUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch company's public_app_url
  useEffect(() => {
    const fetchPublicUrl = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('companies')
        .select('public_app_url')
        .eq('id', companyId)
        .single();

      if (data?.public_app_url) {
        setPublicAppUrl(data.public_app_url);
      }
      setIsLoading(false);
    };

    fetchPublicUrl();
  }, [companyId]);

  const normalizedPublicBaseUrl = publicAppUrl ? normalizePublicBaseUrl(publicAppUrl) : null;

  // Determine base URL - prefer public URL (normalized to origin), fallback to current origin
  const baseUrl = normalizedPublicBaseUrl ?? window.location.origin;
  const isUsingPreviewUrl = !normalizedPublicBaseUrl || isLovablePreviewOrigin(baseUrl);

  // Add version param to bust cache on new builds
  const buildVersion = import.meta.env.VITE_BUILD_TIME || Date.now().toString(36);
  // Point to the standalone Field Ops App (lightweight AI Console PWA)
  const installUrl = `${baseUrl}/field-ops-app?source=qr&v=${buildVersion}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Field Operations Console App Install
            </CardTitle>
            <CardDescription className="mt-1 text-white/80">
              Quick-access AI Console for field technicians
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/30">
            PWA
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Section */}
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex flex-col items-center space-y-3">
            {/* Warning for preview URL */}
            {isUsingPreviewUrl && (
              <Alert variant="destructive" className="max-w-xs">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Install links can’t use a preview URL — phones will be redirected to a preview environment that requires an editor account.
                  {' '}
                  <Link to="/dashboard/quick-setup" className="underline font-medium inline-flex items-center gap-1">
                    Set your published app URL <Settings className="h-3 w-3" />
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="h-[188px] w-[188px] flex items-center justify-center text-muted-foreground bg-muted rounded-xl">
                Loading...
              </div>
            ) : isUsingPreviewUrl ? (
              <div className="h-[188px] w-[188px] flex items-center justify-center text-muted-foreground bg-muted rounded-xl text-center text-xs px-4">
                Set a public app URL to generate a scannable install QR code.
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCodeSVG 
                  value={installUrl} 
                  size={180}
                  level="M"
                  marginSize={2}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Install Link
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/field-ops-app', '_blank')}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview App
              </Button>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="flex-1 grid gap-4 md:grid-cols-2">
            {/* iOS Instructions */}
            <div className="p-4 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="h-4 w-4 text-card-foreground" />
                <span className="font-medium text-sm text-card-foreground">iPhone / iPad</span>
              </div>
              <ol className="space-y-2 text-xs text-card-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                  <span>Open in <strong className="text-card-foreground">Safari</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                  <span className="flex items-center gap-1">
                    Tap <Share className="h-3 w-3 text-card-foreground" /> Share
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                  <span className="flex items-center gap-1">
                    Tap <Plus className="h-3 w-3 text-card-foreground" /> Add to Home Screen
                  </span>
                </li>
              </ol>
            </div>

            {/* Android Instructions */}
            <div className="p-4 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Chrome className="h-4 w-4 text-card-foreground" />
                <span className="font-medium text-sm text-card-foreground">Android</span>
              </div>
              <ol className="space-y-2 text-xs text-card-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                  <span>Open in <strong className="text-card-foreground">Chrome</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                  <span className="flex items-center gap-1">
                    Tap <MoreVertical className="h-3 w-3 text-card-foreground" /> Menu
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                  <span>Tap "Install app"</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* App Features */}
        <div className="grid gap-3 grid-cols-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-card-foreground/70">Native Feel</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-card-foreground/70">Quick Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-card-foreground/70">Works Offline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
