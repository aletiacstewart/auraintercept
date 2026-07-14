import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ClipboardCheck, Sparkles, Menu, LogIn, Rocket, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/aura-intercept-logo.png';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/common/LanguageToggle';

interface PublicHeaderProps {
  showHomeLink?: boolean;
}

export function PublicHeader({ showHomeLink = true }: PublicHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="bg-sidebar border-b border-border/50 sticky top-0 z-50 py-2">
      <nav className="container max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={logo} alt="Aura Intercept" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0" />
            <div className="flex flex-col min-w-0" data-no-translate>
              <span className="font-brand text-primary text-base sm:text-xl tracking-wide truncate">Aura Intercept</span>
              <span className="text-primary/60 text-[10px] sm:text-xs font-medium hidden sm:inline">
                Smart Agents, Automated Service.
              </span>
            </div>
          </button>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle variant="ghost" />
          {showHomeLink && (
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-1" />
              {t('nav.home')}
            </Button>
          )}
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/audit')}>
            <ClipboardCheck className="w-4 h-4 mr-1" />
            {t('nav.freeAudit')}
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/for-business')}>
            <Sparkles className="w-4 h-4 mr-1 text-primary" />
            {t('nav.liveDemo')}
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/contact')}>
            <Mail className="w-4 h-4 mr-1" />
            {t('nav.contact')}
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/signin')}
>
            {t('nav.signIn')}
          </Button>
          <Button className="gradient-primary" onClick={() => navigate('/signup?mode=company')}>
            {t('nav.startFreeTrial')}
          </Button>
        </div>

        {/* Mobile dropdown */}
        <div className="md:hidden flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Menu"
                className="text-white border-white/30 bg-white/5 hover:text-white hover:bg-white/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[60]">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Language</span>
                <LanguageToggle variant="compact" />
              </div>
              <DropdownMenuSeparator />
              {showHomeLink && (
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  {t('nav.home')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate('/audit')}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                {t('nav.freeAudit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/for-business')}>
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                {t('nav.liveDemo')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/contact')}>
                <Mail className="w-4 h-4 mr-2" />
                {t('nav.contact')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/signin')}>
                <LogIn className="w-4 h-4 mr-2" />
                {t('nav.signIn')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/signup?mode=company')}
                className="font-semibold text-primary focus:text-primary"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {t('nav.startFreeTrial')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
