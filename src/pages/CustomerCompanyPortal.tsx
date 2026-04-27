import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { DemoExpiryBanner } from '@/components/common/DemoExpiryBanner';
import logo from '@/assets/aura-intercept-logo.png';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export default function CustomerCompanyPortal() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch company details using secure RPC function for public info
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company-public', companySlug],
    queryFn: async () => {
      if (!companySlug) return null;
      const { data, error } = await supabase
        .rpc('get_company_public_info', { p_slug: companySlug })
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!companySlug,
  });

  // Update last interaction
  useEffect(() => {
    const updateInteraction = async () => {
      if (!user || !company) return;
      
      await supabase
        .from('customer_company_associations')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('customer_user_id', user.id)
        .eq('company_id', company.id);
    };

    updateInteraction();
  }, [user, company]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/customer-auth');
  };

  if (companyLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Company not found</p>
            <Button onClick={() => navigate('/customer-portal')} className="mt-4">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DemoExpiryBanner />
      {/* Minimal header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-card-foreground">Customer Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-card-foreground">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Same AIAgentConsole with pre-selected company */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <AIAgentConsole companyId={company.id} />
      </main>
    </div>
  );
}
