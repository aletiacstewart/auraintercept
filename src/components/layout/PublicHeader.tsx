import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
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
              <span className="font-brand text-[#214ebb] text-xl tracking-wide">Aura Intercept</span>
              <span className="text-[#46a2d3] text-xs font-medium">
                Smart Agents, Automated Service.
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
