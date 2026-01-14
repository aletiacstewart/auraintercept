import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import {
  Smartphone, Download, Share, Plus, MoreVertical,
  Check, Apple, Chrome, Copy, AlertTriangle, ExternalLink, Settings, Briefcase
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isLovablePreviewOrigin, normalizePublicBaseUrl } from '@/lib/url';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function BusinessMgtOpsAppCard() {
  const { companyId } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
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
  const installUrl = `${baseUrl}/business-mgt-ops-app?v=${buildVersion}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6">
      {isInstalled ? (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">App Installed!</h3>
                <p className="text-muted-foreground">
                  You're using Business Mgt Ops as a standalone app
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Install Button for Android/Chrome */}
          {deferredPrompt && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg">Install Business Mgt Ops</h3>
                    <p className="text-muted-foreground text-sm">
                      Add to your home screen for quick access
                    </p>
                  </div>
                  <Button size="lg" onClick={handleInstallClick} className="gap-2">
                    <Download className="h-4 w-4" />
                    Install Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform-specific instructions */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* iOS Instructions */}
            <Card className={platform === 'ios' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Apple className="h-5 w-5 text-card-foreground" />
                  iPhone / iPad
                  {platform === 'ios' && (
                    <Badge variant="secondary" className="ml-2">Your Device</Badge>
                  )}
                </CardTitle>
                <CardDescription>Install via Safari browser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
                    <span className="text-card-foreground">Open this page in <strong>Safari</strong> (required for iOS)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                    <span className="flex items-center gap-1 text-card-foreground">
                      Tap the <Share className="h-4 w-4 inline text-card-foreground" /> Share button
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                    <span className="flex items-center gap-1 text-card-foreground">
                      Scroll down and tap <Plus className="h-4 w-4 inline text-card-foreground" />
                      <span className="font-medium">Add to Home Screen</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
                    <span className="text-card-foreground">Tap "Add" to confirm</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Android Instructions */}
            <Card className={platform === 'android' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Chrome className="h-5 w-5 text-card-foreground" />
                  Android
                  {platform === 'android' && (
                    <Badge variant="secondary" className="ml-2">Your Device</Badge>
                  )}
                </CardTitle>
                <CardDescription>Install via Chrome browser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
                    <span className="text-card-foreground">Open this page in <strong>Chrome</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                    <span className="flex items-center gap-1 text-card-foreground">
                      Tap the <MoreVertical className="h-4 w-4 inline text-card-foreground" />
                      <span className="font-medium">menu</span> button
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                    <span className="text-card-foreground">
                      Tap <span className="font-medium">Install app</span> or <span className="font-medium">Add to Home screen</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
                    <span className="text-card-foreground">Tap <span className="font-medium">Install</span> to confirm</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* QR Code for desktop users */}
          {platform === 'desktop' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Scan to Install on Mobile</CardTitle>
                <CardDescription>
                  Scan this QR code with your phone's camera to open the install page
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                {/* Warning for preview URL */}
                {isUsingPreviewUrl && (
                  <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Preview URL detected.</strong> The install link must use your published app URL (not lovableproject.com),
                      otherwise phones will be redirected to create a Lovable account.
                      {' '}
                      <Link to="/dashboard/settings" className="underline font-medium inline-flex items-center gap-1">
                        Set a published app URL <Settings className="h-3 w-3" />
                      </Link>{' '}
                      to fix this.
                    </AlertDescription>
                  </Alert>
                )}

                {isLoading ? (
                  <div className="h-[232px] flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG 
                        value={installUrl} 
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
                    
                    {/* URL and helper buttons */}
                    <div className="flex flex-col items-center gap-2 w-full max-w-md">
                      <p className="text-xs text-muted-foreground break-all text-center">
                        {installUrl}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(installUrl, '_blank')}
                          className="gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Test Link
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">App Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-card-foreground">Native Feel</h4>
                <p className="text-sm text-white/70">
                  Works like a real app with full-screen experience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-card-foreground">Dual Console</h4>
                <p className="text-sm text-white/70">
                  Access both Business Ops and Analytics in one app
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-card-foreground">Quick Access</h4>
                <p className="text-sm text-white/70">
                  Launch from your home screen instantly
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
