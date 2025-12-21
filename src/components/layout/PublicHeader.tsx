import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Users, Home } from 'lucide-react';
import logo from '@/assets/ai-header-logo-new.png';

interface PublicHeaderProps {
  showHomeLink?: boolean;
}

export function PublicHeader({ showHomeLink = true }: PublicHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b border-border/50 sticky top-0 z-50 py-0.5">
      <nav className="container max-w-7xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="flex items-center">
            <img src={logo} alt="AI Bot Company" style={{ width: '325px', height: 'auto' }} className="object-contain" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {showHomeLink && (
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          )}
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/demo')}>
            <Play className="w-4 h-4 mr-1" />
            Try Demo
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/demo')}>
            <Users className="w-4 h-4 mr-1" />
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
