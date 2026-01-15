import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Smartphone, 
  Calendar, 
  Bell, 
  Building2, 
  Shield, 
  CheckCircle2,
  Loader2,
  Share,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/aura-intercept-logo.png';

export default function CustomerPortalInstall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
  }, []);

  useEffect(() => {
    // If user is already logged in and app is installed, redirect to portal
    if (user && isInstalled) {
      navigate('/customer-portal');
    }
  }, [user, isInstalled, navigate]);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result) {
      toast.success('App installed successfully!');
      if (user) {
        navigate('/customer-portal');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Signed in successfully!');
        navigate('/customer-portal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Building2,
      title: 'All Companies in One Place',
      description: 'Access every business you interact with from a single app'
    },
    {
      icon: Calendar,
      title: 'Track Appointments',
      description: 'View and manage all your upcoming service appointments'
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Get instant updates about your appointments and services'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and only shared with companies you choose'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                <img src={logo} alt="Customer Portal" className="w-14 h-14 object-contain" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Customer Portal</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your service providers, all in one app
          </p>

          {/* App Preview */}
          <div className="relative mx-auto max-w-[280px] mb-8">
            <div className="bg-card rounded-3xl border-4 border-foreground/10 shadow-2xl overflow-hidden">
              <div className="h-6 bg-foreground/5 flex items-center justify-center">
                <div className="w-20 h-1 rounded-full bg-foreground/20" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-16 bg-muted/50 rounded mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-2 w-12 bg-muted/50 rounded mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-28 bg-muted rounded" />
                    <div className="h-2 w-14 bg-muted/50 rounded mt-1" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 pb-12 space-y-6">
        {/* Install Section */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            {isInstalled ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">App Installed!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user ? 'Open the app to continue' : 'Sign in to access your portal'}
                  </p>
                </div>
                {user ? (
                  <Button className="w-full" onClick={() => navigate('/customer-portal')}>
                    Open Customer Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => setShowLogin(true)}>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            ) : isInstallable ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Install the App</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add to your home screen for the best experience
                  </p>
                </div>
                <Button className="w-full gap-2" size="lg" onClick={handleInstall}>
                  <Download className="w-5 h-5" />
                  Install Customer Portal
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setShowLogin(true)}>
                  Or sign in to continue in browser
                </Button>
              </div>
            ) : isIOS ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Install on iOS</h3>
                    <p className="text-sm text-muted-foreground">Add to Home Screen</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <p className="text-sm">
                      Tap the <Share className="w-4 h-4 inline mx-1" /> Share button in Safari
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <p className="text-sm">
                      Scroll down and tap <Plus className="w-4 h-4 inline mx-1" /> Add to Home Screen
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <p className="text-sm">
                      Tap "Add" in the top right corner
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowLogin(true)}>
                  Continue in browser instead
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Open on Mobile</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For the best experience, open this page on your mobile device
                  </p>
                </div>
                <Button className="w-full" onClick={() => setShowLogin(true)}>
                  Continue in browser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Form */}
        {showLogin && !user && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Sign In</h3>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Don't have an account? Create one through any company's service widget.
              </p>
              <p className="text-xs text-center mt-2">
                <a 
                  href="/auth?mode=customer" 
                  className="text-primary hover:underline"
                >
                  Or sign up directly on Aura Intercept
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h3 className="font-semibold text-center">What you get</h3>
          <div className="grid gap-3">
            {features.map((feature, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Already have app */}
        {!isInstalled && user && (
          <div className="text-center">
            <Button variant="link" onClick={() => navigate('/customer-portal')}>
              Already have the app? Open Portal →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
