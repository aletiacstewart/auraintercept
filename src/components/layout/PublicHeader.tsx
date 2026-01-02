import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users } from 'lucide-react';
import logo from '@/assets/ai-bot-company-logo-new.png';

interface PublicHeaderProps {
  showHomeLink?: boolean;
}

export function PublicHeader({ showHomeLink = true }: PublicHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-black sticky top-0 z-50 py-0.5">
      <nav className="container max-w-7xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="flex items-center">
            <img src={logo} alt="AI Bot Company" style={{ width: '200px', height: '160px' }} className="object-contain" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {showHomeLink && (
            <Button variant="ghost" className="text-foreground hover:bg-muted" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          )}
          <Button variant="outline" className="text-foreground border-border bg-transparent hover:bg-muted hidden sm:flex" onClick={() => navigate('/customer-auth')}>
            <Users className="w-4 h-4 mr-2" />
            Customer Portal
          </Button>
          <Button variant="ghost" className="text-foreground hover:bg-muted" onClick={() => navigate('/auth')}>
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
