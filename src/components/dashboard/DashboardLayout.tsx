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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/ai-bot-company-logo-new.png';
import { differenceInDays, parseISO } from 'date-fns';

type UserRole = 'platform_admin' | 'company_admin' | 'employee';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
  requiredJobTypes?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['platform_admin', 'company_admin', 'employee'] },
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
    items: [
      { label: 'Business Ops Overview', icon: Briefcase, href: '/dashboard/business-operations', roles: ['platform_admin', 'company_admin'] },
      { label: 'Companies', icon: Building2, href: '/dashboard/companies', roles: ['platform_admin'] },
      { label: 'Employees', icon: UserCheck, href: '/dashboard/employees', roles: ['platform_admin', 'company_admin'] },
      { label: 'Customers', icon: Users, href: '/dashboard/customers', roles: ['platform_admin', 'company_admin'] },
      { label: 'Appointments', icon: Calendar, href: '/dashboard/appointments', roles: ['platform_admin', 'company_admin'] },
      { label: 'Quotes', icon: FileText, href: '/dashboard/quotes', roles: ['platform_admin', 'company_admin'] },
      { label: 'Invoices', icon: Receipt, href: '/dashboard/invoices', roles: ['platform_admin', 'company_admin'] },
      { label: 'Inventory', icon: Package, href: '/dashboard/inventory', roles: ['platform_admin'] },
      { label: 'Warranties', icon: FileCheck, href: '/dashboard/warranties', roles: ['platform_admin'] },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Communications',
    items: [
      { label: 'Communication Logs', icon: MessageSquare, href: '/dashboard/messages', roles: ['platform_admin', 'company_admin'] },
      { label: 'Call History', icon: PhoneCall, href: '/dashboard/calls', roles: ['platform_admin', 'company_admin'] },
      { label: 'SMS / Texts', icon: MessageSquare, href: '/dashboard/sms-logs', roles: ['platform_admin', 'company_admin'] },
      { label: 'Email', icon: Mail, href: '/dashboard/email-logs', roles: ['platform_admin', 'company_admin'] },
      { label: 'Campaigns', icon: Megaphone, href: '/dashboard/campaigns', roles: ['platform_admin'] },
    ],
  },
  {
    label: 'Business Consoles & Apps',
    items: [
      { label: 'Business Management', icon: Briefcase, href: '/dashboard/ai-consoles/business-management', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['billing_specialist', 'inventory_manager'] },
      { label: 'Marketing & Sales', icon: Megaphone, href: '/dashboard/ai-consoles/marketing-sales', roles: ['platform_admin'] },
      { label: 'Analytics & Optimization', icon: BarChart3, href: '/dashboard/ai-consoles/analytics', roles: ['platform_admin'] },
    ],
  },
  {
    label: 'Field Ops Consoles & Apps',
    items: [
      { label: 'Technician-Field Ops', icon: Truck, href: '/dashboard/ai-consoles/field-ops', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['technician', 'dispatch'] },
      { label: 'Dispatch-Field Ops', icon: Map, href: '/dashboard/field-operations', roles: ['platform_admin', 'company_admin'] },
      { label: 'Field Ops App', icon: Smartphone, href: '/dashboard/field-ops-install', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Customer Consoles & Apps',
    items: [
      { label: 'Customer Portal', icon: HeadphonesIcon, href: '/dashboard/ai-consoles/customer-portal', roles: ['platform_admin', 'company_admin', 'employee'], requiredJobTypes: ['customer_service', 'booking_agent', 'dispatch'] },
      { label: 'Customer App', icon: Globe, href: '/dashboard/widget', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'AI Agents Hub', icon: Cpu, href: '/dashboard/ai-agents', roles: ['platform_admin', 'company_admin'] },
      { label: 'Knowledge Base', icon: BookOpen, href: '/dashboard/knowledge', roles: ['platform_admin', 'company_admin'] },
      { label: 'Calculators', icon: BarChart3, href: '/dashboard/calculators', roles: ['platform_admin', 'company_admin'] },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['platform_admin', 'company_admin'] },
      { label: 'Profile', icon: User, href: '/technician/profile', roles: ['employee'] },
      { label: 'Install App', icon: Puzzle, href: '/technician/install', roles: ['employee'] },
    ],
  },
  {
    label: '3rd Party Integrations',
    items: [
      { label: 'Overview', icon: Puzzle, href: '/dashboard/integrations', roles: ['platform_admin', 'company_admin'] },
      { label: 'Voice Agent', icon: Mic, href: '/dashboard/integrations/voice', roles: ['platform_admin', 'company_admin'] },
      { label: 'SMS & Text', icon: MessageSquare, href: '/dashboard/integrations/sms', roles: ['platform_admin', 'company_admin'] },
      { label: 'Email', icon: Mail, href: '/dashboard/integrations/email', roles: ['platform_admin', 'company_admin'] },
      { label: 'CRM', icon: Users, href: '/dashboard/integrations/crm', roles: ['platform_admin'] },
      { label: 'Calendar', icon: Calendar, href: '/dashboard/integrations/calendar', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Platform Resources',
    items: [
      { label: 'Platform Guides', icon: FileText, href: '/dashboard/guides', roles: ['platform_admin'] },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', roles: ['platform_admin', 'company_admin', 'employee'] },
      { label: 'Architecture', icon: Map, href: '/dashboard/architecture', roles: ['platform_admin'] },
      { label: 'Export Docs', icon: FileText, href: '/dashboard/documentation', roles: ['platform_admin'] },
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

  // Filter groups and items based on user role and job types
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Check basic role permission
      if (!userRole || !item.roles.includes(userRole as UserRole)) return false;
      
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
              <p className="text-xs text-sidebar-foreground/60 truncate">Infrastructure of Intent</p>
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
                        onClick={() => navigate(item.href)}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
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
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50', roleBadge.color)}>
              <roleBadge.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{roleBadge.label}</span>
            </div>
          )}
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
        <div className="container max-w-7xl py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
