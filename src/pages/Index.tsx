import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Building2, Zap, Shield, MessageSquare, Play, 
  Calendar, Phone, Users, TrendingUp, Clock, MapPin,
  FileText, DollarSign, Package, Award, Megaphone, 
  Gift, RotateCcw, Sun, BarChart3, Target, CheckCircle2,
  ArrowRight, Sparkles, Wrench, Home, Flame, Droplet,
  ChevronRight, Star, Volume2, VolumeX, Navigation, Truck,
  Search, UserPlus, Globe, Headphones, Bell, Mail, 
  Smartphone, Video, Mic, Brain, Layers, Lock
} from 'lucide-react';
import logo from '@/assets/ai-header-logo-new.png';

const agentCategories = [
  {
    id: 'customer',
    name: 'Customer Engagement',
    icon: Users,
    color: 'from-cyan-500 to-blue-500',
    agents: [
      { name: 'Triage Agent', description: 'AI-powered inquiry routing to the right department instantly', icon: Target },
      { name: 'Booking Agent', description: 'Natural language appointment scheduling with calendar sync', icon: Calendar },
      { name: 'Follow-up Agent', description: 'Automated reminders via email, SMS, and voice calls', icon: Bell },
      { name: 'Review Agent', description: 'Collects feedback and manages multi-platform reviews', icon: Star },
    ]
  },
  {
    id: 'field',
    name: 'Field Operations',
    icon: MapPin,
    color: 'from-green-500 to-emerald-500',
    agents: [
      { name: 'Dispatch Agent', description: 'Smart job assignment based on skills and location', icon: Users },
      { name: 'Route Agent', description: 'Real-time route optimization for maximum efficiency', icon: Navigation },
      { name: 'ETA Agent', description: 'Accurate arrival time predictions with customer notifications', icon: Clock },
      { name: 'Check-in Agent', description: 'Job status tracking with photo documentation', icon: CheckCircle2 },
    ]
  },
  {
    id: 'business',
    name: 'Business Operations',
    icon: Building2,
    color: 'from-purple-500 to-violet-500',
    agents: [
      { name: 'Quoting Agent', description: 'Instant quote generation with service pricing lookup', icon: FileText },
      { name: 'Invoice Agent', description: 'Automated invoicing with payment tracking', icon: DollarSign },
      { name: 'Inventory Agent', description: 'Parts tracking with low-stock alerts', icon: Package },
      { name: 'Warranty Agent', description: 'Warranty registration and claims management', icon: Award },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing & Sales',
    icon: Megaphone,
    color: 'from-orange-500 to-red-500',
    agents: [
      { name: 'Campaign Agent', description: 'Multi-channel promotional campaign automation', icon: Megaphone },
      { name: 'Referral Agent', description: 'Customer referral tracking with rewards', icon: Gift },
      { name: 'Win-back Agent', description: 'Re-engage inactive customers with personalized offers', icon: RotateCcw },
      { name: 'Lead Agent', description: 'Lead capture and qualification automation', icon: UserPlus },
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Insights',
    icon: BarChart3,
    color: 'from-indigo-500 to-blue-600',
    agents: [
      { name: 'Insights Agent', description: 'Real-time business performance dashboards', icon: BarChart3 },
      { name: 'Forecast Agent', description: 'AI-powered demand and revenue predictions', icon: TrendingUp },
      { name: 'KPI Agent', description: 'Custom metrics and goal tracking', icon: Target },
      { name: 'Report Agent', description: 'Automated weekly and monthly digest reports', icon: FileText },
    ]
  }
];

const agentConsoles = [
  {
    name: 'Booking Console',
    description: 'Complete customer engagement hub for appointment scheduling, follow-ups, and review collection.',
    icon: Calendar,
    gradient: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    features: [
      '24/7 natural language booking',
      'Multi-service appointment scheduling',
      'Automated email & SMS reminders',
      'Customer feedback collection',
      'Quote generation wizard',
      'Review request campaigns'
    ]
  },
  {
    name: 'Field Ops Console',
    description: 'Technician-focused mobile console for job management, navigation, and customer communication.',
    icon: Truck,
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
    features: [
      'One-tap job acceptance',
      'Real-time GPS navigation',
      'ETA updates with notifications',
      'Before/after photo capture',
      'Parts usage tracking',
      'Dispatch communication'
    ]
  },
  {
    name: 'Billing Console',
    description: 'Financial operations center for quotes, invoices, payments, and warranty management.',
    icon: DollarSign,
    gradient: 'from-purple-500 to-violet-500',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    features: [
      'AI-assisted quote generation',
      'Automated invoice creation',
      'Payment status tracking',
      'Warranty claim processing',
      'Price lookup assistant',
      'Inventory cost tracking'
    ]
  },
  {
    name: 'Marketing Console',
    description: 'Growth and retention hub for campaigns, referrals, and customer win-back automation.',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    features: [
      'Multi-channel campaigns',
      'Customer segmentation',
      'Promo code management',
      'Referral program tracking',
      'Win-back automation',
      'Lead capture forms'
    ]
  },
  {
    name: 'Analytics Console',
    description: 'Business intelligence dashboard with KPIs, forecasting, and automated reporting.',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-blue-600',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    features: [
      'Real-time KPI dashboards',
      'Revenue trend analysis',
      'Customer insights reports',
      'Performance forecasting',
      'Automated weekly digests',
      'Custom metric tracking'
    ]
  }
];

const platformFeatures = [
  {
    icon: MessageSquare,
    title: 'Multi-Channel AI',
    description: 'Voice calls, SMS, email, and web chat - customers connect on their preferred channel.'
  },
  {
    icon: Globe,
    title: 'Customer Portal',
    description: 'Self-service portal where customers book, track appointments, and chat with AI agents.'
  },
  {
    icon: Building2,
    title: 'White-Label Ready',
    description: 'Custom logos, colors, and branding. Your company, your AI agents.'
  },
  {
    icon: Layers,
    title: 'Multi-Tenant Platform',
    description: 'Serve unlimited companies with isolated data and custom configurations.'
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Technician consoles optimized for field work on any device.'
  },
  {
    icon: Brain,
    title: 'AI Orchestration',
    description: 'Intelligent agent handoffs with context preservation across conversations.'
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Email, SMS, and voice reminders reduce no-shows by up to 40%.'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Row-level security and role-based access protect sensitive data.'
  }
];

const communicationChannels = [
  {
    icon: Mic,
    title: 'Voice AI',
    description: 'Natural voice conversations with AI agents for phone-based customer service.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: MessageSquare,
    title: 'SMS/Text',
    description: 'Two-way text messaging for appointment reminders and quick updates.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'Automated email campaigns, confirmations, and digest reports.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Headphones,
    title: 'Web Chat',
    description: 'Embeddable chat widget for website visitor engagement.',
    color: 'from-purple-500 to-violet-500'
  }
];

const industries = [
  { name: 'HVAC', icon: Flame, description: 'Heating, ventilation, and AC services' },
  { name: 'Plumbing', icon: Droplet, description: 'Residential and commercial plumbing' },
  { name: 'Home Services', icon: Home, description: 'Cleaning, pest control, landscaping' },
  { name: 'Repair Services', icon: Wrench, description: 'Appliance and equipment repair' },
];

const howItWorks = [
  {
    step: 1,
    title: 'Sign Up & Configure',
    description: 'Create your company profile with custom branding, services, and business hours.',
    icon: Building2
  },
  {
    step: 2,
    title: 'Activate AI Agents',
    description: 'Enable 20+ specialized AI agents and configure knowledge base for your business.',
    icon: Bot
  },
  {
    step: 3,
    title: 'Connect Customers',
    description: 'Share your customer portal link or embed the chat widget on your website.',
    icon: Users
  },
  {
    step: 4,
    title: 'Automate & Scale',
    description: 'AI handles bookings, field ops, billing, and marketing 24/7 while you focus on growth.',
    icon: Zap
  }
];

const heroStats = [
  { value: '20+', label: 'AI Agents' },
  { value: '24/7', label: 'Automation' },
  { value: '5', label: 'Agent Consoles' },
  { value: '40%', label: 'Less No-Shows' },
];

const subtitles = [
  'Booking & Scheduling',
  'Field Operations',
  'Billing & Invoicing',
  'Customer Engagement',
  'Marketing Automation',
  'Analytics & Insights',
];

export default function Index() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('customer');
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-black border-b border-border/50 sticky top-0 z-50 py-0.5">
        <nav className="container max-w-7xl mx-auto flex items-center justify-between px-6">
          <div className="flex items-center">
            <img src={logo} alt="AI Bot Company" style={{ width: '325px', height: 'auto' }} className="object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/demo')}>
              <Play className="w-4 h-4 mr-1" />
              Try Demo
            </Button>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => navigate('/customer-auth')}>
              <Users className="w-4 h-4 mr-1" />
              Customer Portal
            </Button>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="gradient-primary" onClick={() => navigate('/auth?mode=company')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Video */}
        <div className="w-full relative">
          <video 
            ref={videoRef}
            autoPlay
            loop 
            muted
            playsInline
            className="w-full h-auto max-h-[70vh] object-cover"
          >
            <source src="/videos/hero-demo.mp4" type="video/mp4" />
          </video>
          
          {/* Unmute/Mute Button */}
          <button
            onClick={isMuted ? handleUnmute : handleMute}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition-all duration-200 z-10"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Hero Content */}
        <div className="relative">
          <div className="absolute inset-0 tech-grid opacity-30" />
          <div className="container max-w-7xl mx-auto px-6 py-16 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                20+ AI Agents • 5 Consoles • One Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in">
                Automate Your Business with{' '}
                <span className="gradient-text">AI Agent Consoles</span>
              </h1>

              <div className="h-8 mb-6 animate-fade-in">
                <p className="text-xl text-primary font-medium transition-all duration-500">
                  {subtitles[currentSubtitle]}
                </p>
              </div>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
                Deploy 20+ specialized AI agents across 5 powerful consoles to handle customer engagement, 
                field operations, billing, marketing, and analytics. White-label ready with customer portal.
              </p>

              {/* Hero Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-10 animate-fade-in">
                {heroStats.map((stat, index) => (
                  <div 
                    key={stat.label} 
                    className="p-4 rounded-xl border border-border/50 bg-card/80"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
                <Button 
                  size="lg" 
                  className="gradient-primary shadow-glow text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => navigate('/auth?mode=company')}
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => navigate('/customer-auth')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Customer Portal
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => navigate('/demo')}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Live Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 4 Simple Steps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From signup to full automation in minutes, not months.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <item.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="text-sm font-medium text-primary mb-2">Step {item.step}</div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">AI Agents</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">20+ Specialized AI Agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each agent is purpose-built to handle specific business functions, 
              working together seamlessly with intelligent handoffs and context preservation.
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 mb-8 h-auto bg-transparent">
              {agentCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground px-4 py-2"
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {agentCategories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.agents.map((agent, index) => (
                    <Card 
                      key={agent.name} 
                      className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3`}>
                          <agent.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold mb-1">{agent.name}</h4>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Agent Consoles Preview */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Agent Consoles</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">5 Powerful Control Centers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Purpose-built consoles give your team full control over AI agent operations with intuitive interfaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentConsoles.map((console, index) => (
              <Card 
                key={console.name}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden group"
              >
                <div className={`h-2 bg-gradient-to-r ${console.gradient}`} />
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${console.iconBg} flex items-center justify-center mb-4`}>
                    <console.icon className={`w-6 h-6 ${console.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{console.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {console.description}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {console.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Portal Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">Customer Portal</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Self-Service Portal for Your Customers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Give your customers 24/7 access to book appointments, get quotes, track service status, 
                and chat with AI agents - all branded with your company's look and feel.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Easy Appointment Booking</h4>
                    <p className="text-sm text-muted-foreground">Customers select from your services and available time slots with real-time calendar sync.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Instant Quote Requests</h4>
                    <p className="text-sm text-muted-foreground">AI-powered quote generation based on your service pricing and customer needs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Appointment Tracking</h4>
                    <p className="text-sm text-muted-foreground">Real-time status updates with technician ETA and job completion notifications.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">AI Chat Support</h4>
                    <p className="text-sm text-muted-foreground">Natural language conversations with AI agents for instant answers and assistance.</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="gradient-primary"
                onClick={() => navigate('/customer-auth')}
              >
                <Users className="w-5 h-5 mr-2" />
                Try Customer Portal
              </Button>
            </div>
            
            <div className="relative">
              <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">AI Assistant</div>
                      <div className="text-xs text-muted-foreground">Always available to help</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">Hi! I'm here to help you with your HVAC needs. Would you like to book an appointment, get a quote, or track an existing service?</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 max-w-[80%] ml-auto">
                      <p className="text-sm">I'd like to schedule an AC maintenance check</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">Great! I can help you with that. Let me check our available slots. When works best for you?</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      Book Now
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="w-4 h-4 mr-1" />
                      Get Quote
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Communication Channels */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Multi-Channel</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Engage Customers Everywhere</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              AI agents work across all communication channels, providing consistent experiences.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {communicationChannels.map((channel, index) => (
              <Card 
                key={channel.title}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 text-center"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center mx-auto mb-4`}>
                    <channel.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for service businesses that demand reliability, security, and scalability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <Card 
                key={feature.title}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Industries</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Service Businesses</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Perfect for any appointment-based business that needs to manage scheduling, 
              field operations, and customer communications.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <Card 
                key={industry.name}
                className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 text-center"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <industry.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="rounded-3xl gradient-primary p-8 sm:p-12 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 tech-grid opacity-10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Join businesses already using AI agents to automate operations and delight customers 24/7.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/auth?mode=company')}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => navigate('/demo')}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <li><button onClick={() => navigate('/demo')} className="hover:text-foreground transition-colors">Live Demo</button></li>
                <li><button onClick={() => navigate('/customer-auth')} className="hover:text-foreground transition-colors">Customer Portal</button></li>
                <li><button onClick={() => navigate('/auth?mode=company')} className="hover:text-foreground transition-colors">Start Trial</button></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/customer-auth')}>
                Customer Portal
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/demo')}>
                Try Demo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
