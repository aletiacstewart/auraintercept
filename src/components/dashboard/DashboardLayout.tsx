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

type UserRole = 'platform_admin' | 'company_admin' | 'employee';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  requiredJobTypes?: string[];
  external?: boolean;
  featureColor?: string;
  requiredTier?: 'single_point' | 'multi_track' | 'command';
}

interface NavGroup {
  label: string;
  items: NavItem[];
  requiredTier?: 'single_point' | 'multi_track' | 'command';
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['platform_admin', 'company_admin', 'employee'], featureColor: 'text-feature-overview' },
      { label: 'Quick Setup', icon: Settings, href: '/dashboard/quick-setup', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'Web Presence', icon: Globe, href: '/dashboard/smart-website', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'My Schedule', icon: Calendar, href: '/dashboard/appointments', roles: ['employee'] },
      { label: 'AI Console', icon: Bot, href: '/technician/ai-console', roles: ['employee'] },
      { label: 'My Jobs', icon: ClipboardList, href: '/technician/jobs', roles: ['employee'] },
      { label: 'Calendar', icon: Calendar, href: '/technician/calendar', roles: ['employee'] },
      { label: 'Job History', icon: History, href: '/technician/history', roles: ['employee'] },
      { label: 'Availability', icon: Clock, href: '/technician/availability', roles: ['employee'] },
    ],
  },
  {
    label: 'Business Management',
    requiredTier: 'command',
    items: [
      { label: 'Business Ops Overview', icon: Briefcase, href: '/dashboard/business-operations', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-analytics', requiredTier: 'command' },
      { label: 'Business Ops Hub', icon: Briefcase, href: '/dashboard/business-ops-hub', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
      { label: 'Analytics & Reports', icon: Cpu, href: '/dashboard/analytics-reports', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-analytics', requiredTier: 'command' },
    ],
  },
  {
    label: 'Business Mobile Apps',
    requiredTier: 'command',
    items: [
      { label: 'Business Mgt Ops Console', icon: Briefcase, href: '/dashboard/ai-consoles/business-mgt-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['billing_specialist'], featureColor: 'text-feature-platform', requiredTier: 'command' },
      { label: 'Business Mgt Ops Install', icon: Smartphone, href: '/dashboard/business-mgt-ops-install', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
      { label: 'Analytics & Reports Ops', icon: BarChart3, href: '/dashboard/ai-consoles/analytics', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
      { label: 'Marketing & Sales Ops', icon: Megaphone, href: '/dashboard/ai-consoles/marketing-sales', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
      { label: 'Social Media Signal Ops', icon: Share2, href: '/dashboard/ai-consoles/social-media', roles: ['platform_admin'], featureColor: 'text-feature-platform', requiredTier: 'command' },
    ],
  },
  {
    label: 'Field-Dispatch Mobile Apps',
    requiredTier: 'multi_track',
    items: [
      { label: 'Technician-Field Ops', icon: Truck, href: '/dashboard/ai-consoles/field-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['technician', 'dispatch'], featureColor: 'text-feature-fieldops', requiredTier: 'multi_track' },
      { label: 'Technician Field Ops Install', icon: Smartphone, href: '/dashboard/field-ops-install', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-fieldops', requiredTier: 'multi_track' },
      { label: 'Dispatch-Field Ops', icon: Map, href: '/dashboard/dispatch-field-ops', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-fieldops', requiredTier: 'multi_track' },
      { label: 'Dispatch Field Ops Install', icon: Smartphone, href: '/dashboard/dispatch-field-ops-install', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-fieldops', requiredTier: 'multi_track' },
    ],
  },
  {
    label: 'Customer Consoles & Apps',
    items: [
      { label: 'Customer Portal', icon: HeadphonesIcon, href: '/dashboard/ai-consoles/customer-portal', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['customer_service', 'booking_agent', 'dispatch'], featureColor: 'text-feature-customers' },
      { label: 'Customer Website App', icon: Globe, href: '/dashboard/customer-website-app', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-customers' },
      { label: 'Customer Portal App Install', icon: Smartphone, href: '/dashboard/customer-portal-app-install', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-customers' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'AI Operatives Hub', icon: Cpu, href: '/dashboard/ai-agents', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'Knowledge Base', icon: BookOpen, href: '/dashboard/knowledge', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-config' },
      { label: 'Calculators', icon: BarChart3, href: '/dashboard/calculators', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-analytics' },
      { label: 'Profile', icon: User, href: '/technician/profile', roles: ['employee'] },
      { label: 'Install App', icon: Puzzle, href: '/technician/install', roles: ['employee'] },
    ],
  },
  {
    label: '3rd Party Integrations',
    items: [
      { label: '3rd Party Overview', icon: Puzzle, href: '/dashboard/3rd-party-overview', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Voice Agent', icon: Mic, href: '/dashboard/integrations/voice', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'SMS & Text', icon: MessageSquare, href: '/dashboard/integrations/sms', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Email', icon: Mail, href: '/dashboard/integrations/email', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Calendar', icon: Calendar, href: '/dashboard/integrations/calendar', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'Social Media', icon: Share2, href: '/dashboard/integrations/social', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      { label: 'AI Research', icon: Search, href: '/dashboard/integrations/tavily', roles: ['platform_admin', 'company_admin'], featureColor: 'text-feature-integrations' },
      // CRM temporarily hidden - may revisit offering this setup later
      // { label: 'CRM', icon: Users, href: '/dashboard/integrations/crm', roles: ['platform_admin'], featureColor: 'text-feature-integrations' },
    ],
  },
  {
    label: 'Platform Resources',
    items: [
      { label: 'Subscription Analytics', icon: Crown, href: '/dashboard/subscription-analytics', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Platform Issues', icon: AlertTriangle, href: '/dashboard/platform-issues', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Platform Guides', icon: FileText, href: '/dashboard/platform-guides', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Blog Management', icon: FileText, href: '/dashboard/blog-management', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Demo Accounts', icon: Users, href: '/dashboard/demo-accounts', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', roles: ['platform_admin', 'company_admin', 'employee'], featureColor: 'text-feature-overview' },
      { label: 'Architecture', icon: Map, href: '/dashboard/architecture', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
      { label: 'Export Docs', icon: FileText, href: '/dashboard/export-docs', roles: ['platform_admin'], featureColor: 'text-feature-overview' },
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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="w-10 h-10 rounded-xl gradient-primary p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-sidebar flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Aura Intercept" className="w-8 h-8 object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate">Aura Intercept</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Smart Agents, Automated Service</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <div ref={sidebarScrollRootRef} className="flex-1 min-h-0 px-2 py-4">
          <ScrollArea className="h-full w-full">
            <nav className="space-y-4">
              {filteredNavGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  {!collapsed && (
                    <p className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
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

                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                          isActive && 'bg-sidebar-accent text-sidebar-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                        onClick={() => {
                          if (item.external) {
                            window.open(item.href, '_blank');
                          } else {
                            navigate(item.href);
                          }
                        }}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", item.featureColor && !isActive && item.featureColor)} />
                        {!collapsed && <span className="truncate">{displayLabel}</span>}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>

        <Separator className="bg-sidebar-border" />

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
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 border border-white/20">
              <roleBadge.icon className={cn('w-4 h-4', roleBadge.color)} />
              <span className="text-xs font-medium text-white">{roleBadge.label}</span>
            </div>
          )}
          
          {/* Report Issue Button */}
          <ReportIssueDialog
            trigger={
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Bug className="w-5 h-5 flex-shrink-0 text-feature-integrations" />
                {!collapsed && <span>Report Issue</span>}
              </Button>
            }
          />
          
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10',
              collapsed && 'justify-center px-2'
            )}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-8 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-auto">
        {/* Header with notification bell */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="container max-w-7xl flex items-center justify-end py-2 px-4">
            <NotificationBell />
          </div>
        </div>
        <div className="container max-w-7xl py-5 px-4">
          {children}
        </div>
      </main>
      
      {/* Unified Aura Floating Button */}
      <AuraFloatingButton />
    </div>
  );
}
