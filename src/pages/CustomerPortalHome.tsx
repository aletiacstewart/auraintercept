import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Download } from 'lucide-react';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import logo from '@/assets/aura-intercept-logo.png';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function CustomerPortalHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/customer-auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header with sign out */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold">Customer Portal</span>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && !isInstalled && (
              <Button variant="outline" size="sm" onClick={promptInstall} className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* The same AIAgentConsole used in the dashboard */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <AIAgentConsole allowCompanySelection={true} />
      </main>
    </div>
  );
}
