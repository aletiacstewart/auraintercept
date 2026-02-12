import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Building2, Zap, Shield, MessageSquare, Calendar, Phone, Users, TrendingUp, Clock, MapPin, FileText, DollarSign, Package, Megaphone, Sun, BarChart3, Target, CheckCircle2, Home, Flame, Droplet, ChevronRight, ChevronDown, ChevronUp, Star, Navigation, Truck, Search, UserPlus, Globe, Headphones, Bell, Mail, Smartphone, Mic, Brain, Lock, Send, Fence, Bug, TreeDeciduous, Waves, Refrigerator, Hammer, HardHat, Camera, Car, Briefcase, HeadphonesIcon, Scissors, UtensilsCrossed, Palette } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logo from '@/assets/aura-intercept-logo.png';
// Hero video served from public folder for better browser compatibility
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
import { PricingComparisonTable } from '@/components/landing/PricingComparisonTable';
import { CompetitiveDifferentiation } from '@/components/landing/CompetitiveDifferentiation';
const agentCategories = [{
  id: 'customer',
  name: 'Customer Portal',
  icon: Users,
  color: 'from-cyan-500 to-blue-500',
  agents: [{
    name: 'AI Receptionist',
    description: 'First point of contact that classifies intent and routes to specialized agents',
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
  name: 'Business Operations',
  icon: Building2,
  color: 'from-purple-500 to-violet-500',
  agents: [{
    name: 'Admin Agent',
    description: 'User management, company settings, and access control',
    icon: Lock
  }, {
    name: 'Quoting Agent',
    description: 'Dynamic pricing and instant quote generation',
    icon: FileText
  }, {
    name: 'Invoice Agent',
    description: 'Automated invoicing with payment tracking',
    icon: DollarSign
  }, {
    name: 'Inventory Agent',
    description: 'Stock tracking, low stock alerts, and auto-reorder',
    icon: Package
  }]
}, {
  id: 'analytics',
  name: 'Analytics & Reports',
  icon: BarChart3,
  color: 'from-cyan-500 to-indigo-500',
  agents: [{
    name: 'Insights Agent',
    description: 'Business intelligence with trends and anomaly detection',
    icon: TrendingUp
  }, {
    name: 'Performance Agent',
    description: 'Team metrics, goals tracking, and optimization',
    icon: BarChart3
  }, {
    name: 'Revenue Agent',
    description: 'Revenue analysis and financial forecasting',
    icon: DollarSign
  }, {
    name: 'Forecast Agent',
    description: 'Demand, staffing, and resource predictions',
    icon: Clock
  }]
}, {
  id: 'marketing',
  name: 'Outreach & Sales Ops',
  icon: Megaphone,
  color: 'from-orange-500 to-amber-500',
  agents: [{
    name: 'Campaign Agent',
    description: 'Creates and schedules email and SMS marketing campaigns with performance analytics',
    icon: Megaphone
  }, {
    name: 'Lead Agent',
    description: 'Qualifies and scores leads with automated follow-up sequences',
    icon: UserPlus
  }, {
    name: 'Marketing Agent',
    description: 'Manages customer segments, promo codes, and referral programs',
    icon: Target
  }]
}, {
  id: 'social',
  name: 'Social Media Ops',
  icon: Send,
  color: 'from-pink-500 to-rose-500',
  agents: [{
    name: 'Social Media Agent',
    description: 'AI-powered content creation for all social platforms',
    icon: Send
  }, {
    name: 'Social Media Scheduler',
    description: 'Automated post scheduling across 6 platforms',
    icon: Calendar
  }, {
    name: 'Social Media Analytics',
    description: 'Engagement metrics and performance tracking',
    icon: BarChart3
  }]
}, {
  id: 'creative_web_presence',
  name: 'Creative & Web Presence',
  icon: Palette,
  color: 'from-teal-500 to-cyan-500',
  agents: [{
    name: 'Creative Agent',
    description: 'AI-powered multi-channel content generation for blogs, campaigns, and websites',
    icon: Palette
  }, {
    name: 'Web Presence Agent',
    description: 'AI-powered website and blog management with SEO optimization',
    icon: Globe
  }]
}];
const agentConsoles = [{
  name: 'Customer Portal Console',
  description: 'AI-powered customer interactions with booking, quotes, and support.',
  icon: HeadphonesIcon,
  gradient: 'from-cyan-500 to-blue-500',
  iconBg: 'bg-cyan-500/10',
  iconColor: 'text-cyan-500',
  features: ['Online booking', 'Quote requests', 'Appointment tracking', 'AI chat support']
}, {
  name: 'Field Operations Console',
  description: 'Dispatch, routing, and real-time technician management.',
  icon: Truck,
  gradient: 'from-green-500 to-emerald-500',
  iconBg: 'bg-green-500/10',
  iconColor: 'text-green-500',
  features: ['Smart dispatch', 'Route optimization', 'Live ETA tracking', 'Technician check-in']
}, {
  name: 'Business Management Console',
  description: 'Invoicing, inventory, and business operations.',
  icon: Briefcase,
  gradient: 'from-orange-500 to-amber-500',
  iconBg: 'bg-orange-500/10',
  iconColor: 'text-orange-500',
  features: ['Invoice generation', 'Inventory tracking', 'Quote builder', 'Lead management']
}, {
  name: 'Outreach & Sales Ops Console',
  description: 'Lead management and campaign automation.',
  icon: Megaphone,
  gradient: 'from-purple-500 to-pink-500',
  iconBg: 'bg-purple-500/10',
  iconColor: 'text-purple-500',
  features: ['Lead capture', 'Campaign automation', 'Customer segments', 'Follow-up sequences']
}, {
  name: 'Analytics & Reports Console',
  description: 'KPIs, insights, and performance dashboards.',
  icon: BarChart3,
  gradient: 'from-indigo-500 to-violet-500',
  iconBg: 'bg-indigo-500/10',
  iconColor: 'text-indigo-500',
  features: ['KPI dashboard', 'Revenue analysis', 'Trend forecasting', 'Performance reports']
}, {
  name: 'Social Media Console',
  description: 'AI content creation and scheduling across all platforms.',
  icon: Send,
  gradient: 'from-pink-500 to-rose-500',
  iconBg: 'bg-pink-500/10',
  iconColor: 'text-pink-500',
  features: ['AI content generation', 'Multi-platform scheduling', 'Analytics dashboard', 'Brand voice consistency']
}, {
  name: 'Creative & Web Presence Console',
  description: 'AI-powered content creation and website management.',
  icon: Palette,
  gradient: 'from-teal-500 to-cyan-500',
  iconBg: 'bg-teal-500/10',
  iconColor: 'text-teal-500',
  features: ['Multi-channel content', 'Website builder', 'Blog management', 'SEO optimization']
}];
const platformFeatures = [{
  icon: Globe,
  title: 'Customer Portal',
  description: 'Self-service portal where customers book, track appointments, and chat with AI agents.'
}, {
  icon: Globe,
  title: 'Web Presence Manager',
  description: 'AI-powered branded web presence with Message Aura (Text), Talk to Aura (Voice), and booking.'
}, {
  icon: Target,
  title: 'Lead Capture & Scoring',
  description: 'Automatically capture and score leads from AI interactions with smart follow-up automation.'
}, {
  icon: Bell,
  title: 'Smart Reminders',
  description: 'Email, SMS, and voice reminders help reduce no-shows and appointment issues.'
}, {
  icon: Smartphone,
  title: 'Mobile-First Design',
  description: 'Technician consoles optimized for field work on any device.'
}, {
  icon: Brain,
  title: 'AI Powered Ops',
  description: 'Intelligent agent handoffs with context preservation across conversations.'
}, {
  icon: Lock,
  title: 'Enterprise Security',
  description: 'Row-level security and role-based access protect sensitive data.'
}, {
  icon: Send,
  title: 'Social Media',
  description: 'AI-powered content creation and scheduling across all major social platforms.'
}, {
  icon: FileText,
  title: 'Quotes & Invoicing',
  description: 'Generate professional quotes and invoices with automated payment tracking.'
}, {
  icon: Calendar,
  title: 'Smart Scheduling',
  description: 'AI-optimized appointment scheduling with calendar sync and availability management.'
}, {
  icon: MapPin,
  title: 'Route Optimization',
  description: 'Intelligent routing for field technicians to minimize drive time and maximize efficiency.'
}, {
  icon: Bot,
  title: 'Personal Assistant',
  description: 'AI-powered scheduling assistant with direct calendar sync for booking appointments.'
}];
const communicationChannels = [{
  icon: Mic,
  title: 'Talk to Aura (Voice)',
  description: 'Natural voice conversations with AI agents for phone-based customer service. Requires ElevenLabs + SignalWire.',
  color: 'bg-channel-voice',
  gradientClass: 'from-[hsl(var(--channel-voice))] to-[hsl(348,83%,50%)]'
}, {
  icon: MessageSquare,
  title: 'SMS Reminders',
  description: 'Automated text message reminders for appointments, follow-ups, and campaigns. Requires SignalWire.',
  color: 'bg-channel-sms',
  gradientClass: 'from-[hsl(var(--channel-sms))] to-[hsl(142,71%,35%)]'
}, {
  icon: Mail,
  title: 'Email Reminders',
  description: 'Automated email notifications for appointments, confirmations, and marketing campaigns.',
  color: 'bg-channel-email',
  gradientClass: 'from-[hsl(var(--channel-email))] to-[hsl(199,89%,38%)]'
}, {
  icon: Headphones,
  title: 'Message Aura (Text)',
  description: 'Text-based chat where customers type questions and receive AI responses. Works on ALL tiers.',
  color: 'bg-channel-chat',
  gradientClass: 'from-[hsl(var(--channel-chat))] to-[hsl(270,67%,48%)]'
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
  }, {
    name: 'Solar Energy',
    icon: Sun,
    description: 'Panels & Maintenance'
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
  }]
}, {
  category: 'Property & Estate',
  emoji: '🌿',
  subtitle: 'Maintenance',
  industries: [{
    name: 'Landscape & Trees',
    icon: TreeDeciduous,
    description: 'Design, Trimming, & Removal'
  }, {
    name: 'Pool & Spa',
    icon: Waves,
    description: 'Chemistry & Equipment'
  }, {
    name: 'Pest Control',
    icon: Bug,
    description: 'Residential & Commercial'
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
    name: 'Construction',
    icon: HardHat,
    description: 'Painting, Flooring, Tile & Trim'
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
  }, {
    name: 'Real Estate',
    icon: Building2,
    description: 'Residential & Commercial'
  }]
}, {
  category: 'Wellness & Personal',
  emoji: '💆',
  subtitle: 'Services',
  industries: [{
    name: 'Beauty & Wellness',
    icon: Scissors,
    description: 'Salons & Massage'
  }, {
    name: 'Restaurants',
    icon: UtensilsCrossed,
    description: 'Cafes & Food Service'
  }, {
    name: 'Personal Assistant',
    icon: Bot,
    description: 'Calendar & Scheduling'
  }]
}];
const howItWorks = [{
  step: 1,
  title: 'Sign Up & Configure',
  description: 'Create your company profile with custom branding, services, and business hours.',
  icon: Building2
}, {
  step: 2,
  title: 'Activate AI Operatives',
  description: 'Enable 24 specialized AI operatives and configure your knowledge base for your business.',
  icon: Bot
}, {
  step: 3,
  title: 'Connect Customers',
  description: 'Share your customer portal link or embed Message Aura (Text) on your website.',
  icon: Users
}, {
  step: 4,
  title: 'Automate & Scale',
  description: 'AI handles bookings, field ops, and business analytics 24/7 while you focus on growth.',
  icon: Zap
}];
const heroStats = [{
  value: '24',
  label: 'AI Operatives'
}, {
  value: '24/7',
  label: 'Automation'
}, {
  value: '7',
  label: 'Control Centers (Consoles)'
}, {
  value: '40%',
  label: 'Less No-Shows'
}];
const subtitles = ['Booking & Scheduling', 'Field Operations', 'Business Analytics', 'Customer Portal', 'AI-Powered Insights'];
export default function Index() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('business');
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Video */}
            <div className="animate-fade-in order-2 lg:order-1">
              <video src="/videos/aura-intercept-hero.mp4" autoPlay loop muted playsInline className="w-full h-auto rounded-2xl shadow-2xl" />
            </div>

            {/* Right Column - Content */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-wide mb-4 animate-fade-in">
                <span className="font-brand text-[#214ebb]">Aura Intercept</span>
                <span className="block text-lg sm:text-xl md:text-2xl mt-2 font-normal font-sans text-foreground">
                  The Pulse of Your Business
                </span>
              </h1>

              <div className="h-8 mb-6 animate-fade-in">
                <p className="text-xl text-primary font-medium transition-all duration-500">
                  {subtitles[currentSubtitle]}
                </p>
              </div>
              
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in">
                "Aura Intercept provides intelligent AI agents that automatically handle your customer service and scheduling, ensuring your trade business never misses a lead or a loyal client, giving you the freedom to focus on the work in the field while we master the work in the office."
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in">
                <Button size="lg" className="gradient-primary shadow-glow text-lg px-8 py-6 w-full sm:w-auto" onClick={() => navigate('/auth?mode=company')}>
                  <Building2 className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6 w-full sm:w-auto" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  Deploy Your AI Workforce
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === COMPANY/BUSINESS SECTION === */}
      

      {/* Agent Consoles Preview */}
      <section className="bg-muted/30 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">Aura Agent Consoles</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">7 Powerful Control Centers (Consoles)</h2>
            <p className="text-foreground/80 text-sm max-w-xl mx-auto">
              Purpose-built consoles give your team full control over AI operative operations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {agentConsoles.map((console, index) => (
              <div 
                key={console.name}
                className="rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                style={{ backgroundColor: '#2a3d4e' }}
              >
                <div className={`h-1 bg-gradient-to-r ${console.gradient}`} />
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-md ${console.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <console.icon className={`w-3.5 h-3.5 ${console.iconColor}`} />
                    </div>
                    <h3 className="text-xs font-semibold text-white leading-tight">{console.name.replace(' Console', '')}</h3>
                  </div>
                  <p className="text-white/60 text-[10px] mb-2 leading-snug line-clamp-2">
                    {console.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {console.features.map((feature, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section className="py-10">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-6">
            <Badge variant="secondary" className="mb-2">Aura Intelligence Network</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">24 Specialized AI Operatives</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Intercept Every Lead. Automate Every Move.
            </p>
          </div>

          <div className="space-y-4">
            {agentCategories.map(category => <div key={category.id}>
                {/* Category Subtitle */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {category.agents.map((agent, index) => (
                    <div 
                      key={agent.name}
                      className="rounded-md p-2 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                      style={{ backgroundColor: '#2a3d4e', animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <agent.icon className="w-3 h-3 text-white" />
                        </div>
                        <h4 className="font-semibold text-[10px] text-white leading-tight">{agent.name}</h4>
                      </div>
                      <p className="text-[9px] text-white/60 leading-snug line-clamp-2">{agent.description}</p>
                    </div>
                  ))}
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Communication Channels */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Multi-Channel</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Connect Everywhere Your Customers Are</h2>
            <p className="text-foreground/80 max-w-2xl mx-auto">
              Aura Intercept AI synchronizes your voice, chat, email, and SMS into a 24/7 proactive workforce that captures every lead and booking while your team is in the field.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {communicationChannels.map((channel, index) => (
              <div 
                key={channel.title}
                className="rounded-lg p-4 transition-all duration-300 hover:opacity-90 text-center"
                style={{ backgroundColor: '#2a3d4e' }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${channel.gradientClass} flex items-center justify-center mx-auto mb-3`}>
                  <channel.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-white">{channel.title}</h3>
                <p className="text-xs text-white/70 leading-relaxed">{channel.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="bg-muted/30 py-10">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-6">
            <Badge variant="secondary" className="mb-2">Platform Features</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">The All-in-One AI Center for Service Pros</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">Multi-channel AI captures every inquiry through chat and voice agents while automating smart reminders and workflows.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {platformFeatures.map((feature, index) => (
              <div 
                key={feature.title}
                className="rounded-md p-2 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                style={{ backgroundColor: '#2a3d4e', animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-[10px] text-white leading-tight">{feature.title}</h3>
                </div>
                <p className="text-[9px] text-white/60 leading-snug line-clamp-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-10">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="text-center mb-6">
            <Badge variant="secondary" className="mb-2">Industries</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">AI Automation for Field Service Industries</h2>
            <p className="text-foreground/80 text-sm max-w-xl mx-auto">White-label AI workforce that intercepts every inquiry and books directly into your calendar.</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 justify-items-center">
            {industryCategories.flatMap(cat => cat.industries).map(industry => <div key={industry.name} className="rounded-md p-2 text-center transition-all duration-300 hover:scale-[1.02] w-full" style={{
            backgroundColor: '#2a3d4e'
          }}>
                <div className="w-7 h-7 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-1">
                  <industry.icon className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <h4 className="font-medium text-[10px] text-white leading-tight">{industry.name}</h4>
                <p className="text-[8px] text-white/60 leading-tight hidden sm:block">{industry.description}</p>
              </div>)}
          </div>

          <div className="text-center mt-8">
            <Button size="lg" className="gradient-primary shadow-glow text-base px-6 py-4" onClick={() => navigate('/auth?mode=company')}>
              <Building2 className="w-4 h-4 mr-2" />
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

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
                    <div className="text-sm font-medium text-white mb-2">Step {item.step}</div>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Subscription Plans</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Choose Your Command Level</h2>
            <p className="text-foreground max-w-3xl mx-auto">
              Pick the right level of automation for your team and link your existing accounts. We've partnered with the best in the business to provide reliable voice, SMS, and payment processing directly through your personal dashboard.
            </p>
            <Link to="/audit" className="text-sm text-primary font-medium mt-3 inline-block hover:underline">
              We offer a free audit to help determine which plans best fit your business needs →
            </Link>
          </div>

          {/* Flex wrapper to enable ordering - Industry first, General second */}
          <div className="flex flex-col">
            {/* Scale Your Operations - Order 2 */}
            <div className="order-2">
              <h3 className="text-xl font-semibold text-center mt-10 mb-4 text-foreground/80">Scale Your Operations</h3>
              <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">

            {/* Aura Logistics Plan */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark-card-surface">
              <CardContent className="p-5">
                <h3 className="text-lg font-bold mb-1">Aura Logistics</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">(Field Service Teams)</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">$1,497</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$14,970/year (Save $2,994)</p>
                <p className="text-xs text-card-foreground/70 mb-4">Complete field operations with dispatch & routing.</p>
                
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">18 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">6 Control Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">Field Operations Console</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">Dispatch & Route Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">Quoting & Invoicing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">15 Employee Accounts</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/auth?mode=company')}>
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-primary/70 mt-2 text-center">Requires: Stripe + SignalWire + ElevenLabs</p>
              </CardContent>
            </Card>

            {/* Aura Performance Plan */}
            <Card className="relative overflow-hidden border-primary/50 shadow-glow dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              <CardContent className="p-5">
                <Badge className="mb-2 gradient-primary border-0 text-[10px]">Most Popular</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Performance</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">(Full Automation)</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold gradient-text">$2,497</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$24,970/year (Save $4,994)</p>
                <p className="text-xs text-card-foreground/70 mb-4">22 agents with basic business intelligence.</p>
                
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">22 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">All 7 Control Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">Analytics & Reports Console</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">Basic Analytics (Insights + Performance)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">25 Employee Accounts</span>
                  </div>
                </div>

                <Button size="sm" className="w-full gradient-primary shadow-glow" onClick={() => navigate('/auth?mode=company')}>
                  <Zap className="w-3 h-3 mr-1" />
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-primary/70 mt-2 text-center">Requires: Stripe + SignalWire + ElevenLabs + Calendar</p>
              </CardContent>
            </Card>

            {/* Aura Command Plan */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark-card-surface">
              <CardContent className="p-5">
                <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Enterprise</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Command</h3>
                <p className="text-[10px] text-amber-400/80 mb-2">Multi-Location / Enterprise</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">$3,497</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$34,970/year (Save $6,994)</p>
                <p className="text-xs text-card-foreground/70 mb-4">Full 24-agent suite with predictive analytics.</p>
                
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">All 24 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">All 7 Control Centers + AI Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-400">Advanced Analytics (Revenue + Forecast)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">White-Label Branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs">50 Employee Accounts</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full border-amber-500/50 hover:bg-amber-500/10" onClick={() => navigate('/talk-to-aura?tier=command')}>
                  Schedule Consultation
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-amber-400/70 mt-2 text-center">Requires: Stripe + SignalWire + ElevenLabs + Calendar</p>
              </CardContent>
            </Card>
          </div>
          </div>

          {/* Start Your AI Journey - Order 1 (appears first) */}
          <div className="order-1">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground/80">Start Your AI Journey</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Aura Starter */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-amber-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-amber-500 text-white border-0 text-[10px]">
                  Entry Level
                </Badge>
                <h3 className="text-lg font-bold mb-1">Aura Starter</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">
                  Restaurants • Cafes • Food Trucks • Single Location
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-amber-400">$197</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs">1 AI Agent (Triage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs">Message Aura (Text)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs">Talk to Aura (Voice)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs">Smart Link Sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs">2 Employee Accounts</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => navigate('/auth?mode=company')}
                >
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-amber-400/70 mt-2 text-center">Requires: ElevenLabs + SignalWire</p>
              </CardContent>
            </Card>

            {/* Aura Connect */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-cyan-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-cyan-500 text-white border-0 text-[10px]">
                  Booking Focus
                </Badge>
                <h3 className="text-lg font-bold mb-1">Aura Connect</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">
                  Personal Assistants • Real Estate • Consultants
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-cyan-400">$397</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">3 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">1 Control Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">Booking Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">Follow-up Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">Email + SMS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs">3 Employees</span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  onClick={() => navigate('/auth?mode=company')}
                >
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-cyan-400/70 mt-2 text-center">Requires: ElevenLabs + SignalWire + Resend</p>
              </CardContent>
            </Card>

            {/* Aura Growth */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-rose-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-rose-500 text-white border-0 text-[10px]">
                  Marketing Focus
                </Badge>
                <h3 className="text-lg font-bold mb-1">Aura Growth</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">
                  Salons • Spas • Wellness • Growing Businesses
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-rose-400">$597</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">11 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">3 Control Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">Marketing Stack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">Social Media</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">Review Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs">5 Employees</span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white"
                  onClick={() => navigate('/auth?mode=company')}
                >
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-rose-400/70 mt-2 text-center">Requires: ElevenLabs + SignalWire + Resend</p>
              </CardContent>
            </Card>

            {/* Aura Presence */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-emerald-500/30 dark-card-surface border-emerald-500/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500 text-white border-0 text-[10px]">Web Presence</Badge>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px]">No Voice</Badge>
                </div>
                <h3 className="text-lg font-bold mb-1">Aura Presence</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">(Web Presence Focus)</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-emerald-400">$797</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$7,970/year (Save $1,594)</p>
                <p className="text-xs text-card-foreground/70 mb-4">Digital presence with web & social tools.</p>
                
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">12 AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">4 Control Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">Web Presence Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">Social Media Suite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">8 Employee Accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs">Voice, SMS & Email</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full border-emerald-500/50 hover:bg-emerald-500/10" onClick={() => navigate('/auth?mode=company')}>
                  Start Free Trial
                </Button>
                <button 
                  onClick={() => setShowPlanComparison(!showPlanComparison)}
                  className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors"
                >
                  See More Details
                  {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-emerald-400/70 mt-2 text-center">Requires: Social Media Accounts</p>
              </CardContent>
            </Card>
          </div>
          </div>
          </div>

          {/* Comprehensive Comparison Chart */}
          <Collapsible open={showPlanComparison} onOpenChange={setShowPlanComparison}>
            <CollapsibleContent className="mt-8">
              <Card className="overflow-hidden border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <PricingComparisonTable />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">30-day free trial • No credit card required</p>
            <p className="text-xs text-muted-foreground/80 mb-2">All we ask is your honest feedback on features and that you report any issues you find.</p>
            <p className="text-sm text-foreground mb-2">Additional employees: <span className="font-medium">$10/employee</span></p>
            <p className="text-sm text-foreground mb-2">One-Time Implementation Fee: <span className="font-medium">starting at $499</span></p>
          </div>

          {/* 3rd Party Integrations */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2">3rd Party Integration Costs + Usage Fees</h3>
              <p className="text-sm text-muted-foreground">
                Our platform integrates with industry-leading providers. You'll need your own accounts with these services.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ordered from lowest to highest cost */}
              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-xs text-white">Google Calendar</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">Calendar Sync</p>
                <p className="text-[10px] text-white/90 font-medium">Free - Unlimited</p>
                <p className="text-[10px] text-white/60">Required for: Connect, Growth, Presence, Logistics, Performance, Command</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-3.5 h-3.5 text-channel-email" />
                  <span className="font-semibold text-xs text-white">Resend</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">Email Notifications</p>
                <p className="text-[10px] text-white/90 font-medium">Free: 3,000 emails/mo</p>
                <p className="text-[10px] text-white/70">Then $20/mo for 50k emails ($0.0004/email over)</p>
                <p className="text-[10px] text-white/60">Required for: All tiers</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold text-xs text-white">ElevenLabs</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">AI Voice Synthesis (Voice features only)</p>
                <p className="text-[10px] text-white/90 font-medium">Free: 10,000 chars/mo</p>
                <p className="text-[10px] text-white/70">$5/mo (30k) • $22/mo (100k) • $99/mo (500k)</p>
                <p className="text-[10px] text-white/60">Required for: All tiers</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold text-xs text-white">SignalWire</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">SMS & Voice Calls</p>
                <p className="text-[10px] text-white/90 font-medium">Pay-as-you-go (40% cheaper SMS)</p>
                <p className="text-[10px] text-white/70">$2/number • $0.004/SMS • $0.01/min calls</p>
                <p className="text-[10px] text-white/60">Required for: All tiers</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-xs text-white">A2P 10DLC Compliance</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">US SMS Carrier Registration (SignalWire)</p>
                <p className="text-[10px] text-white/90 font-medium">One-time: $4 Brand + $15 Campaign</p>
                <p className="text-[10px] text-white/70">Monthly: $10/campaign • Surcharge: ~$0.003/SMS</p>
                <p className="text-[10px] text-white/60">Required for: All SMS features • Prevents carrier filtering</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-xs text-white">Stripe (Your Account)</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">Invoice Payments</p>
                <p className="text-[10px] text-white/90 font-medium">Pay-as-you-go (no free tier)</p>
                <p className="text-[10px] text-white/70">2.9% + $0.30 per successful transaction</p>
                <p className="text-[10px] text-white/60">Required for: Logistics, Performance, Command (Invoicing)</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-semibold text-xs text-white">Social Media Accounts</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">Facebook, Instagram, LinkedIn, TikTok</p>
                <p className="text-[10px] text-white/90 font-medium">Free - Your Business Pages</p>
                <p className="text-[10px] text-white/70">OAuth connection to your existing accounts</p>
                <p className="text-[10px] text-white/60">Required for: Presence, Performance, Command • Optional for: Growth, Logistics</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-xs text-white">Google Gemini</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">AI Content Generation</p>
                <p className="text-[10px] text-white/90 font-medium">Free: 15 requests/min</p>
                <p className="text-[10px] text-white/70">Powers blog posts, social media, emails & marketing</p>
                <p className="text-[10px] text-white/60">Required for: All tiers (Starter, Connect, Growth, Presence, Logistics, Performance, Command)</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-semibold text-xs text-white">Tavily</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">AI Research Engine</p>
                <p className="text-[10px] text-white/90 font-medium">Free: 1,000 searches/mo</p>
                <p className="text-[10px] text-white/70">Real-time industry trends, statistics & expert insights</p>
                <p className="text-[10px] text-white/60">Optional for: All tiers • Enhances AI-generated content quality</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>;
}