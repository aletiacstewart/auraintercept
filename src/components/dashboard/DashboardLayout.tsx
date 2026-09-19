import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { navItemAllowedByProfile } from '@/lib/profileConsoleMap';
import { getNavLabels, getPageHeader } from '@/lib/industryNavLabels';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';
import { isNavHrefHiddenForIndustry } from '@/lib/industryNavVisibility';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Bot,
  Puzzle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  MessageCircle,
  PhoneCall,
  BarChart3,
  CreditCard,
  Crown,
  Cpu,
  Package,
  FileCheck,
  Receipt,
  Megaphone,
  Gift,
  HeadphonesIcon,
  Truck,
  Briefcase,
  Map,
  HelpCircle,
  Mail,
  Clock,
  ClipboardList,
  History,
  User,
  BookOpen,
  Mic,
  Globe,
  Smartphone,
  AlertTriangle,
  Bug,
  Share2,
  Search,
  Database,
} from 'lucide-react';
import { Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/aura-intercept-logo.png';
import { differenceInDays, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { ReportIssueDialog } from '@/components/error/ReportIssueDialog';
import { AuraFloatingButton } from '@/components/aura/AuraFloatingButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MobileInstallBanner } from '@/components/dashboard/MobileInstallBanner';
import { CurrentPlanChip } from '@/components/subscription/CurrentPlanChip';
import { AIHelpCenter } from '@/components/help/AIHelpCenter';
import { ProductTourProvider } from '@/components/onboarding/ProductTour';
import { Clapperboard, Video, Send, Sparkles } from 'lucide-react';
import { UserCog } from 'lucide-react';

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { findNavItemByHref } from '@/lib/navigationConfig';


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  // Mobile sidebar: hidden by default, slides over content
  const [mobileOpen, setMobileOpen] = useState(false);
  const { userRole, signOut, user } = useAuth();
  const { subscriptionTier, subscriptionEnd } = useSubscription();
  const { jobTypes, hasJobType } = useEmployeeJobRole();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const sidebarScrollRootRef = useRef<HTMLDivElement>(null);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const SIDEBAR_SCROLL_STORAGE_KEY = 'dashboard.sidebar.scrollTop';

  const getSidebarScrollViewport = () => {
    return sidebarScrollRootRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLElement | null;
  };

  // Persist sidebar scroll position (works even if DashboardLayout unmounts between routes)
  useEffect(() => {
    const viewport = getSidebarScrollViewport();
    if (!viewport) return;

    const restore = () => {
      const stored = sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
      const top = stored ? Number(stored) : 0;
      if (Number.isFinite(top) && top > 0) viewport.scrollTop = top;
    };

    // Restore after first paint to avoid being overwritten by Radix layout
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 0);
    });

    const onScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(viewport.scrollTop));
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  // Re-apply scroll on route change (covers cases where the ScrollArea viewport is recreated)
  useEffect(() => {
    const viewport = getSidebarScrollViewport();
    if (!viewport) return;

    const stored = sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
    const top = stored ? Number(stored) : 0;
    if (!Number.isFinite(top) || top <= 0) return;

    requestAnimationFrame(() => {
      viewport.scrollTop = top;
    });
  }, [location.pathname, location.search]);

  // Scroll main content to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);

  const getTierDisplay = () => {
    const tierConfig: Record<string, { label: string; color: string; icon: typeof Crown | null }> = {
      free:        { label: 'Free',       color: 'bg-muted text-muted-foreground',       icon: null },
      starter:     { label: 'Aura Core',  color: 'bg-teal-500/20 text-teal-300',          icon: null },
      connect:     { label: 'Aura Boost', color: 'bg-sky-500/20 text-cyan-300',           icon: null },
      performance: { label: 'Aura Pro',   color: 'bg-purple-500/20 text-purple-300',      icon: Crown },
      command:     { label: 'Aura Elite', color: 'bg-amber-500/20 text-amber-300',        icon: Crown },
      enterprise:  { label: 'Aura Elite', color: 'bg-amber-500/20 text-amber-300',        icon: Crown },
    };
    return tierConfig[subscriptionTier] || tierConfig.free;
  };

  const getDaysRemaining = () => {
    if (!subscriptionEnd) return null;
    const days = differenceInDays(parseISO(subscriptionEnd), new Date());
    return days > 0 ? days : 0;
  };

  const tierDisplay = getTierDisplay();
  const daysRemaining = getDaysRemaining();

  // Navigation itself (role lists + plan/job/industry filtering) lives in
  // DashboardSidebar + src/lib/navigationConfig.ts.


  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'platform_admin':
        return { label: 'Platform Admin', icon: Shield, color: 'text-primary' };
      case 'company_admin':
        return { label: 'Company Admin', icon: Building2, color: 'text-secondary' };
      case 'employee':
        return { label: 'Employee', icon: Users, color: 'text-accent' };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  // Get current page title from navigation config
  const getCurrentPageTitle = () => findNavItemByHref(location.pathname)?.label ?? 'Ask Aura';


  return (
    <ProductTourProvider>
    <div className="min-h-screen flex overflow-x-hidden w-full max-w-full" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(200,60%,6%) 0%, hsl(210,40%,4%) 50%, hsl(220,30%,3%) 100%)" }}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 border-r',
          // Desktop: sticky inline column
          'md:h-screen md:sticky md:top-0 md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64',
          // Mobile: fixed overlay drawer
          'fixed inset-y-0 left-0 z-50 h-screen w-64 md:relative',
          isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'
        )}
        style={{
          background: "rgba(4,10,20,0.92)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(0,229,255,0.1)",
          boxShadow: "4px 0 24px rgba(0,229,255,0.05)",
        }}
      >
        {/* Logo */}
        <div data-tour-id="sidebar-logo" className="flex items-center gap-3 px-4 py-5">
          <div className="w-10 h-10 rounded-xl p-0.5 flex-shrink-0" style={{ background: "linear-gradient(135deg, #00E5FF, #00E5FF)" }}>
            <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "rgba(4,10,20,0.95)" }}>
              <img src={logo} alt="Aura Intercept" className="w-8 h-8 object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate" style={{ color: "rgba(255,255,255,0.95)" }}>Aura Intercept</h1>
              <p className="text-xs truncate" style={{ color: "rgba(0,229,255,0.55)" }}>Smart Agents, Automated Service</p>
            </div>
          )}
        </div>

        <Separator style={{ background: "rgba(0,229,255,0.1)" }} />

        {/* Navigation + footer share one scroll surface so the tier badge and
            bottom actions scroll with the nav on short viewports. */}
        <div ref={sidebarScrollRootRef} className="flex-1 min-h-0">
          <ScrollArea className="h-full w-full">
            <DashboardSidebar collapsed={collapsed} />


            <Separator style={{ background: "rgba(0,229,255,0.1)" }} />

            {/* User section */}
            <div className="p-1.5 space-y-0.5">
          {/* Subscription badge */}
          {!collapsed && (
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-0.5 rounded-lg transition-colors hover:opacity-80',
                tierDisplay.color
              )}
            >
              <div className="flex items-center gap-2">
                {tierDisplay.icon && <tierDisplay.icon className="w-4 h-4" />}
                <span className="text-xs font-semibold">{tierDisplay.label}</span>
              </div>
              {daysRemaining !== null && (
                <span className="text-xs opacity-80">{daysRemaining}d left</span>
              )}
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className={cn(
                'w-full flex items-center justify-center p-2 rounded-lg transition-colors hover:opacity-80',
                tierDisplay.color
              )}
              title={`${tierDisplay.label}${daysRemaining !== null ? ` - ${daysRemaining} days left` : ''}`}
            >
              {tierDisplay.icon ? <tierDisplay.icon className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            </button>
          )}
          
          {!collapsed && roleBadge && (
            <div className="flex items-center gap-2 px-3 py-0.5 rounded-lg" style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
              <roleBadge.icon className={cn('w-4 h-4', roleBadge.color)} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{roleBadge.label}</span>
            </div>
          )}
          
          {/* AI Help Center */}
          {!collapsed && <AIHelpCenter />}
          
          {/* Report Issue Button */}
          <ReportIssueDialog
            trigger={
              <Button
                variant="ghost"
                className={cn(
                  '!h-7 py-0.5 w-full justify-start gap-3',
                  collapsed && 'justify-center px-2'
                )}
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                <Bug className="w-5 h-5 flex-shrink-0 text-feature-integrations" />
                {!collapsed && <span>Report Issue</span>}
              </Button>
            }
          />
          
          <Button
            variant="ghost"
            className={cn(
              '!h-7 py-0.5 w-full justify-start gap-3',
              collapsed && 'justify-center px-2'
            )}
            style={{ color: "rgba(255,255,255,0.92)" }}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            {!collapsed && <span>Sign Out</span>}
          </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute -right-3 top-8 h-6 w-6 rounded-full"
          style={{ border: "1px solid hsl(var(--primary) / 0.2)", background: "rgba(4,10,20,0.95)", color: "hsl(var(--primary))" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main ref={mainRef} className="dashboard-main flex-1 min-w-0 overflow-x-hidden overflow-y-auto w-full" data-tour-id="main-content">
        {/* Mobile install banner (only on small screens, dismissable) */}
        <MobileInstallBanner />
        {/* Header with notification bell */}
        <div className="sticky top-0 z-10 border-b" style={{ background: "rgba(4,10,20,0.85)", backdropFilter: "blur(20px)", borderColor: "rgba(0,229,255,0.1)" }}>
          <div className="container max-w-7xl flex items-center justify-between gap-2 py-2 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{ color: "hsl(var(--primary))" }}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center justify-end gap-2 ml-auto">
            <CurrentPlanChip />
            <NotificationBell />
            </div>
          </div>
        </div>
        <div className="container max-w-7xl py-5 px-4 overflow-x-hidden">
          {children}
        </div>
      </main>
      
      {/* Unified Aura Floating Button — hide on dashboard where AuraCommandCenter already provides the input */}
      {location.pathname !== '/dashboard' && (
        <AuraFloatingButton pageTitle={getCurrentPageTitle()} />
      )}
    </div>
    </ProductTourProvider>
  );
}

/** Alias kept for backward compatibility — DashboardLayout now includes the product tour provider */
export function DashboardLayoutWithTutorial({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
