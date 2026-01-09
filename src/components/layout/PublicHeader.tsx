import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users, Zap } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';

interface PublicHeaderProps {
  showHomeLink?: boolean;
}

export function PublicHeader({ showHomeLink = true }: PublicHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-sidebar border-b border-border/50 sticky top-0 z-50 py-2">
      <nav className="container max-w-7xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <img src={logo} alt="Aura Intercept" className="w-12 h-12 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="font-brand text-[#5B8ED8] text-xl tracking-wide">Aura Intercept</span>
              <span className="text-white/60 text-xs flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Infrastructure of Intent
              </span>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {showHomeLink && (
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          )}
          <Button variant="outline" className="text-white border-white/30 bg-white/5 hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/customer-auth')}>
            <Users className="w-4 h-4 mr-2" />
            Customer Portal
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button className="gradient-primary" onClick={() => navigate('/auth?mode=company')}>
            Start Free Trial
          </Button>
        </div>
      </nav>
    </header>
  );
}
