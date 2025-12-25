import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Building2, 
  Star, 
  Bot, 
  Calendar, 
  MessageSquare,
  LogOut,
  User,
  ArrowRight,
  Heart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MousePointerClick,
  Sparkles,
  DollarSign,
  MapPin
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import logo from '@/assets/logo.png';

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

export default function CustomerPortalHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not logged in or not a customer
  useEffect(() => {
    const checkCustomerRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/customer-auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'customer') {
        navigate('/dashboard');
      }
    };

    checkCustomerRole();
  }, [user, authLoading, navigate]);

  // Fetch customer's company associations
  const { data: associations, isLoading: associationsLoading } = useQuery({
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

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return (data || []) as Company[];
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/customer-auth');
  };

  const handleSelectCompany = async (company: Company) => {
    if (!user) return;

    // Create or update association
    const { error } = await supabase
      .from('customer_company_associations')
      .upsert({
        customer_user_id: user.id,
        company_id: company.id,
        last_interaction_at: new Date().toISOString()
      }, {
        onConflict: 'customer_user_id,company_id'
      });

    if (error) {
      console.error('Failed to create association:', error);
    }

    navigate(`/customer-portal/${company.slug}`);
  };

  const toggleFavorite = async (associationId: string, currentFavorite: boolean) => {
    await supabase
      .from('customer_company_associations')
      .update({ is_favorite: !currentFavorite })
      .eq('id', associationId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  const recentCompanies = associations?.slice(0, 4) || [];
  const favoriteCompanies = associations?.filter(a => a.is_favorite) || [];

  return (
    <div className="min-h-screen bg-background">
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
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for businesses..."
            className="pl-10 h-12 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Favorites */}
        {favoriteCompanies.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Favorites
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteCompanies.map((assoc) => (
                <CompanyCard 
                  key={assoc.id} 
                  company={assoc.companies} 
                  isFavorite={assoc.is_favorite}
                  onSelect={() => handleSelectCompany(assoc.companies)}
                  onToggleFavorite={() => toggleFavorite(assoc.id, assoc.is_favorite)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        {recentCompanies.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentCompanies.map((assoc) => (
                <CompanyCard 
                  key={assoc.id} 
                  company={assoc.companies}
                  isFavorite={assoc.is_favorite}
                  onSelect={() => handleSelectCompany(assoc.companies)}
                  onToggleFavorite={() => toggleFavorite(assoc.id, assoc.is_favorite)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Browse All */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-secondary" />
            {searchTerm ? 'Search Results' : 'Browse Companies'}
          </h2>
          {companiesLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : allCompanies?.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No companies found</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

function CompanyCard({ 
  company, 
  isFavorite,
  onSelect, 
  onToggleFavorite 
}: { 
  company: Company; 
  isFavorite?: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
}) {
  return (
    <Card 
      className="group cursor-pointer hover:border-primary transition-all hover:shadow-lg"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
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
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          )}
        </div>
        <h3 className="font-semibold truncate">{company.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            <Bot className="w-3 h-3 mr-1" />
            AI Support
          </Badge>
        </div>
        <div className="flex items-center gap-1 mt-3 text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
          View Services
          <ArrowRight className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function HowItWorksSection() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      step: 1,
      icon: Search,
      title: 'Find a Business',
      description: 'Search for companies by name or browse our directory to find service providers in your area.'
    },
    {
      step: 2,
      icon: MousePointerClick,
      title: 'Select a Company',
      description: 'Click on any company card to view their services and interact with their AI assistant.'
    },
    {
      step: 3,
      icon: Bot,
      title: 'Chat with AI Assistant',
      description: 'Use the AI-powered assistant to book appointments, get quotes, track services, and more.'
    },
    {
      step: 4,
      icon: Heart,
      title: 'Save Favorites',
      description: 'Mark companies as favorites for quick access to your preferred service providers.'
    }
  ];

  const aiFeatures = [
    { icon: Calendar, title: 'Book Appointments', description: 'Schedule service visits at your convenience' },
    { icon: DollarSign, title: 'Get Quotes', description: 'Request price estimates for services' },
    { icon: MapPin, title: 'Track Services', description: 'Monitor appointment status in real-time' },
    { icon: Star, title: 'Leave Feedback', description: 'Rate and review your service experience' },
    { icon: MessageSquare, title: 'Ask Questions', description: 'Get instant answers about services and hours' },
    { icon: Sparkles, title: 'Explore Services', description: 'Browse available services and pricing' },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">How to Use the Customer Portal</CardTitle>
                  <CardDescription>Learn how to find businesses and use AI-powered assistance</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Getting Started Steps */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Getting Started
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center p-4 rounded-lg bg-background border">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-primary mb-2" />
                    <h5 className="font-medium text-sm">{item.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant Features */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                What You Can Do with AI Assistants
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">{feature.title}</h5>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-background rounded-lg border p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Pro Tips
              </h4>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Use the search bar to quickly find businesses by name</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Click the heart icon on company cards to save them as favorites</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Each company has a unique AI assistant trained on their specific services</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Your recent interactions are saved for easy access</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
