import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Bot, Building2, Zap, Shield, MessageSquare, Play, Calendar, Phone, Users, TrendingUp, Clock, MapPin, FileText, DollarSign, Package, Award, Megaphone, Gift, RotateCcw, Sun, BarChart3, Target, CheckCircle2, ArrowRight, Sparkles, Wrench, Home, Flame, Droplet, ChevronRight, Star, Navigation, Truck, Search, UserPlus, Globe, Headphones, Bell, Mail, Smartphone, Video, Mic, Brain, Layers, Lock, Send, Key, Fence, PanelTop, Wind, DoorOpen, Bug, TreeDeciduous, Waves, TreePine, Trash2, Refrigerator, Hammer, PaintBucket, Grid3X3, Sparkle, Car, HardHat, Wifi, Camera } from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import heroVideo from '@/assets/aura-intercept-hero.mp4';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
const agentCategories = [{
  id: 'customer',
  name: 'Customer Portal',
  icon: Users,
  color: 'from-cyan-500 to-blue-500',
  agents: [{
    name: 'AI Receptionist',
    description: 'AI-powered inquiry routing to the right department instantly',
    icon: Target
  }, {
    name: 'Scheduling Agent',
    description: 'Natural language appointment scheduling with calendar sync',
    icon: Calendar
  }, {
    name: 'Follow-up Agent',
    description: 'Automated reminders via email, SMS, and voice calls',
    icon: Bell
  }, {
    name: 'Review Agent',
    description: 'Collects feedback and manages multi-platform reviews',
    icon: Star
  }]
}, {
  id: 'field',
  name: 'Field Operations',
  icon: MapPin,
  color: 'from-green-500 to-emerald-500',
  agents: [{
    name: 'Dispatch Agent',
    description: 'Smart job assignment based on skills and location',
    icon: Users
  }, {
    name: 'Route Agent',
    description: 'Real-time route optimization for maximum efficiency',
    icon: Navigation
  }, {
    name: 'ETA Agent',
    description: 'Accurate arrival time predictions with customer notifications',
    icon: Clock
  }, {
    name: 'Check-in Agent',
    description: 'Job status tracking with photo documentation',
    icon: CheckCircle2
  }]
}, {
  id: 'business',
  name: 'Business Management',
  icon: Building2,
  color: 'from-purple-500 to-violet-500',
  agents: [{
    name: 'Quoting Agent',
    description: 'Instant quote generation with service pricing lookup',
    icon: FileText
  }, {
    name: 'Invoice Agent',
    description: 'Automated invoicing with payment tracking',
    icon: DollarSign
  }, {
    name: 'Admin Agent',
    description: 'Business administration and company management tasks',
    icon: Building2
  }]
}];
const agentConsoles = [{
  name: 'Customer Portal Console',
  description: 'Complete customer engagement hub for appointment scheduling, follow-ups, and review collection.',
  icon: Calendar,
  gradient: 'from-cyan-500 to-blue-500',
  iconBg: 'bg-cyan-500/10',
  iconColor: 'text-cyan-500',
  features: ['24/7 natural language booking', 'Multi-service appointment scheduling', 'Automated email & SMS reminders', 'Customer review & Feedback', 'Quote request handling', 'Review request automation']
}, {
  name: 'Field Operations Console',
  description: 'Technician-focused mobile console for job management, navigation, and customer communication.',
  icon: Truck,
  gradient: 'from-green-500 to-emerald-500',
  iconBg: 'bg-green-500/10',
  iconColor: 'text-green-500',
  features: ['One-tap job acceptance', 'Real-time GPS navigation', 'ETA updates with notifications', 'Before/after photo capture', 'Job status tracking', 'Dispatch communication']
}, {
  name: 'Business Management Console',
  description: 'Financial operations center for quotes, invoices, and business administration.',
  icon: DollarSign,
  gradient: 'from-purple-500 to-violet-500',
  iconBg: 'bg-purple-500/10',
  iconColor: 'text-purple-500',
  features: ['AI-assisted quote generation', 'Automated invoice creation', 'Payment status tracking', 'Price lookup assistant', 'Dashboard & Analytics', 'Employee management']
}];
const platformFeatures = [{
  icon: MessageSquare,
  title: 'Multi-Channel AI',
  description: 'Voice calls, SMS, email, and web chat - customers connect on their preferred channel.'
}, {
  icon: Globe,
  title: 'Customer Portal',
  description: 'Self-service portal where customers book, track appointments, and chat with AI agents.'
}, {
  icon: Building2,
  title: 'White-Label Ready',
  description: 'Custom logos, colors, and branding. Your company, your AI agents.'
}, {
  icon: Layers,
  title: 'Multi-Tenant Platform',
  description: 'Serve unlimited companies with isolated data and custom configurations.'
}, {
  icon: Smartphone,
  title: 'Mobile-First Design',
  description: 'Technician consoles optimized for field work on any device.'
}, {
  icon: Brain,
  title: 'AI Powered Ops',
  description: 'Intelligent agent handoffs with context preservation across conversations.'
}, {
  icon: Bell,
  title: 'Smart Reminders',
  description: 'Email, SMS, and voice reminders reduce no-shows by up to 40%.'
}, {
  icon: Lock,
  title: 'Enterprise Security',
  description: 'Row-level security and role-based access protect sensitive data.'
}];
const communicationChannels = [{
  icon: Mic,
  title: 'Voice AI',
  description: 'Natural voice conversations with AI agents for phone-based customer service.',
  color: 'from-pink-500 to-rose-500'
}, {
  icon: MessageSquare,
  title: 'SMS/Text',
  description: 'Two-way text messaging for appointment reminders and quick updates.',
  color: 'from-green-500 to-emerald-500'
}, {
  icon: Mail,
  title: 'Email',
  description: 'Automated email campaigns, confirmations, and digest reports.',
  color: 'from-blue-500 to-cyan-500'
}, {
  icon: Headphones,
  title: 'Web Chat',
  description: 'Embeddable chat widget for website visitor engagement.',
  color: 'from-purple-500 to-violet-500'
}];
const industryCategories = [{
  category: 'Essential Trades',
  emoji: '⚡',
  subtitle: 'High-Urgency',
  industries: [{
    name: 'HVAC',
    icon: Flame,
    description: 'Heating, Ventilation, & AC'
  }, {
    name: 'Plumbing',
    icon: Droplet,
    description: 'Emergency & Installations'
  }, {
    name: 'Electrical',
    icon: Zap,
    description: 'Residential & Commercial'
  }]
}, {
  category: 'Exterior & Structural',
  emoji: '🏠',
  subtitle: 'Services',
  industries: [{
    name: 'Roofing',
    icon: Home,
    description: 'Repair & Storm Damage'
  }, {
    name: 'Fencing & Decking',
    icon: Fence,
    description: 'Perimeter Solutions'
  }, {
    name: 'Solar Energy',
    icon: Sun,
    description: 'Panels & Maintenance'
  }]
}, {
  category: 'Property & Estate',
  emoji: '🌿',
  subtitle: 'Maintenance',
  industries: [{
    name: 'Pest Control',
    icon: Bug,
    description: 'Residential & Commercial'
  }, {
    name: 'Landscape & Trees',
    icon: TreeDeciduous,
    description: 'Design, Trimming, & Removal'
  }, {
    name: 'Pool & Spa',
    icon: Waves,
    description: 'Chemistry & Equipment'
  }]
}, {
  category: 'Specialized Home',
  emoji: '🛠',
  subtitle: 'Services',
  industries: [{
    name: 'Appliance Repair',
    icon: Refrigerator,
    description: 'Kitchen & Laundry'
  }, {
    name: 'Handyman & Cleaning',
    icon: Hammer,
    description: 'Repair & Janitorial'
  }, {
    name: 'Painting',
    icon: PaintBucket,
    description: 'Interior & Exterior'
  }, {
    name: 'Flooring & Tile',
    icon: Grid3X3,
    description: 'Hardwood & Stone'
  }]
}, {
  category: 'Mobile & Commercial',
  emoji: '🚗',
  subtitle: 'Services',
  industries: [{
    name: 'Auto Care',
    icon: Car,
    description: 'Detailing & Repair'
  }, {
    name: 'Security Systems',
    icon: Camera,
    description: 'Cameras & Alarms'
  }]
}];
const howItWorks = [{
  step: 1,
  title: 'Sign Up & Configure',
  description: 'Create your company profile with custom branding, services, and business hours.',
  icon: Building2
}, {
  step: 2,
  title: 'Activate AI Agents',
  description: 'Enable 11 specialized AI agents and configure your knowledge base for your business.',
  icon: Bot
}, {
  step: 3,
  title: 'Connect Customers',
  description: 'Share your customer portal link or embed the chat widget on your website.',
  icon: Users
}, {
  step: 4,
  title: 'Automate & Scale',
  description: 'AI handles bookings, field ops, and billing 24/7 while you focus on growth.',
  icon: Zap
}];
const heroStats = [{
  value: '11',
  label: 'AI Agents'
}, {
  value: '24/7',
  label: 'Automation'
}, {
  value: '3',
  label: 'Agent Consoles'
}, {
  value: '40%',
  label: 'Less No-Shows'
}];
const subtitles = ['Booking & Scheduling', 'Field Operations', 'Billing & Invoicing', 'Customer Portal', 'Business Management'];
export default function Index() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('customer');
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle(prev => (prev + 1) % subtitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return <div className="min-h-screen bg-background">
      <PublicHeader showHomeLink={false} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-30" />
        <div className="container max-w-7xl mx-auto px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-wide mb-4 animate-fade-in">
              <span className="font-brand text-[#214ebb]">Aura Intercept</span>
              <span className="block text-xl sm:text-2xl md:text-3xl mt-2 font-normal font-sans text-foreground">
                Where Service Companies Meet AI Efficiency
              </span>
            </h1>

            {/* Hero Video */}
            <div className="max-w-md mx-auto mb-6 animate-fade-in">
              <video src={heroVideo} autoPlay loop muted playsInline className="w-full h-auto rounded-2xl" />
            </div>

            <div className="h-8 mb-6 animate-fade-in">
              <p className="text-xl text-primary font-medium transition-all duration-500">
                {subtitles[currentSubtitle]}
              </p>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">"Aura Intercept provides intelligent AI agents that automatically handle your customer service and scheduling, ensuring your trade business never misses a lead or a loyal client, giving you the freedom to focus on the work in the field while we master the work in the office."   </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button size="lg" className="gradient-primary shadow-glow text-lg px-8 py-6 w-full sm:w-auto" onClick={() => navigate('/auth?mode=company')}>
                <Building2 className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* === COMPANY/BUSINESS SECTION === */}
      
      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">For Service Businesses</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 4 Simple Steps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From signup to full automation in minutes, not months.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => <div key={item.step} className="relative">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <item.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="text-sm font-medium text-primary mb-2">Step {item.step}</div>
                    <h3 className="text-lg font-semibold mb-2 text-secondary">{item.title}</h3>
                    <p className="text-sm text-card-muted">{item.description}</p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/50" />
                  </div>}
              </div>)}
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">AI Agents</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">11 Specialized AI Agents</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each agent is purpose-built to handle specific business functions, 
              working together seamlessly with intelligent handoffs and context preservation.
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 mb-8 h-auto bg-transparent">
              {agentCategories.map(category => <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground px-4 py-2">
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </TabsTrigger>)}
            </TabsList>

            {agentCategories.map(category => <TabsContent key={category.id} value={category.id}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.agents.map((agent, index) => <Card key={agent.name} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 animate-fade-in" style={{
                animationDelay: `${index * 50}ms`
              }}>
                      <CardContent className="p-5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3`}>
                          <agent.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold mb-1">{agent.name}</h4>
                        <p className="text-sm text-card-muted">{agent.description}</p>
                      </CardContent>
                    </Card>)}
                </div>
              </TabsContent>)}
          </Tabs>
        </div>
      </section>

      {/* Agent Consoles Preview */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Agent Consoles</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">3 Powerful Aura Control Centers</h2>
            <p className="text-foreground max-w-2xl mx-auto">
              Purpose-built consoles give your team full control over AI agent operations with intuitive interfaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentConsoles.map((console, index) => <Card key={console.name} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${console.gradient}`} />
                <CardContent className="p-6">
                  <p className="text-xs text-white/80 font-medium tracking-wide mb-1">AI Aura Intercept</p>
                  <p className="text-[10px] text-white/60 mb-3">The All-in-One AI Command Center for Service Pros</p>
                  <div className={`w-12 h-12 rounded-xl ${console.iconBg} flex items-center justify-center mb-4`}>
                    <console.icon className={`w-6 h-6 ${console.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{console.name}</h3>
                  <p className="text-card-muted text-sm mb-4">
                    {console.description}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {console.features.slice(0, 4).map((feature, idx) => <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-white">{feature}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Communication Channels */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Multi-Channel</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Engage Customers Everywhere</h2>
            <p className="text-foreground max-w-2xl mx-auto">
              AI agents work across all communication channels, providing consistent experiences.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {communicationChannels.map((channel, index) => <Card key={channel.title} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 text-center">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center mx-auto mb-4`}>
                    <channel.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                  <p className="text-sm text-card-muted">{channel.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">The All-in-One AI Intercept Center for Service Pros</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Transform your service business software into a 24/7 revenue engine. Our Intercept Center offers a multi-channel AI safety net that captures every customer inquiry through intelligent ai chat agents and voice agents. Manage your mobile workforce with ease using our technician consoles and provide your clients with a self-service appointment tracking portal. By automating smart reminders and office workflows, Aura Intercept eliminates manual tasks,
and allows your team to focus on delivering expert onsite service.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => <Card key={feature.title} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 animate-fade-in" style={{
            animationDelay: `${index * 50}ms`
          }}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-card-muted">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Industries</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI Automation for Field Service Industries</h2>
            <p className="text-foreground max-w-2xl mx-auto">
              "In the fast-paced world of home and commercial services, responsiveness is the key to growth. Aura Intercept brings intelligent automation to the trades, providing a white-label AI workforce that intercepts every inquiry and books it directly into your calendar. Our platform is engineered for onsite service providers who need to eliminate manual office tasks and reduce no-shows without losing the personal touch. From landscaping to restoration, we empower service-based businesses to automate their workflow and focus on the work that matters."
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center max-w-4xl mx-auto">
            {industryCategories.flatMap(cat => cat.industries).map((industry) => (
              <div key={industry.name} className="rounded-xl p-3 text-center transition-all duration-300 hover:opacity-90 w-full" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mx-auto mb-2">
                  <industry.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-medium text-xs mb-0.5 text-white">{industry.name}</h4>
                <p className="text-[10px] text-white/70 leading-tight hidden sm:block">{industry.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="gradient-primary shadow-glow text-lg px-8 py-6" onClick={() => navigate('/auth?mode=company')}>
              <Building2 className="w-5 h-5 mr-2" />
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* === CUSTOMER SECTION === */}
      
      {/* Customer Portal Section */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">For Customers</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Self-Service Customer Portal
            </h2>
            <p className="text-lg text-foreground max-w-2xl mx-auto">
              Get 24/7 access to book appointments, get quotes, track service status, 
              and chat with AI agents - all in one convenient place.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Easy Appointment Booking</h4>
                <p className="text-sm text-foreground">Select from available services and time slots with real-time calendar sync.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Instant Quote Requests</h4>
                <p className="text-sm text-foreground">Get AI-powered quotes based on your service needs.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Appointment Tracking</h4>
                <p className="text-sm text-foreground">Real-time status updates with technician ETA and job completion notifications.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI Chat Support</h4>
                <p className="text-sm text-foreground">Natural language conversations with AI agents for instant answers.</p>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/customer-auth')}>
                <Users className="w-5 h-5 mr-2" />
                Access Customer Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Simple Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">One Plan. Everything Included.</h2>
            <p className="text-foreground max-w-2xl mx-auto">
              No hidden fees. No feature restrictions. Full access to all AI agents and consoles.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="relative overflow-hidden border-primary/50 shadow-glow">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              <CardContent className="p-8 text-center">
                <Badge className="mb-4 gradient-primary border-0">Most Popular</Badge>
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-5xl font-bold gradient-text">$250</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">11 Specialized AI Agents</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">3 AI Agent Consoles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">24/7 Automated Booking & Scheduling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">Voice, SMS & Email Reminders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">Field Operations Management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">Quoting & Invoicing System</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">Custom Widget for Your Website</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">10 Employee Accounts Included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white">White-Label Branding</span>
                  </div>
                </div>

                <Button size="lg" className="w-full gradient-primary shadow-glow text-lg py-6" onClick={() => navigate('/auth?mode=company')}>
                  <Zap className="w-5 h-5 mr-2" />
                  Start 14-Day Free Trial
                </Button>
                <p className="text-sm text-white mt-4">
                  No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-foreground mb-2">Additional employees beyond 10:</p>
              <p className="font-medium">$10/month per employee</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>;
}