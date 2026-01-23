import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';

export function PublicFooter() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const handleContactClick = () => {
    setShowChat(true);
  };

  return (
    <>
      <footer className="border-t border-border/50 py-12 bg-card">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Aura Intercept" className="w-8 h-8" />
                <div className="flex flex-col">
                  <span className="font-semibold text-card-foreground">Aura Intercept</span>
                  <span className="text-xs text-card-foreground/80 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Smart Agents, Automated Service
                  </span>
                </div>
              </div>
              <p className="text-sm text-card-foreground/80">AI operatives automating appointment-based businesses in Texas.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-card-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-card-foreground/80">
                <li><button onClick={() => navigate('/auth?mode=company')} className="hover:text-card-foreground transition-colors">Start Trial</button></li>
                <li><button onClick={() => navigate('/auth?mode=company')} className="hover:text-card-foreground transition-colors">Company Subscription</button></li>
                <li><button onClick={() => navigate('/customer-auth')} className="hover:text-card-foreground transition-colors">Customer Portal</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-card-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-card-foreground/80">
                <li><a href="#" className="hover:text-card-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-card-foreground transition-colors">Blog</a></li>
                <li><button onClick={handleContactClick} className="hover:text-card-foreground transition-colors">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-card-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-card-foreground/80">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-card-foreground transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-card-foreground transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-white/70">© 2025 Aura Intercept. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80" onClick={() => navigate('/customer-auth')}>
                Customer Portal
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </footer>
      
      {showChat && (
        <FloatingChatWidget
          websiteId="aura-intercept-footer"
          primaryColor="#214ebb"
        />
      )}
    </>
  );
}