import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { 
  Home, 
  Bot, 
  ClipboardList, 
  Calendar, 
  Settings,
  Clock,
  History,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/aura-intercept-logo.png';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getNavLabels } from '@/lib/industryNavLabels';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';

interface TechnicianDashboardLayoutProps {
  children: React.ReactNode;
}

export const TechnicianDashboardLayout: React.FC<TechnicianDashboardLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [showInstallBanner, setShowInstallBanner] = React.useState(true);
  const { pack } = useIndustryPack();
  const navLabels = getNavLabels(pack);
  const serviceConfig = getIndustryServiceConsoleConfig(pack);
  const workerTitle = serviceConfig.workerConsoleTitle;
  const workerLayoutTitle = serviceConfig.workerLayoutTitle;
  const jobPlural = `${navLabels.jobNoun}s`;

  const mobileNavItems = [
    { icon: Home, label: 'Home', path: '/technician' },
    { icon: Bot, label: 'AI', path: '/technician/ai-console' },
    { icon: ClipboardList, label: jobPlural, path: '/technician/jobs' },
    { icon: Calendar, label: 'Calendar', path: '/technician/calendar' },
    { icon: Settings, label: 'More', path: '/technician/settings' },
  ];

  const sidebarNavItems = [
    { icon: Home, label: 'Dashboard', path: '/technician' },
    { icon: Bot, label: workerTitle, path: '/technician/ai-console' },
    { icon: ClipboardList, label: `My ${jobPlural}`, path: '/technician/jobs' },
    { icon: Calendar, label: 'Calendar', path: '/technician/calendar' },
    { icon: History, label: `${navLabels.jobNoun} History`, path: '/technician/history' },
    { icon: Clock, label: 'Availability', path: '/technician/availability' },
    { icon: User, label: 'Profile', path: '/technician/profile' },
    { icon: Smartphone, label: 'Install Field Ops App', path: '/technician/install' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/technician') {
      return pathname === '/technician';
    }
    return pathname.startsWith(path);
  };

  // Mobile Bottom Tab Navigation
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* PWA Install Banner */}
        {isInstallable && showInstallBanner && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Install Field Ops app</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-7 text-xs"
                onClick={promptInstall}
              >
                Install
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => {
                  setShowInstallBanner(false);
                  dismissPrompt();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {/* Mobile Header - Aura Intercept themed */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-accent/20 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 p-0.5 flex items-center justify-center">
              <img src={logo} alt="Aura Intercept" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">
                {mobileNavItems.find(item => isActive(item.path))?.label || workerLayoutTitle}
              </h1>
              <p className="text-[10px] text-accent/80">Aura Intercept</p>
            </div>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-sidebar border-sidebar-border">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.email}</p>
                      <p className="text-xs text-sidebar-foreground/60">Technician</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-2">
                  {sidebarNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive(item.path)
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </ScrollArea>
                <div className="p-4 border-t border-sidebar-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="dashboard-main flex-1 overflow-auto pb-16">
          {children}
        </main>

        {/* Mobile Bottom Navigation - Aura Intercept themed */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-accent/20 safe-area-bottom">
          <div className="flex items-center justify-around h-full">
            {mobileNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all relative',
                    active ? 'text-accent' : 'text-primary-foreground/60'
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    active && "bg-accent/20"
                  )}>
                    <item.icon className={cn('h-5 w-5', active && 'scale-110')} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {active && (
                    <div className="absolute bottom-1 w-8 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Sidebar Navigation
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
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
              <h1 className="font-bold text-sm truncate">{workerLayoutTitle}</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Aura Intercept</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  isActive(item.path) && 'bg-sidebar-accent text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User section */}
        <div className="p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <Avatar className="h-8 w-8 border border-primary">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/60">Technician</p>
              </div>
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

      {/* Main Content */}
      <main className="dashboard-main flex-1 overflow-auto">
        <div className="container max-w-7xl py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
};
