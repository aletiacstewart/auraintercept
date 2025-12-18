import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { JobRoleType, JOB_ROLE_CONFIGS } from '@/config/jobRoleDashboards';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, Calendar, Clock, Package, Bot, MessageSquare, 
  ClipboardList, Users, Phone, Map, Megaphone, Gift, FileText,
  UserPlus, Inbox, ShoppingCart, Receipt, Shield, FileCheck,
  BarChart3, FileBarChart, TrendingUp, ChevronLeft, ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  LayoutDashboard, Calendar, Clock, Package, Bot, MessageSquare,
  ClipboardList, Users, Phone, Map, Megaphone, Gift, FileText,
  UserPlus, Inbox, ShoppingCart, Receipt, Shield, FileCheck,
  BarChart3, FileBarChart, TrendingUp,
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              {!collapsed && (
                <span className="font-semibold text-foreground truncate">
                  {config.title}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-2 space-y-1">
              {config.navItems.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Other role dashboards */}
            {jobTypes.length > 1 && !collapsed && (
              <div className="px-4 mt-6">
                <p className="text-xs text-muted-foreground mb-2">Switch Role</p>
                <div className="space-y-1">
                  {jobTypes.filter(t => t !== jobRole).map((type) => (
                    <Link
                      key={type}
                      to={`/dashboard/${type.replace('_', '-')}`}
                      className="block text-sm text-muted-foreground hover:text-foreground py-1"
                    >
                      {JOB_ROLE_CONFIGS[type]?.title.replace(' Dashboard', '')}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {jobRole.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full mt-3", collapsed && "px-2")}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
