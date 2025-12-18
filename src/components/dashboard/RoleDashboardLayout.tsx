import { ReactNode, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { JobRoleType, JOB_ROLE_CONFIGS, JOB_ROLE_ROUTES } from '@/config/jobRoleDashboards';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Package,
  Bot,
  MessageSquare,
  ClipboardList,
  Users,
  Phone,
  Map,
  Megaphone,
  Gift,
  FileText,
  UserPlus,
  Inbox,
  ShoppingCart,
  Receipt,
  Shield,
  FileCheck,
  BarChart3,
  FileBarChart,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Calendar,
  Clock,
  Package,
  Bot,
  MessageSquare,
  ClipboardList,
  Users,
  Phone,
  Map,
  Megaphone,
  Gift,
  FileText,
  UserPlus,
  Inbox,
  ShoppingCart,
  Receipt,
  Shield,
  FileCheck,
  BarChart3,
  FileBarChart,
  TrendingUp,
};

interface RoleDashboardLayoutProps {
  children: ReactNode;
  jobRole: JobRoleType;
}

export function RoleDashboardLayout({ children, jobRole }: RoleDashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { jobTypes } = useEmployeeJobRole();
  const navigate = useNavigate();
  const location = useLocation();

  const config = JOB_ROLE_CONFIGS[jobRole];

  const switchableRoles = useMemo(
    () => jobTypes.filter((t): t is JobRoleType => t !== jobRole && t in JOB_ROLE_CONFIGS),
    [jobTypes, jobRole],
  );

  const isItemActive = (path: string) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5">
          <button
            type="button"
            onClick={() => navigate(JOB_ROLE_ROUTES[jobRole])}
            className="w-10 h-10 rounded-xl gradient-primary p-0.5 flex-shrink-0"
            aria-label={`${config.title} home`}
          >
            <div className="w-full h-full rounded-xl bg-sidebar flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Company dashboard logo" className="w-8 h-8 object-contain" loading="lazy" />
            </div>
          </button>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate">{config.title}</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">{config.description}</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {config.navItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const active = isItemActive(item.path);

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                    active && 'bg-sidebar-accent text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Button>
              );
            })}

            {/* Role switcher */}
            {switchableRoles.length > 0 && !collapsed && (
              <div className="pt-4">
                <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Switch Role
                </p>
                <div className="space-y-1">
                  {switchableRoles.map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      className="w-full justify-start px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      onClick={() => navigate(JOB_ROLE_ROUTES[type])}
                    >
                      {JOB_ROLE_CONFIGS[type]?.title.replace(' Dashboard', '')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User section */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{jobRole.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10',
              collapsed && 'justify-center px-2',
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
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-8 px-6">{children}</div>
      </main>
    </div>
  );
}
