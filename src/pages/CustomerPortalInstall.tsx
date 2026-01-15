import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  LogOut,
  User,
  Heart,
  Search,
  Bot,
  MessageSquare,
  Star
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/aura-intercept-logo.png';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface CompanyAssociation {
  id: string;
  company_id: string;
  is_favorite: boolean;
  last_interaction_at: string;
  companies: Company;
}

export default function CustomerPortalInstall() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInstallInfo, setShowInstallInfo] = useState(true);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
  }, []);

  // Check if user is a customer and show appropriate view
  useEffect(() => {
    const checkCustomerRole = async () => {
      if (authLoading) return;
      
      if (user) {
        // Check if user is a customer
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'customer') {
          // Not a customer, redirect to dashboard
          navigate('/dashboard');
        } else {
          // Customer is logged in, hide install info and show portal
          setShowInstallInfo(false);
        }
      }
    };

    checkCustomerRole();
  }, [user, authLoading, navigate]);

  // Fetch customer's company associations
  const { data: associations } = useQuery({
    queryKey: ['customer-associations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customer_company_associations')
        .select(`
          id,
          company_id,
          is_favorite,
          last_interaction_at,
          companies (id, name, slug, logo_url, primary_color, secondary_color)
        `)
        .eq('customer_user_id', user.id)
        .order('last_interaction_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CompanyAssociation[];
    },
    enabled: !!user,
  });

  // Fetch all companies for browsing
  const { data: allCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: ['browse-companies', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('id, name, slug, logo_url, primary_color, secondary_color')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []) as Company[];
    },
    enabled: !!user && !selectedCompanyId,
  });

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result) {
      toast.success('App installed successfully!');
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
        setShowInstallInfo(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowInstallInfo(true);
    setSelectedCompanyId(null);
  };

  const handleSelectCompany = async (company: Company) => {
    if (!user) return;

    // Create or update association
    await supabase
      .from('customer_company_associations')
      .upsert({
        customer_user_id: user.id,
        company_id: company.id,
        last_interaction_at: new Date().toISOString()
      }, {
        onConflict: 'customer_user_id,company_id'
      });

    setSelectedCompanyId(company.id);
  };

  const handleBackToCompanies = () => {
    setSelectedCompanyId(null);
  };

  const toggleFavorite = async (associationId: string, currentFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('customer_company_associations')
      .update({ is_favorite: !currentFavorite })
      .eq('id', associationId);
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in and has selected a company, show the AI Console
  if (user && !showInstallInfo && selectedCompanyId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBackToCompanies}>
                <ArrowRight className="w-4 h-4 rotate-180 mr-1" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1">
          <AIAgentConsole companyId={selectedCompanyId} />
        </div>
      </div>
    );
  }

  // If user is logged in, show company selector (like CustomerPortalHome)
  if (user && !showInstallInfo) {
    const recentCompanies = associations?.slice(0, 4) || [];
    const favoriteCompanies = associations?.filter(a => a.is_favorite) || [];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary p-0.5">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold">Customer Portal</h1>
                <p className="text-xs text-muted-foreground">Find & interact with businesses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isInstallable && !isInstalled && (
                <Button variant="outline" size="sm" onClick={handleInstall} className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Install</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Install Banner */}
          {isInstallable && !isInstalled && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Install Customer App</h4>
                      <p className="text-xs text-muted-foreground">Get quick access and offline features</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleInstall}>
                    Install
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search businesses..."
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Favorites */}
          {favoriteCompanies.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Favorites
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {favoriteCompanies.map((assoc) => (
                  <CompanyCard 
                    key={assoc.id} 
                    company={assoc.companies} 
                    isFavorite={assoc.is_favorite}
                    onSelect={() => handleSelectCompany(assoc.companies)}
                    onToggleFavorite={(e) => toggleFavorite(assoc.id, assoc.is_favorite, e)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recent */}
          {recentCompanies.length > 0 && favoriteCompanies.length === 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {recentCompanies.map((assoc) => (
                  <CompanyCard 
                    key={assoc.id} 
                    company={assoc.companies}
                    isFavorite={assoc.is_favorite}
                    onSelect={() => handleSelectCompany(assoc.companies)}
                    onToggleFavorite={(e) => toggleFavorite(assoc.id, assoc.is_favorite, e)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Browse All */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-secondary" />
              {searchTerm ? 'Search Results' : 'Browse Companies'}
            </h2>
            {companiesLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : allCompanies?.length === 0 ? (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No companies found</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {allCompanies?.map((company) => (
                  <CompanyCard 
                    key={company.id} 
                    company={company}
                    onSelect={() => handleSelectCompany(company)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Default: Show install info and sign-in (first screen)
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
                    Sign in to access your portal
                  </p>
                </div>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Form */}
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
      </div>
    </div>
  );
}

// Company Card Component
function CompanyCard({ 
  company, 
  isFavorite,
  onSelect, 
  onToggleFavorite 
}: { 
  company: Company; 
  isFavorite?: boolean;
  onSelect: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
  return (
    <Card 
      className="group cursor-pointer hover:border-primary transition-all hover:shadow-lg"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, ${company.primary_color || '#0EA5E9'}, ${company.secondary_color || '#8B5CF6'})`
            }}
          >
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              company.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{company.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI
              </Badge>
              <span className="text-xs text-muted-foreground">Click to start chatting</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleFavorite}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
