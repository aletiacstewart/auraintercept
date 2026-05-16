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
import { useCustomerPrimaryCompany } from '@/hooks/useCustomerPrimaryCompany';
import { PortalQuickActions } from '@/components/customer-portal/PortalQuickActions';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPortalCopy } from '@/lib/industryPortalCopy';
import { toast } from 'sonner';
import { SuperHubInlineButton } from '@/components/super-switcher/SuperHubInlineButton';

export default function CustomerPortalHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { companyId } = useCustomerPrimaryCompany();
  const { pack } = useIndustryPack(companyId);
  const portalCopy = getPortalCopy(pack);

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
            <span className="text-sm font-semibold text-card-foreground">{portalCopy.portalHeaderLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && !isInstalled && (
              <Button variant="outline" size="sm" onClick={promptInstall} className="gap-2 text-card-foreground">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}
            <SuperHubInlineButton />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-card-foreground">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* One-tap install hero — only shown when installable and not yet installed */}
      {isInstallable && !isInstalled && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3 animate-fade-in">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Install for one-tap access</p>
              <p className="text-xs text-muted-foreground">
                Add to your home screen — no app store needed.
              </p>
            </div>
            <Button onClick={promptInstall} size="sm" className="gap-1.5 shrink-0">
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          </div>
        </div>
      )}

      {/* Industry-aware quick actions strip (Phase 6 task 3). */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="px-4 pt-3">
          <p className="text-xs text-muted-foreground">{portalCopy.welcomeSubtitle}</p>
        </div>
        <PortalQuickActions
          companyId={companyId}
          onAction={(prompt) => {
            try { navigator.clipboard?.writeText(prompt); } catch { /* noop */ }
            toast.success('Suggested message copied', {
              description: 'Paste it into the chat below to send.',
            });
          }}
        />
      </div>

      {/* The same AIAgentConsole used in the dashboard */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <AIAgentConsole allowCompanySelection={true} />
      </main>
    </div>
  );
}
