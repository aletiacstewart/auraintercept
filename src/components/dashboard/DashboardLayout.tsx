import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
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
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { differenceInDays, parseISO } from 'date-fns';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: ('platform_admin' | 'company_admin')[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['platform_admin', 'company_admin'] },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', roles: ['platform_admin', 'company_admin'] },
      { label: 'Companies', icon: Building2, href: '/dashboard/companies', roles: ['platform_admin', 'company_admin'] },
      { label: 'Customers', icon: UserCheck, href: '/dashboard/customers', roles: ['platform_admin', 'company_admin'] },
      { label: 'Employees', icon: Users, href: '/dashboard/employees', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Appointments', icon: Calendar, href: '/dashboard/appointments', roles: ['platform_admin', 'company_admin'] },
      { label: 'Quotes', icon: FileCheck, href: '/dashboard/quotes', roles: ['platform_admin', 'company_admin'] },
      { label: 'Invoices', icon: Receipt, href: '/dashboard/invoices', roles: ['platform_admin', 'company_admin'] },
      { label: 'Inventory', icon: Package, href: '/dashboard/inventory', roles: ['platform_admin', 'company_admin'] },
      { label: 'Warranties', icon: Shield, href: '/dashboard/warranties', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { label: 'AI Agents Hub', icon: Cpu, href: '/dashboard/ai-agents', roles: ['platform_admin', 'company_admin'] },
      { label: 'Customer Engagement', icon: HeadphonesIcon, href: '/dashboard/ai-agent?console=customer', roles: ['platform_admin', 'company_admin'] },
      { label: 'Field Operations', icon: Truck, href: '/dashboard/ai-agent?console=fieldops', roles: ['platform_admin', 'company_admin'] },
      { label: 'Business Operations', icon: Briefcase, href: '/dashboard/ai-agent?console=businessops', roles: ['platform_admin', 'company_admin'] },
      { label: 'Marketing & Sales', icon: Megaphone, href: '/dashboard/ai-agent?console=marketing', roles: ['platform_admin', 'company_admin'] },
      { label: 'Analytics & Insights', icon: BarChart3, href: '/dashboard/ai-agent?console=analytics', roles: ['platform_admin', 'company_admin'] },
      { label: 'Chat Widget', icon: MessageCircle, href: '/dashboard/widget', roles: ['platform_admin', 'company_admin'] },
      { label: 'Call History', icon: PhoneCall, href: '/dashboard/calls', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Marketing & Growth',
    items: [
      { label: 'Campaigns', icon: Megaphone, href: '/dashboard/campaigns', roles: ['platform_admin', 'company_admin'] },
      { label: 'Referrals', icon: Gift, href: '/dashboard/referrals', roles: ['platform_admin', 'company_admin'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Knowledge Base', icon: FileText, href: '/dashboard/knowledge', roles: ['platform_admin', 'company_admin'] },
      { label: 'Integrations', icon: Puzzle, href: '/dashboard/integrations', roles: ['platform_admin', 'company_admin'] },
      { label: 'Subscription', icon: CreditCard, href: '/dashboard/subscription', roles: ['platform_admin', 'company_admin'] },
      { label: 'Upgrade Plan', icon: Crown, href: '/dashboard/subscription', roles: ['company_admin'] },
      { label: 'Communication Logs', icon: MessageSquare, href: '/dashboard/messages', roles: ['platform_admin', 'company_admin'] },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['platform_admin', 'company_admin'] },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', roles: ['platform_admin', 'company_admin'] },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { userRole, signOut, user } = useAuth();
  const { subscriptionTier, subscriptionEnd } = useSubscription();
  const navigate = useNavigate();

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

  // Filter groups and items based on user role (admins only)
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => userRole && (userRole === 'platform_admin' || userRole === 'company_admin') && item.roles.includes(userRole))
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
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate">AI Bot Company</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Platform</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
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
                  const isActive = window.location.pathname === item.href;
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
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
