import { useState, useEffect } from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, Download, Share, Plus, MoreVertical, 
  Check, Apple, Chrome, Wifi, WifiOff 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const TechnicianInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  const installUrl = `${window.location.origin}/technician`;

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

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    <TechnicianDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Install App</h1>
            <p className="text-muted-foreground">
              Install Field Ops on your device for quick access
            </p>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

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
                    You're using Field Ops as a standalone app
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
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Smartphone className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-semibold text-lg">Install Field Ops</h3>
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
                  <CardTitle className="flex items-center gap-2">
                    <Apple className="h-5 w-5" />
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
                      <span>Open this page in <strong>Safari</strong> (required for iOS)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                      <span className="flex items-center gap-1">
                        Tap the <Share className="h-4 w-4 inline" /> Share button
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                      <span className="flex items-center gap-1">
                        Scroll down and tap <Plus className="h-4 w-4 inline" /> "Add to Home Screen"
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
                      <span>Tap "Add" to confirm</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Android Instructions */}
              <Card className={platform === 'android' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Chrome className="h-5 w-5" />
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
                      <span>Open this page in <strong>Chrome</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                      <span className="flex items-center gap-1">
                        Tap the <MoreVertical className="h-4 w-4 inline" /> menu button
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                      <span>Tap "Install app" or "Add to Home screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
                      <span>Tap "Install" to confirm</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* QR Code for desktop users */}
            {platform === 'desktop' && (
              <Card>
                <CardHeader>
                  <CardTitle>Scan to Install on Mobile</CardTitle>
                  <CardDescription>
                    Scan this QR code with your phone's camera to open the install page
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG 
                      value={installUrl} 
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>App Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Native Feel</h4>
                  <p className="text-sm text-muted-foreground">
                    Works like a real app with full-screen experience
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Quick Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Launch from your home screen instantly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Works Offline</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic features available without internet
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TechnicianDashboardLayout>
  );
};

export default TechnicianInstall;
