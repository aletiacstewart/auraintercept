import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bot, Building2, Zap, Shield, MessageSquare, Play } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Agents',
      description: 'Intelligent assistants that handle appointments, calls, and customer queries 24/7.'
    },
    {
      icon: MessageSquare,
      title: 'Multi-Channel Support',
      description: 'Voice calls, SMS, and chat widget - all channels in one platform.'
    },
    {
      icon: Building2,
      title: 'White-Label Ready',
      description: 'Fully customizable branding with your logo and colors.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Row-level security and multi-tenant isolation for your data.'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border/50">
        <nav className="container max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary p-0.5">
              <div className="w-full h-full rounded-xl bg-background flex items-center justify-center overflow-hidden">
                <img src={logo} alt="AI Bot Company" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Bot Company</h1>
              <p className="text-xs text-muted-foreground">The Future of Work</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/demo')}>
              <Play className="w-4 h-4 mr-1" />
              Try Demo
            </Button>
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="gradient-primary" onClick={() => navigate('/auth?mode=company')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
          <Zap className="w-4 h-4" />
          AI-Powered Business Automation
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
          Your Business. <span className="gradient-text">Your AI Agent.</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
          Create custom AI agents that handle appointments, calls, and customer service 
          for appointment-based businesses. White-label ready.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <Button 
            size="lg" 
            className="gradient-primary shadow-glow text-lg px-8 py-6"
            onClick={() => navigate('/auth?mode=company')}
          >
            <Building2 className="w-5 h-5 mr-2" />
            Subscribe Your Company
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/demo')}
          >
            <Play className="w-5 h-5 mr-2" />
            Try Live Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl gradient-primary p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join hundreds of businesses already using AI agents to automate appointments and customer service.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth?mode=company')}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AI Bot Company" className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">© 2024 AI Bot Company. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
