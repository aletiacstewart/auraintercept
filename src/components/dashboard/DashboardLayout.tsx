import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/aura-intercept-logo.png';
import { differenceInDays, parseISO } from 'date-fns';
import { ReportIssueDialog } from '@/components/error/ReportIssueDialog';
import { AuraFloatingButton } from '@/components/aura/AuraFloatingButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MobileInstallBanner } from '@/components/dashboard/MobileInstallBanner';
import { DemoExpiryBanner } from '@/components/common/DemoExpiryBanner';
import { CurrentPlanChip } from '@/components/subscription/CurrentPlanChip';
import { AIHelpCenter } from '@/components/help/AIHelpCenter';
import { DashboardTutorialProvider } from '@/components/tutorial/DashboardTutorial';
import { Clapperboard, Video, Sparkles } from 'lucide-react';

type UserRole = 'platform_admin' | 'company_admin' | 'employee';

import { SubscriptionTier } from '@/lib/subscriptionAgentConfig';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  requiredJobTypes?: string[];
  external?: boolean;
  featureColor?: string;
  requiredTier?: SubscriptionTier;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  requiredTier?: SubscriptionTier;
}

// Simplified navigation: collapsed Console+Install pairs (install lives inside each console),
// merged marketing groups, merged field-ops groups, trimmed integrations.
// Power-user surfaces (AI Operatives Hub, Calculators, Architecture, Export Docs, AI Research)
// are platform_admin only to reduce SMB owner cognitive load.
const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['platform_admin', 'company_admin', 'employee'], featureColor: 'text-feature-overview' },
      { label: 'Settings', icon: Settings, href: '/dashboard/quick-setup', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'My Schedule', icon: Calendar, href: '/dashboard/appointments', roles: ['employee'] },
      { label: 'AI Console', icon: Bot, href: '/technician/ai-console', roles: ['employee'] },
      { label: 'My Jobs', icon: ClipboardList, href: '/technician/jobs', roles: ['employee'] },
      { label: 'Calendar', icon: Calendar, href: '/technician/calendar', roles: ['employee'] },
      { label: 'Job History', icon: History, href: '/technician/history', roles: ['employee'] },
      { label: 'Availability', icon: Clock, href: '/technician/availability', roles: ['employee'] },
    ],
  },
  {
    label: 'Customers',
    requiredTier: 'connect',
    items: [
      { label: 'Customer Portal', icon: HeadphonesIcon, href: '/dashboard/ai-consoles/customer-portal', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['customer_service', 'booking_agent', 'dispatch'], featureColor: 'text-feature-customers', requiredTier: 'connect' },
      { label: 'Customer Website App', icon: Globe, href: '/dashboard/customer-website-app', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-customers', requiredTier: 'connect' },
    ],
  },
  {
    label: 'Field Ops',
    requiredTier: 'performance',
    items: [
      { label: 'Technician View', icon: Truck, href: '/dashboard/ai-consoles/field-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['technician', 'dispatch'], featureColor: 'text-feature-fieldops', requiredTier: 'performance' },
      { label: 'Dispatch View', icon: Map, href: '/dashboard/dispatch-field-ops', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-fieldops', requiredTier: 'performance' },
    ],
  },
  {
    label: 'Business',
    requiredTier: 'performance',
    items: [
      { label: 'Business Mgt Ops', icon: Briefcase, href: '/dashboard/ai-consoles/business-mgt-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['billing_specialist'], featureColor: 'text-feature-platform', requiredTier: 'performance' },
      { label: 'Analytics & Reports', icon: BarChart3, href: '/dashboard/ai-consoles/analytics', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
    ],
  },
  {
    label: 'Marketing',
    requiredTier: 'connect',
    items: [
      { label: 'Outreach & Sales', icon: Megaphone, href: '/dashboard/ai-consoles/marketing-sales', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'connect' },
      { label: 'Social Media', icon: Share2, href: '/dashboard/ai-consoles/social-media', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'connect' },
      { label: 'Website', icon: Globe, href: '/dashboard/smart-website', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'connect' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Knowledge Base', icon: BookOpen, href: '/dashboard/knowledge', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'AI Operatives Hub', icon: Cpu, href: '/dashboard/ai-agents', roles: ['platform_admin'], featureColor: 'text-feature-config' },
      { label: 'Calculators', icon: BarChart3, href: '/dashboard/calculators', roles: ['platform_admin'], featureColor: 'text-feature-analytics' },
      { label: 'Profile', icon: User, href: '/technician/profile', roles: ['employee'] },
      { label: 'Install App', icon: Puzzle, href: '/technician/install', roles: ['employee'] },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Phone & SMS', icon: PhoneCall, href: '/dashboard/integrations/sms', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Email', icon: Mail, href: '/dashboard/integrations/email', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Calendar', icon: Calendar, href: '/dashboard/integrations/calendar', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Social Media', icon: Share2, href: '/dashboard/integrations/social', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'All Integrations', icon: Puzzle, href: '/dashboard/3rd-party-overview', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Voice Agent', icon: Mic, href: '/dashboard/integrations/voice', roles: ['platform_admin'], featureColor: 'text-feature-integrations' },
      { label: 'AI Research', icon: Search, href: '/dashboard/integrations/tavily', roles: ['platform_admin'], featureColor: 'text-feature-integrations' },
    ],
  },
  {
    label: 'Platform Resources',
    items: [
      { label: 'Subscription Analytics', icon: Crown, href: '/dashboard/subscription-analytics', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Platform Issues', icon: AlertTriangle, href: '/dashboard/platform-issues', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Platform Guides', icon: FileText, href: '/dashboard/platform-guides', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', roles: ['platform_admin', 'company_admin', 'employee'], featureColor: 'text-feature-overview' },
      { label: 'AI Agent Demo', icon: Clapperboard, href: '/dashboard/ai-agent-demo', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Architecture', icon: Map, href: '/dashboard/architecture', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Export Docs', icon: FileText, href: '/dashboard/export-docs', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Video Prompts', icon: Video, href: '/dashboard/video-prompts', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Demo Account Seeder', icon: Sparkles, href: '/dashboard/demo-seeder', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { userRole, signOut, user } = useAuth();
  const { subscriptionTier, subscriptionEnd } = useSubscription();
  const { jobTypes, hasJobType } = useEmployeeJobRole();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const sidebarScrollRootRef = useRef<HTMLDivElement>(null);

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
      free: { label: 'Free', color: 'bg-muted text-muted-foreground', icon: null },
      enterprise: { label: 'Enterprise', color: 'bg-amber-500/20 text-amber-500', icon: Crown },
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

  // Restricted navigation sections - only for platform_admin, company_admin, or employees with full access
  const restrictedSections = ['Configuration', '3rd Party Integrations'];
  const userHasFullAccess = userRole === 'platform_admin' || userRole === 'company_admin' || 
    (userRole === 'employee' && jobTypes.some(jt => ['manager', 'customer_service'].includes(jt)));

  // Get subscription tier for tier-based filtering
  const { isAtLeastTier, inTrial } = useSubscription();

  // Platform admin always sees everything
  const isPlatformAdmin = userRole === 'platform_admin';

  // Filter groups and items based on user role, job types, and subscription tier
  const filteredNavGroups = navGroups
    .filter(group => {
      // Filter out restricted sections for employees without full access
      if (restrictedSections.includes(group.label) && !userHasFullAccess) {
        return false;
      }
      // Platform admin sees everything, skip tier check
      if (isPlatformAdmin) return true;
      // Check group-level tier requirement (skip if in trial)
      if (group.requiredTier && !inTrial && !isAtLeastTier(group.requiredTier)) {
        return false;
      }
      return true;
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Check basic role permission
        if (!userRole || !item.roles.includes(userRole as UserRole)) return false;
        
        // Platform admin sees all items
        if (isPlatformAdmin) return true;
        
        // Check item-level tier requirement (skip if in trial)
        if (item.requiredTier && !inTrial && !isAtLeastTier(item.requiredTier)) {
          return false;
        }
        
        // For employees, check job type requirements if specified
        if (userRole === 'employee' && item.requiredJobTypes) {
          return item.requiredJobTypes.some(jt => hasJobType(jt as any));
        }
        
        // Admins see all items they have role access to
        return true;
      })
    })).filter(group => group.items.length > 0);

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
  const getCurrentPageTitle = () => {
    const pathname = location.pathname;
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === pathname) {
          return item.label;
        }
      }
    }
    return 'Ask Aura';
  };

  return (
    <DashboardTutorialProvider>
    <div className="min-h-screen flex" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(200,60%,6%) 0%, hsl(210,40%,4%) 50%, hsl(220,30%,3%) 100%)" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col transition-all duration-300 border-r',
          collapsed ? 'w-16' : 'w-64'
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
          <div className="w-10 h-10 rounded-xl p-0.5 flex-shrink-0" style={{ background: "linear-gradient(135deg, #00E5FF, #214ebb)" }}>
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

        {/* Navigation */}
        <div ref={sidebarScrollRootRef} className="flex-1 min-h-0 px-2 py-4">
          <ScrollArea className="h-full w-full">
            <nav className="space-y-4">
              {filteredNavGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  {!collapsed && (
                    <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(0,229,255,0.35)" }}>
                      {group.label}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname + location.search === item.href ||
                      (location.pathname === item.href.split('?')[0] &&
                        item.href.includes('?') &&
                        location.search.includes(item.href.split('?')[1]?.split('=')[1] || ''));
                    const displayLabel = item.label;

                    const tourId = item.href === '/dashboard' ? 'nav-dashboard'
                      : item.href === '/dashboard/quick-setup' ? 'nav-quick-setup'
                      : item.href === '/dashboard/appointments' ? 'nav-my-schedule'
                      : item.href === '/technician/ai-console' ? 'nav-tech-ai-console'
                      : item.href === '/technician/jobs' ? 'nav-my-jobs'
                      : item.href === '/technician/calendar' ? 'nav-tech-calendar'
                      : item.href === '/technician/history' ? 'nav-job-history'
                      : item.href === '/technician/availability' ? 'nav-availability'
                      : item.href === '/technician/profile' ? 'nav-tech-profile'
                      : item.href === '/technician/install' ? 'nav-tech-install'
                      : item.href === '/dashboard/ai-consoles/customer-portal' ? 'nav-customer-portal'
                      : item.href === '/dashboard/customer-website-app' ? 'nav-customer-website-app'
                      : item.href === '/dashboard/customer-portal-app-install' ? 'nav-customer-portal-install'
                      : item.href === '/dashboard/ai-consoles/business-mgt-ops' ? 'nav-business-mgt-ops'
                      : item.href === '/dashboard/business-mgt-ops-install' ? 'nav-business-mgt-install'
                      : item.href === '/dashboard/ai-consoles/analytics' ? 'nav-analytics-reports'
                      : item.href === '/dashboard/ai-consoles/marketing-sales' ? 'nav-marketing-sales'
                      : item.href === '/dashboard/ai-consoles/social-media' ? 'nav-social-media'
                      : item.href === '/dashboard/smart-website' ? 'nav-web-presence'
                      : item.href === '/dashboard/ai-consoles/field-ops' ? 'nav-field-ops'
                      : item.href === '/dashboard/field-ops-install' ? 'nav-field-ops-install'
                      : item.href === '/dashboard/dispatch-field-ops' ? 'nav-dispatch-ops'
                      : item.href === '/dashboard/dispatch-field-ops-install' ? 'nav-dispatch-ops-install'
                      : item.href === '/dashboard/ai-agents' ? 'nav-ai-operatives'
                      : item.href === '/dashboard/knowledge' ? 'nav-knowledge-base'
                      : item.href === '/dashboard/calculators' ? 'nav-calculators'
                      : item.href === '/dashboard/3rd-party-overview' ? 'nav-integrations-overview'
                      : item.href === '/dashboard/integrations/voice' ? 'nav-voice-agent'
                      : item.href === '/dashboard/integrations/sms' ? 'nav-voice-sms'
                      : item.href === '/dashboard/integrations/email' ? 'nav-email'
                      : item.href === '/dashboard/integrations/calendar' ? 'nav-calendar'
                      : item.href === '/dashboard/integrations/social' ? 'nav-social-integration'
                      : item.href === '/dashboard/integrations/tavily' ? 'nav-ai-research'
                      : item.href === '/dashboard/subscription' ? 'nav-subscription'
                      : item.href === '/dashboard/subscription-analytics' ? 'nav-subscription-analytics'
                      : item.href === '/dashboard/platform-issues' ? 'nav-platform-issues'
                      : item.href === '/dashboard/platform-guides' ? 'nav-platform-guides'
                      : item.href === '/dashboard/help' ? 'nav-help'
                      : item.href === '/dashboard/ai-agent-demo' ? 'nav-ai-agent-demo'
                      : item.href === '/dashboard/architecture' ? 'nav-architecture'
                      : item.href === '/dashboard/export-docs' ? 'nav-export-docs'
                      : undefined;

                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        data-tour-id={tourId}
                        className={cn(
                          'w-full justify-start gap-3 transition-all duration-200 hover:bg-transparent hover:text-[inherit]',
                          collapsed && 'justify-center px-2'
                        )}
                        style={isActive ? {
                          background: "rgba(0,229,255,0.1)",
                          color: "#00E5FF",
                          boxShadow: "0 0 12px rgba(0,229,255,0.2), inset 0 0 0 1px rgba(0,229,255,0.2)",
                          borderRadius: 8,
                        } : {
                           color: "rgba(255,255,255,0.92)",
                         }}
                         onMouseEnter={e => {
                          if (!isActive) {
                            const glowMap: Record<string, string> = {
                              'text-feature-overview':     '189,100%,65%',
                              'text-feature-config':       '221,100%,65%',
                              'text-feature-platform':     '189,100%,55%',
                              'text-feature-fieldops':     '84,100%,55%',
                              'text-feature-customers':    '38,100%,65%',
                              'text-feature-employees':    '173,100%,55%',
                              'text-feature-analytics':    '223,100%,65%',
                              'text-feature-marketing':    '292,100%,70%',
                              'text-feature-integrations': '282,80%,70%',
                            };
                            const hsl = item.featureColor ? glowMap[item.featureColor] : null;
                            const el = e.currentTarget as HTMLElement;
                            if (hsl) {
                              el.style.color = `hsl(${hsl})`;
                              el.style.background = `hsl(${hsl}/0.07)`;
                              el.style.boxShadow = `0 0 14px hsl(${hsl}/0.35), inset 0 0 0 1px hsl(${hsl}/0.18)`;
                            } else {
                              el.style.color = "rgba(255,255,255,0.95)";
                              el.style.background = "rgba(255,255,255,0.04)";
                            }
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = "rgba(255,255,255,0.92)";
                            el.style.background = "transparent";
                            el.style.boxShadow = "none";
                          }
                        }}
                        onClick={() => {
                          if (item.external) {
                            window.open(item.href, '_blank');
                          } else {
                            navigate(item.href);
                          }
                        }}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", item.featureColor && !isActive && item.featureColor)} style={isActive ? { color: "#00E5FF" } : undefined} />
                        {!collapsed && <span className="truncate">{displayLabel}</span>}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>

        <Separator style={{ background: "rgba(0,229,255,0.1)" }} />

        {/* User section */}
        <div className="p-3 space-y-2">
          {/* Subscription badge */}
          {!collapsed && (
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:opacity-80',
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
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)" }}>
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
                  'w-full justify-start gap-3',
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
              'w-full justify-start gap-3',
              collapsed && 'justify-center px-2'
            )}
            style={{ color: "rgba(255,255,255,0.92)" }}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: "#ff6b6b" }} />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-8 h-6 w-6 rounded-full"
          style={{ border: "1px solid rgba(0,229,255,0.2)", background: "rgba(4,10,20,0.95)", color: "#00E5FF" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-auto" data-tour-id="main-content">
        <DemoExpiryBanner />
        {/* Mobile install banner (only on small screens, dismissable) */}
        <MobileInstallBanner />
        {/* Header with notification bell */}
        <div className="sticky top-0 z-10 border-b" style={{ background: "rgba(4,10,20,0.85)", backdropFilter: "blur(20px)", borderColor: "rgba(0,229,255,0.1)" }}>
          <div className="container max-w-7xl flex items-center justify-end gap-2 py-2 px-4">
            <LanguageToggle />
            <CurrentPlanChip />
            <NotificationBell />
          </div>
        </div>
        <div className="container max-w-7xl py-5 px-4">
          {children}
        </div>
      </main>
      
      {/* Unified Aura Floating Button — hide on dashboard where AuraCommandCenter already provides the input */}
      {location.pathname !== '/dashboard' && (
        <AuraFloatingButton pageTitle={getCurrentPageTitle()} />
      )}
    </div>
    </DashboardTutorialProvider>
  );
}

/** Alias kept for backward compatibility — DashboardLayout now includes the tutorial provider */
export function DashboardLayoutWithTutorial({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
