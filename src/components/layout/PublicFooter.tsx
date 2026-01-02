import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/ai-bot-company-logo-new.png';

export function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/50 py-12 bg-card">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="AI Bot Company" className="w-8 h-8" />
              <span className="font-semibold">AI Bot Company</span>
            </div>
            <p className="text-sm text-muted-foreground">
              20+ AI agents automating appointment-based businesses worldwide.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate('/auth?mode=company')} className="hover:text-foreground transition-colors">Start Trial</button></li>
              <li><button onClick={() => navigate('/auth?mode=company')} className="hover:text-foreground transition-colors">Company Subscription</button></li>
              <li><button onClick={() => navigate('/customer-auth')} className="hover:text-foreground transition-colors">Customer Portal</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2025 AI Bot Company. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/customer-auth')}>
              Customer Portal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
