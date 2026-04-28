import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroAgents from '@/assets/hero-agents.jpeg';

import { Bot, Building2, Zap, Shield, MessageSquare, Calendar, Phone, Users, TrendingUp, MapPin, FileText, DollarSign, Megaphone, Sun, BarChart3, Target, CheckCircle2, Home, Flame, Droplet, ChevronRight, ChevronDown, ChevronUp, Navigation, Truck, Search, Globe, Headphones, Bell, Mail, Smartphone, Mic, Brain, Lock, Send, Fence, Bug, TreeDeciduous, Waves, Refrigerator, Hammer, HardHat, Camera, Car, Briefcase, HeadphonesIcon, Scissors, UtensilsCrossed, Palette, Share2 } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
import { PricingComparisonTable } from '@/components/landing/PricingComparisonTable';

const agentCategories = [{
  id: 'customer',
  name: 'Customer Portal',
  icon: Users,
  color: 'from-cyan-500 to-blue-500',
  neonRgb: '0,229,255',
  agents: [{
    name: 'AI Receptionist',
    description: '24/7 first contact — classifies intent, answers FAQs, and routes to the right agent',
    icon: Target
  }, {
    name: 'Booking Agent',
    description: 'Calendar sync, availability checks, and automated appointment scheduling',
    icon: Calendar
  }, {
    name: 'Follow-Up Agent',
    description: 'SMS/email reminders, post-service check-ins, and no-show recovery',
    icon: Bell
  }, {
    name: 'Review Agent',
    description: 'Automated Google & Yelp review requests with sentiment tracking',
    icon: MessageSquare
  }]
}, {
  id: 'field',
  name: 'Field & Dispatch Ops',
  icon: MapPin,
  color: 'from-green-500 to-emerald-500',
  neonRgb: '0,230,118',
  agents: [{
    name: 'Dispatch Agent',
    description: 'Smart job assignment by skills, proximity, and workload balancing',
    icon: Users
  }, {
    name: 'Route Agent',
    description: 'Traffic-aware multi-stop route optimization for field teams',
    icon: Navigation
  }, {
    name: 'ETA Agent',
    description: 'Real-time arrival estimates and customer notification updates',
    icon: Truck
  }, {
    name: 'Check-In Agent',
    description: 'Job progress logging, time tracking, and on-site status updates',
    icon: CheckCircle2
  }]
}, {
  id: 'business',
  name: 'Business Operations',
  icon: Building2,
  color: 'from-purple-500 to-violet-500',
  neonRgb: '168,85,247',
  agents: [{
    name: 'Admin Agent',
    description: 'User management, company settings, role-based permissions, and access control',
    icon: Lock
  }, {
    name: 'Quoting Agent',
    description: 'Instant estimates, service pricing, and quote-to-job conversion',
    icon: FileText
  }, {
    name: 'Invoice Agent',
    description: 'Automated invoicing, payment tracking, and Stripe integration',
    icon: DollarSign
  }, {
    name: 'Inventory Agent',
    description: 'Stock level monitoring, reorder alerts, and parts tracking',
    icon: Briefcase
  }]
}, {
  id: 'analytics',
  name: 'Analytics & Reports',
  icon: BarChart3,
  color: 'from-cyan-500 to-indigo-500',
  neonRgb: '99,102,241',
  agents: [{
    name: 'Insights Agent',
    description: 'Natural language queries and AI-powered business intelligence',
    icon: Brain
  }, {
    name: 'Performance Agent',
    description: 'KPI dashboards, team metrics, and productivity tracking',
    icon: TrendingUp
  }, {
    name: 'Revenue Agent',
    description: 'Revenue analytics, profitability reports, and financial trends',
    icon: DollarSign
  }, {
    name: 'Forecast Agent',
    description: 'Demand prediction, seasonal trends, and capacity planning',
    icon: BarChart3
  }]
}, {
  id: 'marketing',
  name: 'Outreach & Sales Console',
  icon: Megaphone,
  color: 'from-orange-500 to-amber-500',
  neonRgb: '249,115,22',
  agents: [{
    name: 'Campaign Agent',
    description: 'Multi-channel email/SMS campaign creation and scheduling',
    icon: Send
  }, {
    name: 'Lead Agent',
    description: 'Lead scoring, pipeline management, and conversion tracking',
    icon: Target
  }, {
    name: 'Marketing Agent',
    description: 'Promo codes, referral tracking, and win-back targeting',
    icon: Megaphone
  }, {
    name: 'Outreach Agent',
    description: 'Automated outbound sequences and prospect engagement',
    icon: Mail
  }]
}, {
  id: 'social_media',
  name: 'Social Media Console',
  icon: Share2,
  color: 'from-pink-500 to-rose-500',
  neonRgb: '236,72,153',
  agents: [{
    name: 'Social Scheduler Agent',
    description: 'Cross-platform scheduling, optimal timing, and auto-publishing',
    icon: Calendar
  }, {
    name: 'Social Analytics Agent',
    description: 'Engagement metrics, audience insights, and growth tracking',
    icon: BarChart3
  }]
}, {
  id: 'smart_website',
  name: 'Smart Website',
  icon: Globe,
  color: 'from-teal-500 to-cyan-500',
  neonRgb: '20,184,166',
  agents: [{
    name: 'Creative Content Agent',
    description: 'AI-powered content generation for social media, email, SMS, blog, and website copy',
    icon: Palette
  }, {
    name: 'Web Presence Agent',
    description: 'AI website builder, blog management, SEO scans, and performance monitoring',
    icon: Globe
  }]
}];
const agentConsoles = [{
  name: 'Customer Portal Console',
  description: 'AI-powered customer interactions with booking, appointments, quotes, and 24/7 support.',
  icon: HeadphonesIcon,
  gradient: 'from-cyan-500 to-blue-500',
  iconBg: 'bg-cyan-500/10',
  iconColor: 'text-cyan-500',
  tier: 'connect',
  features: ['Online booking', 'Appointment tracking', 'Quote requests', 'AI chat & voice support']
}, {
  name: 'Field Operations Console',
  description: 'Smart dispatch, real-time technician routing, and live job tracking in the field.',
  icon: Truck,
  gradient: 'from-green-500 to-emerald-500',
  iconBg: 'bg-green-500/10',
  iconColor: 'text-green-500',
  tier: 'performance',
  features: ['Smart dispatch', 'Route optimization', 'Live ETA tracking', 'Technician check-in']
}, {
  name: 'Business Management Console',
  description: 'Unified hub for quotes, invoices, inventory, employees, and customer management.',
  icon: Briefcase,
  gradient: 'from-orange-500 to-amber-500',
  iconBg: 'bg-orange-500/10',
  iconColor: 'text-orange-500',
  tier: 'command',
  features: ['Invoice generation', 'Inventory tracking', 'Quote builder', 'Employee management']
}, {
  name: 'Outreach & Sales Ops Console',
  description: 'Lead capture, pipeline scoring, email/SMS campaigns, and customer segmentation.',
  icon: Megaphone,
  gradient: 'from-purple-500 to-pink-500',
  iconBg: 'bg-purple-500/10',
  iconColor: 'text-purple-500',
  tier: 'connect',
  features: ['Lead capture & scoring', 'Campaign automation', 'Customer segments', 'Follow-up sequences']
}, {
  name: 'Analytics & Reports Console',
  description: 'Deep KPI dashboards, revenue trends, AI-driven insights, and performance reports.',
  icon: BarChart3,
  gradient: 'from-indigo-500 to-violet-500',
  iconBg: 'bg-indigo-500/10',
  iconColor: 'text-indigo-500',
  tier: 'command',
  features: ['KPI dashboard', 'Revenue analysis', 'Trend forecasting', 'Performance reports']
}, {
  name: 'Social Media Console',
  description: 'AI-generated multi-channel content with Manual Bridge posting across 6 platforms.',
  icon: Send,
  gradient: 'from-pink-500 to-rose-500',
  iconBg: 'bg-pink-500/10',
  iconColor: 'text-pink-500',
  tier: 'connect',
  features: ['AI content generation', 'Manual Bridge posting', '6-platform support', 'Content scheduling']
}, {
  name: 'Creative & Web Presence Console',
  description: 'AI website builder, blog management, SEO optimization, and brand content creation.',
  icon: Palette,
  gradient: 'from-teal-500 to-cyan-500',
  iconBg: 'bg-teal-500/10',
  iconColor: 'text-teal-500',
  tier: 'connect',
  features: ['Website builder', 'Blog management', 'SEO optimization', 'Multi-channel content']
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
  description: 'AI generates on-brand content for 6 platforms. Copy with one click and post via the Manual Bridge. Own API auto-posting also available.'
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
  gradientClass: 'from-[hsl(var(--channel-voice))] to-[hsl(348,83%,50%)]',
  neonRgb: '236,72,153'
}, {
  icon: MessageSquare,
  title: 'SMS Reminders',
  description: 'Automated text message reminders for appointments, follow-ups, and campaigns. Requires SignalWire.',
  color: 'bg-channel-sms',
  gradientClass: 'from-[hsl(var(--channel-sms))] to-[hsl(142,71%,35%)]',
  neonRgb: '34,197,94'
}, {
  icon: Mail,
  title: 'Email Reminders',
  description: 'Automated email notifications for appointments, confirmations, and marketing campaigns.',
  color: 'bg-channel-email',
  gradientClass: 'from-[hsl(var(--channel-email))] to-[hsl(199,89%,38%)]',
  neonRgb: '14,165,233'
}, {
  icon: Headphones,
  title: 'Message Aura (Text)',
  description: 'Text-based chat where customers type questions and receive AI responses. Works on ALL tiers.',
  color: 'bg-channel-chat',
  gradientClass: 'from-[hsl(var(--channel-chat))] to-[hsl(270,67%,48%)]',
  neonRgb: '168,85,247'
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
  title: 'Activate AI Agents',
  description: 'Enable up to 24 Smart AI Agents and configure your knowledge base for your business.',
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
  label: 'Smart AI Agents'
}, {
  value: '24/7',
  label: 'Automation'
}, {
  value: '7+',
  label: 'Control Centers (Consoles)'
}];
const subtitles = ['Booking & Scheduling', 'Field Operations', 'Business Analytics', 'Customer Portal', 'AI-Powered Insights'];
export default function Index() {
  const navigate = useNavigate();
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [hoveredConsole, setHoveredConsole] = useState<number | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle(prev => (prev + 1) % subtitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const consoleNeons = [
    { color: "#00E5FF", shadow: "0 0 30px rgba(0,229,255,0.5), 0 0 60px rgba(0,229,255,0.2)", border: "rgba(0,229,255,0.55)" },
    { color: "#00E676", shadow: "0 0 30px rgba(0,230,118,0.5), 0 0 60px rgba(0,230,118,0.2)", border: "rgba(0,230,118,0.55)" },
    { color: "#FFB300", shadow: "0 0 30px rgba(255,179,0,0.5), 0 0 60px rgba(255,179,0,0.2)", border: "rgba(255,179,0,0.55)" },
    { color: "#B388FF", shadow: "0 0 30px rgba(179,136,255,0.5), 0 0 60px rgba(179,136,255,0.2)", border: "rgba(179,136,255,0.55)" },
    { color: "#536DFE", shadow: "0 0 30px rgba(83,109,254,0.5), 0 0 60px rgba(83,109,254,0.2)", border: "rgba(83,109,254,0.55)" },
    { color: "#FF4081", shadow: "0 0 30px rgba(255,64,129,0.5), 0 0 60px rgba(255,64,129,0.2)", border: "rgba(255,64,129,0.55)" },
    { color: "#1DE9B6", shadow: "0 0 30px rgba(29,233,182,0.5), 0 0 60px rgba(29,233,182,0.2)", border: "rgba(29,233,182,0.55)" },
  ];

  return (
    <div style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(200,60%,6%) 0%, hsl(210,40%,4%) 50%, hsl(220,30%,3%) 100%)", minHeight: "100vh", color: "white" }}>
      <style>{`
        @keyframes border-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes subtitle-fade {
          0%, 100% { opacity: 1; }
          45%, 55% { opacity: 0; }
        }
      `}</style>
      <PublicHeader showHomeLink={false} />

      {/* ── CINEMATIC HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroAgents})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(1.0) saturate(1.2)" }} />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,10,20,0.55) 0%, rgba(4,10,20,0.05) 35%, rgba(4,10,20,0.05) 65%, rgba(4,10,20,0.75) 100%)" }} />
        {/* Scan lines */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.01) 3px, rgba(0,229,255,0.01) 4px)", pointerEvents: "none" }} />

        {/* TOP — Title + Tagline above the hero logo */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900, margin: "0 auto", padding: "52px 24px 0", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(38px, 7vw, 78px)", fontWeight: 900, letterSpacing: 2, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF 0%, #FFFFFF 30%, #00E5FF 60%, #214ebb 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 40px rgba(0,229,255,0.4))" }}>
            AURA INTERCEPT
          </h1>
          <p style={{ fontSize: 16, color: "rgba(200,230,255,0.85)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6, textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
            The AI command center that runs your entire business — from first contact to final invoice.
          </p>
        </div>

        {/* SPACER — transparent gap so the hero image logo shows through */}
        <div style={{ flex: 1, minHeight: 420 }} />

        {/* BOTTOM — Button, Stats, Rotating text below the hero logo */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 24px 56px", textAlign: "center" }}>
          <div style={{ marginBottom: 28 }}>
            <button
              onClick={() => navigate('/auth?mode=company')}
              style={{ padding: "16px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #00E5FF, #214ebb, #00B8D4, #00E5FF)", backgroundSize: "300% 300%", color: "white", animation: "border-shine 4s ease infinite", boxShadow: "0 0 30px rgba(0,229,255,0.4), 0 4px 20px rgba(0,0,0,0.4)", letterSpacing: 1 }}
            >
              Deploy Your AI Workforce
            </button>
          </div>

          {/* Stats trust bar */}
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" as const, marginBottom: 20 }}>
            {heroStats.map(s => (
              <div key={s.label} style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg, #00E5FF, rgba(255,255,255,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "rgba(0,229,255,0.45)", letterSpacing: 2, textTransform: "uppercase" as const, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Animated rotating subtitle */}
          <div style={{ height: 32, overflow: "hidden" }}>
            <p style={{ fontSize: 18, color: "#00E5FF", fontWeight: 600, letterSpacing: 1, transition: "all 0.5s ease" }}>
              {subtitles[currentSubtitle]}
            </p>
          </div>
        </div>
      </section>

      {/* Agent Consoles Preview */}
      <section style={{ padding: "64px 0", background: "rgba(0,229,255,0.02)" }}>
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 16 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Aura Agent Consoles</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              7 Powerful Control Centers (Consoles)
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
              Purpose-built consoles give your team full control over AI operative operations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {agentConsoles.map((c, i) => {
              const neon = consoleNeons[i] || consoleNeons[0];
              const isHov = hoveredConsole === i;
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  onMouseEnter={() => setHoveredConsole(i)}
                  onMouseLeave={() => setHoveredConsole(null)}
                  style={{
                    borderRadius: 14, padding: "20px", cursor: "pointer",
                    transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                    background: isHov ? `rgba(${neon.color.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',')},0.05)` : "rgba(255,255,255,0.02)",
                    backdropFilter: "blur(24px)",
                    border: isHov ? `1px solid ${neon.border}` : `1px solid ${neon.color}44`,
                    boxShadow: isHov ? neon.shadow : `0 0 0 1px ${neon.color}22, 0 0 12px ${neon.color}11`,
                    transform: isHov ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
                  }}
                >
                  <div style={{ position: "relative", width: 40, height: 40, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${neon.color}18`, border: `1px solid ${neon.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} style={{ color: neon.color, position: "relative", zIndex: 1 }} />
                    </div>
                    <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: 10, background: `${neon.color}44`, opacity: 0.3 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>{c.name.replace(' Console', '')}</div>
                  <div style={{ fontSize: 11, color: "rgba(200,220,240,0.5)", lineHeight: 1.5, marginBottom: 10 }}>{c.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                    {c.features.map((f) => (
                      <span key={f} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>{f}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OUTCOMES — what Aura does for your business */}
      <section style={{ padding: "72px 0 32px" }}>
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>What Aura Does For You</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Three Promises. Zero Headaches.
            </h2>
            <p style={{ color: "rgba(200,220,240,0.55)", fontSize: 15, maxWidth: 620, margin: "0 auto" }}>
              Skip the tech jargon. Here's what Aura actually delivers for your business — every day, on autopilot.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: 'Never Miss a Call',
                desc: 'Aura answers every call, text, and chat 24/7 — even at 2 AM on a Sunday. Customers get instant help, you get every lead.',
                icon: Phone,
                neon: '0,229,255',
                color: '#00E5FF',
                proof: 'Front Desk · SMS · Email · Voice',
              },
              {
                title: 'Fill Your Calendar',
                desc: 'Aura books appointments, sends reminders, and dispatches your crew with smart routing. Less downtime, more jobs done.',
                icon: Calendar,
                neon: '0,230,118',
                color: '#00E676',
                proof: 'Booking · Reminders · Routing · ETA',
              },
              {
                title: 'Get Paid Faster',
                desc: 'Aura sends quotes, generates invoices, follows up on payments, and asks for reviews — automatically.',
                icon: DollarSign,
                neon: '255,179,0',
                color: '#FFB300',
                proof: 'Quotes · Invoices · Reviews · Follow-ups',
              },
            ].map((o) => {
              const Icon = o.icon;
              return (
                <div
                  key={o.title}
                  style={{
                    borderRadius: 16,
                    padding: "28px 24px",
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid rgba(${o.neon},0.32)`,
                    boxShadow: `0 0 0 1px rgba(${o.neon},0.18), 0 0 24px rgba(${o.neon},0.1)`,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 36px rgba(${o.neon},0.3), 0 0 0 1px rgba(${o.neon},0.5)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(${o.neon},0.18), 0 0 24px rgba(${o.neon},0.1)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ position: "relative", width: 52, height: 52, marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: `${o.color}1A`, border: `1px solid ${o.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={24} style={{ color: o.color, position: "relative", zIndex: 1 }} />
                    </div>
                    <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: 12, background: `${o.color}33`, opacity: 0.35 }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.95)", marginBottom: 10, letterSpacing: -0.3 }}>{o.title}</div>
                  <p style={{ fontSize: 13, color: "rgba(210,225,240,0.65)", lineHeight: 1.65, marginBottom: 16 }}>{o.desc}</p>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" as const, color: `rgb(${o.neon})`, fontWeight: 700, opacity: 0.8 }}>
                    Powered by: {o.proof}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => {
                const el = document.getElementById('agent-network-detail');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,229,255,0.25)",
                color: "rgba(200,220,240,0.75)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#00E5FF"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,220,240,0.75)"; }}
            >
              See the 24 agents that power this
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* AI Agents Showcase — detailed agent network (for curious visitors) */}
      <section id="agent-network-detail" style={{ padding: "32px 0 56px" }}>
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Under The Hood</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              24 Smart AI Agents
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", fontSize: 14 }}>The agent network that powers every promise above.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {agentCategories.map(category => (
              <div key={category.id} style={{ borderRadius: 14, padding: "18px", background: "rgba(255,255,255,0.015)", border: `1px solid rgba(${category.neonRgb},0.18)`, boxShadow: `0 0 20px rgba(${category.neonRgb},0.05)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div className={`relative w-7 h-7 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="absolute inset-0 rounded-md animate-ping opacity-40" style={{ background: `rgba(${category.neonRgb},0.5)` }} />
                    <category.icon className="w-3.5 h-3.5 text-white relative z-10" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{category.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: `rgba(${category.neonRgb},0.15)`, color: `rgb(${category.neonRgb})`, border: `1px solid rgba(${category.neonRgb},0.3)`, letterSpacing: 0.5 }}>{category.agents.length} Agents</span>
                  <div style={{ flex: 1, height: 1, background: `rgba(${category.neonRgb},0.15)` }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.agents.map((agent) => (
                    <div key={agent.name} style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(255,255,255,0.025)", border: `1px solid rgba(${category.neonRgb},0.2)`, boxShadow: `0 0 0 1px rgba(${category.neonRgb},0.1), 0 0 12px rgba(${category.neonRgb},0.05)`, transition: "all 0.3s ease" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px rgba(${category.neonRgb},0.22), 0 0 0 1px rgba(${category.neonRgb},0.35)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(${category.neonRgb},0.1), 0 0 12px rgba(${category.neonRgb},0.05)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                        <div className={`relative w-6 h-6 rounded bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="absolute inset-0 rounded animate-ping opacity-30" style={{ background: `rgba(${category.neonRgb},0.6)` }} />
                          <agent.icon className="w-3 h-3 text-white relative z-10" />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{agent.name}</span>
                      </div>
                      <p style={{ fontSize: 10, color: "rgba(200,220,240,0.5)", lineHeight: 1.5 }}>{agent.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Communication Channels */}
      <section style={{ padding: "64px 0", background: "rgba(0,229,255,0.02)" }}>
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Multi-Channel</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, margin: "0 0 12px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Connect Everywhere Your Customers Are
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontSize: 15 }}>
              Aura Intercept AI synchronizes your voice, chat, email, and SMS into a 24/7 proactive workforce that captures every lead and booking while your team is in the field.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {communicationChannels.map((channel) => (
              <div key={channel.title} style={{ borderRadius: 14, padding: "24px", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(24px)", border: `1px solid rgba(${channel.neonRgb},0.25)`, boxShadow: `0 0 0 1px rgba(${channel.neonRgb},0.18), 0 0 18px rgba(${channel.neonRgb},0.08)`, textAlign: "center", transition: "all 0.3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px rgba(${channel.neonRgb},0.25), 0 0 0 1px rgba(${channel.neonRgb},0.4)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(${channel.neonRgb},0.18), 0 0 18px rgba(${channel.neonRgb},0.08)`; (e.currentTarget as HTMLDivElement).style.border = `1px solid rgba(${channel.neonRgb},0.25)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div className="relative w-10 h-10 mx-auto mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${channel.gradientClass} flex items-center justify-center`}>
                    <channel.icon className="w-5 h-5 text-white relative z-10" />
                  </div>
                  <span className="absolute inset-0 rounded-lg animate-ping opacity-30" style={{ background: `rgba(${channel.neonRgb},0.6)` }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>{channel.title}</div>
                <p style={{ fontSize: 12, color: "rgba(200,220,240,0.5)", lineHeight: 1.6 }}>{channel.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section style={{ padding: "56px 0" }}>
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Platform Features</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              The All-in-One AI Center for Service Pros
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>Multi-channel AI captures every inquiry through chat and voice agents while automating smart reminders and workflows.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {platformFeatures.map((feature) => (
              <div key={feature.title} style={{ borderRadius: 12, padding: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)", transition: "all 0.3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(0,229,255,0.3), 0 0 0 1px rgba(0,229,255,0.4)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)"; (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(0,229,255,0.2)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <feature.icon size={12} style={{ color: "#00E5FF", position: "relative", zIndex: 1 }} />
                    </div>
                    <span className="absolute inset-0 rounded-md animate-ping opacity-25" style={{ background: "rgba(0,229,255,0.5)" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{feature.title}</span>
                </div>
                <p style={{ fontSize: 9, color: "rgba(200,220,240,0.5)", lineHeight: 1.5 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section style={{ padding: "56px 0", background: "rgba(0,229,255,0.02)" }}>
        <div className="container max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Industries</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              AI Automation for Field Service Industries
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>White-label AI workforce that intercepts every inquiry and books directly into your calendar.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {industryCategories.flatMap(cat => cat.industries).map(industry => (
              <div key={industry.name} style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 0 1px rgba(0,229,255,0.12), 0 0 12px rgba(0,229,255,0.05)", transition: "all 0.3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 18px rgba(0,229,255,0.2), 0 0 0 1px rgba(0,229,255,0.3)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(0,229,255,0.12), 0 0 12px rgba(0,229,255,0.05)"; (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(0,229,255,0.2)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ position: "relative", width: 28, height: 28, margin: "0 auto 6px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <industry.icon size={13} style={{ color: "#00E5FF", position: "relative", zIndex: 1 }} />
                  </div>
                  <span className="absolute inset-0 rounded-lg animate-ping opacity-25" style={{ background: "rgba(0,229,255,0.5)" }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{industry.name}</div>
                <p style={{ fontSize: 8, color: "rgba(200,220,240,0.4)", lineHeight: 1.3 }} className="hidden sm:block">{industry.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/auth?mode=company')} style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #00E5FF, #214ebb, #00B8D4, #00E5FF)", backgroundSize: "300% 300%", color: "white", animation: "border-shine 4s ease infinite", boxShadow: "0 0 30px rgba(0,229,255,0.4)", letterSpacing: 1 }}>
              <Building2 className="inline w-4 h-4 mr-2" />START YOUR FREE TRIAL →
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "64px 0" }}>
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>For Service Businesses</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, margin: "0 0 12px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Get Started in 4 Simple Steps
            </h2>
            <p style={{ color: "rgba(200,220,240,0.5)", maxWidth: 480, margin: "0 auto" }}>From signup to full automation in minutes, not months.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                <div style={{ borderRadius: 16, padding: "28px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)", transition: "all 0.3s ease", height: "100%" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(0,229,255,0.2), 0 0 0 1px rgba(0,229,255,0.35)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(0,229,255,0.15), 0 0 18px rgba(0,229,255,0.06)"; (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(0,229,255,0.2)"; }}
                >
                  <div style={{ position: "relative", width: 52, height: 52, margin: "0 auto 16px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #00E5FF, #214ebb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,229,255,0.4)" }}>
                      <item.icon size={24} style={{ color: "white", position: "relative", zIndex: 1 }} />
                    </div>
                    <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(0,229,255,0.4)", opacity: 0.25 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#00E5FF", letterSpacing: 2, marginBottom: 6, fontWeight: 600 }}>STEP {item.step}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>{item.title}</div>
                  <p style={{ fontSize: 13, color: "rgba(200,220,240,0.5)", lineHeight: 1.6 }}>{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight size={20} style={{ color: "rgba(0,229,255,0.3)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: "64px 0", background: "rgba(0,229,255,0.02)" }}>
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#00E5FF", fontWeight: 600 }}>Subscription Plans</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, margin: "0 0 12px", background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Choose Your Command Level
            </h2>
            <p style={{ color: "rgba(200,220,240,0.6)", maxWidth: 700, margin: "0 auto 12px", lineHeight: 1.7, fontSize: 15 }}>
              Pick the right level of automation for your team and link your existing accounts. We've partnered with the best in the business to provide reliable voice, SMS, and payment processing directly through your personal dashboard.
            </p>
            <Link to="/audit" style={{ fontSize: 13, color: "#00E5FF", fontWeight: 600 }} className="hover:underline">
              We offer a free audit to help determine which plans best fit your business needs →
            </Link>
          </div>

          {/* 4-Tier Pricing Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">

            {/* Aura Core */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-teal-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-teal-500/20 text-teal-400 border-teal-500/30 text-[10px]">Entry Level</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Core</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">Core booking & web presence</p>
                <p className="text-[10px] text-card-foreground/50 italic mb-2">Best for solo operators, restaurants, single-location service businesses.</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-teal-400">$197</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$1,970/year (Save ~20%)</p>
                <p className="text-xs text-card-foreground/70 mb-4">8 Smart AI Agents handling booking, follow-up, creative content & web presence.</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs">8 Smart AI Agents</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs">3 Control Centers</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs">Triage + Booking + Follow-Up + Review</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs">Creative Content + Web Presence</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs">10 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white" onClick={() => navigate('/auth?mode=company')}>
                  Start Free Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-teal-400/70 mt-2 text-center">Requires: Resend + ElevenLabs (limited) + SignalWire (limited)</p>
              </CardContent>
            </Card>

            {/* Aura Boost */}
            <Card className="relative overflow-hidden border-sky-400/50 shadow-glow dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px]">Most Popular</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Boost</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">Field service automation</p>
                <p className="text-[10px] text-card-foreground/50 italic mb-2">Best for small service teams — HVAC, plumbing, electrical, field service.</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-sky-400">$497</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$4,970/year (Save ~20%)</p>
                <p className="text-xs text-card-foreground/70 mb-4">12 Smart AI Agents with dispatch, routing & field operations.</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /><span className="text-xs">12 Smart AI Agents</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /><span className="text-xs">5 Control Centers</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /><span className="text-xs">Dispatch + Route + ETA + Check-In</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /><span className="text-xs">Field Operations + Social Media Console</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /><span className="text-xs">25 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white" onClick={() => navigate('/auth?mode=company')}>
                  <Zap className="w-3 h-3 mr-1" />Start Free Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-sky-400/70 mt-2 text-center">Requires: Stripe + SignalWire + ElevenLabs + Calendar</p>
              </CardContent>
            </Card>

            {/* Aura Pro */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-purple-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">Growth</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Pro</h3>
                <p className="text-[10px] text-card-foreground/60 mb-1">Full business management</p>
                <p className="text-[10px] text-card-foreground/50 italic mb-2">Best for growing companies with field teams and multiple technicians.</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-purple-400">$997</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$9,970/year (Save ~20%)</p>
                <p className="text-xs text-card-foreground/70 mb-4">16 Smart AI Agents with social media, campaigns & white-label.</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs">16 Smart AI Agents</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs">5 Control Centers</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs">Campaign + Outreach + Social</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-purple-400">White-Label Branding</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs">50 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white" onClick={() => navigate('/auth?mode=company')}>
                  Start Free Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-purple-400/70 mt-2 text-center">All integrations required</p>
              </CardContent>
            </Card>

            {/* Aura Elite */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-amber-500/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Enterprise</Badge>
                <h3 className="text-lg font-bold mb-1">Aura Elite</h3>
                <p className="text-[10px] text-amber-400/80 mb-1">Full Suite / Enterprise</p>
                <p className="text-[10px] text-card-foreground/50 italic mb-2">Best for large service teams, property management firms, and enterprise operations.</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-amber-400">$1,997</span>
                  <span className="text-card-foreground/60 text-sm">/month</span>
                </div>
                <p className="text-xs text-secondary mb-3">$19,970/year (Save ~20%)</p>
                <p className="text-xs text-card-foreground/70 mb-4">All 24 Smart AI Agents with full-suite automation.</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs">24 Smart AI Agents (Full Suite)</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs">7 Control Centers + AI Hub</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs">White-Label Branding</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs">Unlimited Employees</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-amber-500/50 hover:bg-amber-500/10" onClick={() => navigate('/auth?mode=company')}>
                  Start Free Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <p className="text-[9px] text-amber-400/70 mt-2 text-center">All integrations + advanced compliance</p>
              </CardContent>
            </Card>
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
            <p className="text-sm mb-2" style={{ color: "rgba(200,220,240,0.6)" }}>90-day free trial • No credit card required</p>
            <p className="text-xs mb-2" style={{ color: "rgba(200,220,240,0.5)" }}>All we ask is your honest feedback on features and that you report any issues you find.</p>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>Additional employees: <span className="font-medium">$25 per 10 employees</span></p>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>One-Time Implementation Fee: <span className="font-medium">$0 Core • $299 Boost • $599 Pro • $999 Elite</span></p>
          </div>

          {/* Beta Testing Announcement */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Beta
                  </span>
                  <h3 className="text-lg font-bold text-foreground">We're in Beta!</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We are currently in <span className="font-semibold text-foreground">Beta</span>. All users who join during the beta period receive{' '}
                  <span className="font-semibold text-primary">90 days of free access</span> for testing. All we ask is your honest feedback to help us improve the platform.
                </p>

                {/* FCC 10DLC Notice */}
                <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-warning">SMS System — FCC 10DLC Compliance</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our SMS system is currently undergoing FCC approval. <span className="font-medium text-foreground">10DLC (10-Digit Long Code)</span> is the US carrier registration standard for business SMS. Without 10DLC registration, messages sent over standard long-code numbers are likely to be filtered or blocked by carriers. SMS features will be fully activated once our registration is approved (typically 2-4 weeks). <span className="font-medium text-foreground">Company Requirement:</span> Each company must provide their EIN, DBA, and LLC or Inc documentation so we can register your business for FCC 10DLC approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3rd Party Integrations */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-2">3rd Party Integration Costs + Usage Fees</h3>
              <p className="text-sm text-muted-foreground">
                Our platform integrates with industry-leading providers. You'll need your own accounts with these services.
              </p>
              <p className="text-xs text-muted-foreground/70 italic mt-1">
                All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of those services for your company.
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
                <p className="text-[10px] text-white/60">Required for: All tiers</p>
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
                <p className="text-[10px] text-white/60">Limited for: Core • Required for: Boost, Pro, Elite</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold text-xs text-white">SignalWire</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">SMS & Voice Calls</p>
                <p className="text-[10px] text-white/90 font-medium">Pay-as-you-go (40% cheaper SMS)</p>
                <p className="text-[10px] text-white/70">$2/number • $0.004/SMS • $0.01/min calls</p>
                <p className="text-[10px] text-white/60">Limited for: Core • Required for: Boost, Pro, Elite</p>
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
                <p className="text-[10px] text-white/60">Required for: Elite (Invoicing)</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-semibold text-xs text-white">Social Media Accounts</span>
                </div>
                <p className="text-[10px] text-white/70 mb-1">Facebook, Instagram, LinkedIn, TikTok</p>
                <p className="text-[10px] text-white/90 font-medium">Free - Your Business Pages</p>
                <p className="text-[10px] text-white/70">OAuth connection to your existing accounts</p>
                <p className="text-[10px] text-white/60">Required for: Pro, Elite • Optional for: Boost</p>
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

            <p className="text-[10px] text-white/50 italic text-center mt-4">
              All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of those services for your company.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}