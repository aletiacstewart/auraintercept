import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroAgents from '@/assets/hero-agents.jpeg';

import { Bot, Building2, Zap, Shield, MessageSquare, Calendar, Phone, Users, TrendingUp, MapPin, FileText, DollarSign, Megaphone, Sun, BarChart3, Target, CheckCircle2, Home, Flame, Droplet, ChevronRight, ChevronDown, ChevronUp, Navigation, Truck, Search, Globe, Headphones, Bell, Mail, Smartphone, Mic, Brain, Lock, Send, Fence, Bug, TreeDeciduous, Waves, Refrigerator, Hammer, HardHat, Camera, Car, Briefcase, HeadphonesIcon, Scissors, UtensilsCrossed, Palette, Share2, Stethoscope, HeartHandshake, HeartPulse, PawPrint, Sparkles, Play, Plug, BookOpen, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
import { PricingComparisonTable } from '@/components/landing/PricingComparisonTable';
import { DiyCostBreakdown } from '@/components/landing/DiyCostBreakdown';
import { SEO } from '@/components/seo/SEO';
/**
 * Marketing Platform Guide industry taxonomy — 22 category groups covering
 * 185 business types. Source of truth: AuraIntercept_MarketingPlatformGuide.xlsx.
 * Keep counts and labels in sync with that workbook.
 */
const MARKETING_INDUSTRY_CATEGORIES: { name: string; icon: LucideIcon; count: number; description: string; demoPack: string }[] = [
  { name: 'HVAC & Mechanical',         icon: Flame,         count: 6,  description: 'AC, heating, ducts, mechanical',         demoPack: 'hvac' },
  { name: 'Plumbing',                  icon: Droplet,       count: 7,  description: 'Plumbers, septic, well, drain',          demoPack: 'plumbing' },
  { name: 'Electrical',                icon: Zap,           count: 8,  description: 'Electricians, solar, EV, smart home',    demoPack: 'electrical' },
  { name: 'Roofing & Exterior',        icon: Home,          count: 12, description: 'Roof, siding, gutters, paint',           demoPack: 'roofing' },
  { name: 'Landscaping & Outdoor',     icon: TreeDeciduous, count: 13, description: 'Lawn, trees, pool, pest, snow',          demoPack: 'landscape' },
  { name: 'Cleaning & Restoration',    icon: Sparkles,      count: 13, description: 'House, carpet, water/fire damage',       demoPack: 'handyman' },
  { name: 'Construction & Remodeling', icon: HardHat,       count: 22, description: 'GC, kitchens, baths, flooring',          demoPack: 'construction' },
  { name: 'Home Inspection & Safety',  icon: Shield,        count: 11, description: 'Inspectors, chimney, locksmith, alarms', demoPack: 'security_systems' },
  { name: 'Appliance & Tech Services', icon: Refrigerator,  count: 8,  description: 'Appliance, computer, TV, WiFi',          demoPack: 'appliance_repair' },
  { name: 'Moving & Junk Removal',     icon: Truck,         count: 9,  description: 'Movers, junk, towing, waste',            demoPack: 'handyman' },
  { name: 'Auto Services (Mobile)',    icon: Car,           count: 9,  description: 'Detail, glass, oil, mobile mechanic',    demoPack: 'auto_care' },
  { name: 'Pet & Animal Services',     icon: PawPrint,      count: 8,  description: 'Groomers, trainers, vets, sitters',      demoPack: 'veterinary' },
  { name: 'Health & Wellness',         icon: HeartPulse,    count: 1,  description: 'In-home massage & therapists',           demoPack: 'beauty_wellness' },
  { name: 'Specialty Trades',          icon: Hammer,        count: 13, description: 'Handyman, carpenter, pool, masonry',     demoPack: 'handyman' },
  { name: 'Utility & Infrastructure',  icon: Building2,     count: 5,  description: 'Propane, water, utility contractors',    demoPack: 'plumbing' },
  { name: 'Real Estate & Property',    icon: MapPin,        count: 11, description: 'Agents, mortgage, title, mgmt',          demoPack: 'real_estate' },
  { name: 'In-Home Personal Services', icon: Users,         count: 9,  description: 'Trainer, tutor, nanny, chef',            demoPack: 'personal_assistant' },
  { name: 'Delivery & On-Site Logistics', icon: Send,       count: 4,  description: 'Furniture, fuel, water delivery',        demoPack: 'handyman' },
  { name: 'Insurance & Assessment',    icon: FileText,      count: 4,  description: 'Home/auto, adjusters, appraisers',       demoPack: 'real_estate' },
  { name: 'Senior & Lifestyle',        icon: HeartHandshake,count: 5,  description: 'Senior move, organize, energy audit',    demoPack: 'home_health' },
  { name: 'Event & Temporary',         icon: Megaphone,     count: 6,  description: 'Tents, party, DJ, catering, photo',      demoPack: 'beauty_wellness' },
  { name: 'Beauty & Salons',              icon: Scissors,       count: 2, description: 'Salons, barbers, spa & nail studios',     demoPack: 'beauty_wellness' },
  { name: 'Restaurants & Food Delivery',  icon: UtensilsCrossed,count: 2, description: 'Restaurants, cafes, food delivery',       demoPack: 'restaurants' },
  { name: 'Personal Assistants',          icon: HeartHandshake, count: 1, description: 'Personal & executive assistants',         demoPack: 'personal_assistant' },
  { name: 'B2B Pro Services',             icon: Briefcase,      count: 1, description: 'Consultants & professional services',     demoPack: 'real_estate' },
];

const agentCategories = [{
  id: 'customer',
  name: 'Customer Portal',
  icon: Users,
  color: 'from-cyan-500 to-cyan-500',
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
  name: 'Service Management',
  icon: MapPin,
  color: 'from-green-500 to-emerald-500',
  neonRgb: '0,230,118',
  agents: [{
    name: 'Assignment Agent',
    description: 'Smart job, visit, or appointment assignment by skills, availability, and workload',
    icon: Users
  }, {
    name: 'Routing Agent',
    description: 'Traffic-aware multi-stop routing for technicians, providers, and field teams',
    icon: Navigation
  }, {
    name: 'ETA Agent',
    description: 'Real-time arrival estimates and customer notification updates',
    icon: Truck
  }, {
    name: 'Check-In Agent',
    description: 'Staff check-in, progress logging, and on-site or on-visit status updates',
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
  color: 'from-cyan-500 to-cyan-500',
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
  gradient: 'from-cyan-500 to-cyan-500',
  iconBg: 'bg-cyan-500/10',
  iconColor: 'text-cyan-500',
  tier: 'connect',
  features: ['Online booking', 'Appointment tracking', 'Quote requests', 'AI chat & voice support']
}, {
  name: 'Service Management Console',
  description: 'Schedule, assign, and track every job, visit, or appointment in real time — across technicians, providers, stylists, and agents.',
  icon: Truck,
  gradient: 'from-green-500 to-emerald-500',
  iconBg: 'bg-green-500/10',
  iconColor: 'text-green-500',
  tier: 'performance',
  features: ['Smart scheduling & assignment', 'Route & visit optimization', 'Live status & ETA tracking', 'Staff check-in & updates']
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
  gradient: 'from-cyan-500 to-violet-500',
  iconBg: 'bg-cyan-500/10',
  iconColor: 'text-cyan-400',
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
const howItWorks = [{
  step: 1,
  title: 'Live Demo',
  description: 'Experience a live walkthrough of Aura Intercept tailored to your business.',
  icon: Play
}, {
  step: 2,
  title: 'Choose Plan',
  description: 'Select the tier that matches your team size and automation goals.',
  icon: CheckCircle2
}, {
  step: 3,
  title: 'On Boarding',
  description: 'Get your company profile, branding, and services configured by our team.',
  icon: Users
}, {
  step: 4,
  title: 'Setup Dashboards',
  description: 'Personalize your command center with the consoles and metrics that matter.',
  icon: BarChart3
}, {
  step: 5,
  title: '3rd Party Integrations',
  description: 'Connect your existing voice, SMS, email, and payment providers.',
  icon: Plug
}, {
  step: 6,
  title: 'Knowledge Base',
  description: 'Train your AI Operatives with your business rules, FAQs, and workflows.',
  icon: BookOpen
}, {
  step: 7,
  title: 'Connect Customers',
  description: 'Launch your customer portal and embed Message Aura on your website.',
  icon: MessageSquare
}, {
  step: 8,
  title: 'Automate',
  description: 'Let AI handle bookings, dispatch, follow-ups, and analytics around the clock.',
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
const subtitles = ['Booking & Scheduling', 'Service Management', 'Business Analytics', 'Customer Portal', 'AI-Powered Insights'];
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

      <SEO
        title="Aura Intercept | AI Operatives for Service Businesses"
        description="24 AI Operatives across 7 consoles automate calls, scheduling, field ops, billing, marketing, and analytics."
        path="/"
      />

      <main>
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
          <h1 style={{ fontSize: "clamp(38px, 7vw, 78px)", fontWeight: 900, letterSpacing: 2, margin: "0 0 10px", background: "linear-gradient(135deg, #00F2FF 0%, #FFFFFF 30%, #00E5FF 60%, #00E5FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 40px rgba(0,229,255,0.4))" }}>
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
              style={{ padding: "16px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #00E5FF, #00E5FF, #00B8D4, #00E5FF)", backgroundSize: "300% 300%", color: "white", animation: "border-shine 4s ease infinite", boxShadow: "0 0 30px rgba(0,229,255,0.4), 0 4px 20px rgba(0,0,0,0.4)", letterSpacing: 1 }}
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
            <p style={{ color: "#FFFFFF", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: neon.color, marginBottom: 6 }}>{c.name.replace(' Console', '')}</div>
                   <div style={{ fontSize: 11, color: "#FFFFFF", lineHeight: 1.5, marginBottom: 10 }}>{c.description}</div>
                   <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                     {c.features.map((f) => (
                       <span key={f} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#FFFFFF" }}>{f}</span>
                     ))}
                   </div>
                </div>
              );
            })}
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
              24 AI Operatives
            </h2>
            <p style={{ color: "#FFFFFF", fontSize: 14 }}>The operative network that powers every promise above.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {agentCategories.map(category => (
              <div key={category.id} style={{ borderRadius: 14, padding: "18px", background: "rgba(255,255,255,0.015)", border: `1px solid rgba(${category.neonRgb},0.18)`, boxShadow: `0 0 20px rgba(${category.neonRgb},0.05)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div className={`relative w-7 h-7 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="absolute inset-0 rounded-md animate-ping opacity-40" style={{ background: `rgba(${category.neonRgb},0.5)` }} />
                    <category.icon className="w-3.5 h-3.5 text-white relative z-10" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: `rgb(${category.neonRgb})` }}>{category.name}</span>
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
                        <span style={{ fontSize: 11, fontWeight: 700, color: `rgb(${category.neonRgb})` }}>{agent.name}</span>
                      </div>
                      <p style={{ fontSize: 10, color: "#FFFFFF", lineHeight: 1.5 }}>{agent.description}</p>
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
            <p style={{ color: "#FFFFFF", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontSize: 15 }}>
              Voice, chat, email, SMS — one 24/7 workforce capturing every lead while your team is in the field.
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
                <div style={{ fontSize: 14, fontWeight: 700, color: `rgb(${channel.neonRgb})`, marginBottom: 6 }}>{channel.title}</div>
                <p style={{ fontSize: 12, color: "#FFFFFF", lineHeight: 1.6 }}>{channel.description}</p>
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
            <p style={{ color: "#FFFFFF", fontSize: 14, maxWidth: 560, margin: "0 auto" }}>
              22 industry categories. 185+ business types. White-label AI that intercepts every inquiry and books directly to your calendar.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {MARKETING_INDUSTRY_CATEGORIES.map(cat => (
              <button key={cat.name} type="button" onClick={() => navigate(`/for-business?industry=${cat.demoPack}`)} aria-label={`See live demo for ${cat.name}`} style={{ cursor: "pointer", borderRadius: 10, padding: "12px 8px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 0 1px rgba(0,229,255,0.12), 0 0 12px rgba(0,229,255,0.05)", transition: "all 0.3s ease" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 18px rgba(0,229,255,0.2), 0 0 0 1px rgba(0,229,255,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,229,255,0.12), 0 0 12px rgba(0,229,255,0.05)"; e.currentTarget.style.border = "1px solid rgba(0,229,255,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ position: "relative", width: 32, height: 32, margin: "0 auto 6px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <cat.icon size={15} style={{ color: "#00E5FF", position: "relative", zIndex: 1 }} />
                  </div>
                  <span className="absolute inset-0 rounded-lg animate-ping opacity-25" style={{ background: "rgba(0,229,255,0.5)" }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#00E5FF", lineHeight: 1.2 }}>{cat.name}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#00E5FF", opacity: 0.7, marginTop: 2 }}>{cat.count} business types</div>
                <p style={{ fontSize: 9, color: "#FFFFFF", lineHeight: 1.3, marginTop: 4 }} className="hidden sm:block">{cat.description}</p>
              </button>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/auth?mode=company')} style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #00E5FF, #00E5FF, #00B8D4, #00E5FF)", backgroundSize: "300% 300%", color: "white", animation: "border-shine 4s ease infinite", boxShadow: "0 0 30px rgba(0,229,255,0.4)", letterSpacing: 1 }}>
              <Building2 className="inline w-4 h-4 mr-2" />START YOUR 60-DAY LIVE TRIAL →
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      {/* How It Works — removed per request */}

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
            <p style={{ color: "#FFFFFF", maxWidth: 700, margin: "0 auto 12px", lineHeight: 1.7, fontSize: 15 }}>
              Pick your automation level. Bring your own voice, SMS, and payment accounts — billed directly by the provider.
            </p>
            <Link to="/audit" style={{ fontSize: 13, color: "#00E5FF", fontWeight: 600 }} className="hover:underline">
              We offer a complimentary audit to help determine which plans best fit your business needs →
            </Link>
          </div>

          {/* 4-Tier Pricing Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">

            {/* Aura Core */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-teal-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-teal-500/20 text-teal-400 border-teal-500/30 text-[10px]">Entry Level</Badge>
                <h3 className="text-lg font-bold mb-1 text-teal-400">Aura Core</h3>
                <p className="text-[10px] text-white mb-1">Core booking & web presence</p>
                <p className="text-[10px] text-white italic mb-2">Best for solo operators, restaurants, and single-location service businesses.</p>
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-base text-white/60 line-through decoration-2 decoration-rose-400/70">$697</span>
                  <span className="text-3xl font-bold text-teal-400">$497</span>
                  <span className="text-white text-sm">/month</span>
                  <span className="text-[9px] uppercase tracking-wide font-semibold text-teal-300 bg-teal-500/15 border border-teal-400/30 rounded-full px-2 py-0.5">Beta Pricing</span>
                </div>
                <p className="text-xs text-secondary mb-3">$4,771/year (Save ~20%)</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs text-white">8 Smart AI Agents + Industry Specialists</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs text-white">7 Control Centers (Field Ops, Social, Analytics included)</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs text-white">Triage + Booking + Follow-Up + Review</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs text-white">Creative Content + Web Presence</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /><span className="text-xs text-white">10 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white" onClick={() => navigate('/auth?mode=company&tab=signup&tier=starter')}>
                  Start 60-Day Live Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                 <p className="text-[9px] text-emerald-400/80 mt-2 text-center">Platform only — providers billed separately · Onboarding: <span className="line-through opacity-70">$497</span> <span className="font-semibold">$249</span> (50% OFF — Beta)</p>
              </CardContent>
            </Card>

            {/* Aura Boost */}
            <Card className="relative overflow-hidden border-sky-400/50 shadow-glow dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-sky-500/20 text-cyan-400 border-sky-500/30 text-[10px]">Most Popular</Badge>
                <h3 className="text-lg font-bold mb-1 text-cyan-400">Aura Boost</h3>
                <p className="text-[10px] text-white mb-1">Field service automation</p>
                <p className="text-[10px] text-white italic mb-2">Best for small service teams — HVAC, plumbing, electrical, field service.</p>
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-base text-white/60 line-through decoration-2 decoration-rose-400/70">$1,394</span>
                  <span className="text-3xl font-bold text-cyan-400">$994</span>
                  <span className="text-white text-sm">/month</span>
                  <span className="text-[9px] uppercase tracking-wide font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 rounded-full px-2 py-0.5">Beta Pricing</span>
                </div>
                <p className="text-xs text-secondary mb-3">$9,542/year (Save ~20%)</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /><span className="text-xs text-white">12 Smart AI Agents + Industry Specialists</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /><span className="text-xs text-white">7 Control Centers</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /><span className="text-xs text-white">Dispatch + Route + ETA + Check-In</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /><span className="text-xs text-white">Service Management + Social Media + Analytics</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /><span className="text-xs text-white">25 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white" onClick={() => navigate('/auth?mode=company&tab=signup&tier=connect')}>
                  <Zap className="w-3 h-3 mr-1" />Start 60-Day Live Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                 <p className="text-[9px] text-emerald-400/80 mt-2 text-center">Platform only — providers billed separately · Onboarding: <span className="line-through opacity-70">$994</span> <span className="font-semibold">$497</span> (50% OFF — Beta)</p>
              </CardContent>
            </Card>

            {/* Aura Pro */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-purple-400/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">Growth</Badge>
                <h3 className="text-lg font-bold mb-1 text-purple-400">Aura Pro</h3>
                <p className="text-[10px] text-white mb-1">Full business management</p>
                <p className="text-[10px] text-white italic mb-2">Best for growing companies with field teams and multiple technicians.</p>
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-base text-white/60 line-through decoration-2 decoration-rose-400/70">$2,788</span>
                  <span className="text-3xl font-bold text-purple-400">$1,988</span>
                  <span className="text-white text-sm">/month</span>
                  <span className="text-[9px] uppercase tracking-wide font-semibold text-purple-300 bg-purple-500/15 border border-purple-400/30 rounded-full px-2 py-0.5">Beta Pricing</span>
                </div>
                <p className="text-xs text-secondary mb-3">$19,085/year (Save ~20%)</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-white">16 Smart AI Agents + Industry Specialists</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-white">All 7 Control Centers (Business Mgmt unlocked)</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-white">Quoting + Invoicing + Inventory</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-white">Insights + Performance Agents</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /><span className="text-xs text-white">50 Employee Accounts</span></div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white" onClick={() => navigate('/auth?mode=company&tab=signup&tier=performance')}>
                  Start 60-Day Live Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                 <p className="text-[9px] text-emerald-400/80 mt-2 text-center">Platform only — providers billed separately · Onboarding: <span className="line-through opacity-70">$1,988</span> <span className="font-semibold">$994</span> (50% OFF — Beta)</p>
              </CardContent>
            </Card>

            {/* Aura Elite */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-amber-500/30 dark-card-surface">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-5">
                <Badge className="mb-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Enterprise</Badge>
                <h3 className="text-lg font-bold mb-1 text-amber-400">Aura Elite</h3>
                <p className="text-[10px] text-amber-400/80 mb-1">Full Suite / Enterprise</p>
                <p className="text-[10px] text-white italic mb-2">Best for large service teams, property management firms, and enterprise operations.</p>
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-base text-white/60 line-through decoration-2 decoration-rose-400/70">$5,576</span>
                  <span className="text-3xl font-bold text-amber-400">$3,979</span>
                  <span className="text-white text-sm">/month</span>
                  <span className="text-[9px] uppercase tracking-wide font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-full px-2 py-0.5">Beta Pricing</span>
                </div>
                <p className="text-xs text-secondary mb-3">$38,198/year (Save ~20%)</p>
                <div className="space-y-1.5 text-left mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs text-white">24 Smart AI Agents + All Industry Specialists</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs text-white">All 7 Control Centers + AI Hub</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /><span className="text-xs text-white">Priority Support + Unlimited Employees</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-amber-500/50 hover:bg-amber-500/10" onClick={() => navigate('/auth?mode=company&tab=signup&tier=command')}>
                  Start 60-Day Live Trial
                </Button>
                <button onClick={() => setShowPlanComparison(!showPlanComparison)} className="w-full mt-2 text-xs text-white hover:text-white/80 flex items-center justify-center gap-1 transition-colors">
                  See More Details {showPlanComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                 <p className="text-[9px] text-emerald-400/80 mt-2 text-center">Platform only — providers billed separately · Onboarding: <span className="line-through opacity-70">$3,979</span> <span className="font-semibold">$1,990</span> (50% OFF — Beta)</p>
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
              <DiyCostBreakdown />
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
              Additional employees: <span className="font-medium">$25 per 10 employees</span>
            </p>
          </div>

          {/* Consolidated: BETA Sign-Up + Trial + 3rd-Party intro + 10DLC details */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 md:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Zap className="w-3 h-3" /> Beta
                </span>
                <h3 className="text-base md:text-lg font-bold text-primary">
                  BETA Sign-Up — 60-Day Live Trial &amp; 3rd-Party Integrations
                </h3>
              </div>

              {/* Trial + pricing summary */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-md bg-black/20 p-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">60-Day Live Trial</p>
                  <p className="text-[11px] text-white/85 leading-relaxed">30 days concierge onboarding + 30 days full live use.</p>
                </div>
                <div className="rounded-md bg-black/20 p-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">Beta Pricing Locked In</p>
                  <p className="text-[11px] text-white/85 leading-relaxed">Lock in beta monthly pricing on your tier (see plans above).</p>
                </div>
                <div className="rounded-md bg-black/20 p-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">Onboarding Fee</p>
                  <p className="text-[11px] text-white/85 leading-relaxed">50% of your beta monthly price — due at start of trial, non-refundable once onboarding begins.</p>
                </div>
              </div>

              <p className="text-[11px] text-white/75 leading-relaxed">
                <span className="font-semibold text-white">Onboarding covers:</span> account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation, A2P 10DLC compliance filing, and your initial training session.
              </p>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* 3rd-Party intro */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">3rd-Party Integrations &amp; Usage Fees</h4>
                <p className="text-xs text-white/85 leading-relaxed">
                  Bring your own provider accounts (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social). Each vendor bills you directly, pay-as-you-go — <span className="font-semibold text-white">including during your trial</span>. A valid credit card is required on every provider account. Vendor fees are set by the provider and may change at any time.
                </p>
              </div>

              {/* Why my own accounts? — collapsible explainer */}
              <details className="rounded-md bg-black/20 border border-white/10 p-3 group">
                <summary className="cursor-pointer text-xs font-semibold text-primary list-none flex items-center justify-between">
                  <span>Why do I need my own accounts for SignalWire, ElevenLabs, and Resend?</span>
                  <span className="text-white/60 text-[10px] group-open:hidden">show</span>
                  <span className="text-white/60 text-[10px] hidden group-open:inline">hide</span>
                </summary>
                <div className="mt-3 space-y-3 text-[11px] text-white/85 leading-relaxed">
                  <p>
                    You're not paying us a markup on your phone, voice, or email costs. You hold those accounts directly and pay the provider their actual rate — the same rate any business pays. We don't add a margin and resell it back to you as a mystery line item.
                  </p>
                  <p>
                    Other platforms (ServiceTitan, Jobber) bundle these into flat-fee add-ons regardless of usage. You never see the underlying cost. We'd rather show you the real number.
                  </p>
                  <div className="rounded bg-white/5 p-2">
                    <p className="text-[10px] font-semibold text-white uppercase tracking-wide mb-1">Typical monthly cost (small service business)</p>
                    <ul className="text-[11px] space-y-0.5">
                      <li><span className="font-semibold text-white">SignalWire</span> — phone + calls + SMS · ~$15-30/mo</li>
                      <li><span className="font-semibold text-white">ElevenLabs</span> — Talk to Aura voice · $22/mo (Creator)</li>
                      <li><span className="font-semibold text-white">Resend</span> — email · free to 3,000, then $20/mo</li>
                      <li><span className="font-semibold text-white">Total</span> — roughly $35-70/mo, scales with phone activity</li>
                    </ul>
                    <p className="text-[10px] text-white/60 mt-1">Plus one-time A2P 10DLC carrier registration (~$10/mo ongoing) — required for business SMS.</p>
                  </div>
                  <ul className="text-[11px] space-y-1.5">
                    <li><span className="font-semibold text-white">Why not bundle it?</span> We keep our platform fee separate so neither number is inflated. Your Aura bill never fluctuates with call volume.</li>
                    <li><span className="font-semibold text-white">Extra setup?</span> A little. Concierge Onboarding can create and configure these for you using your login and card.</li>
                    <li><span className="font-semibold text-white">Low call volume?</span> Costs scale down — ElevenLabs starts at $5/mo, Resend is free under 3,000 emails.</li>
                    <li><span className="font-semibold text-white">High call volume?</span> Costs scale up, but a bundled flat fee would too — with a markup baked in. We'll model your numbers before you commit.</li>
                    <li><span className="font-semibold text-white">Switch providers later?</span> We're actively adding alternative provider options. Ask onboarding.</li>
                    <li><span className="font-semibold text-white">Do you mark up?</span> No. You're billed directly by each vendor on your own card. We never see or touch that money.</li>
                  </ul>
                </div>
              </details>

              {/* SMS / 10DLC details */}
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="w-full space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold text-warning">SMS / 10DLC Compliance — required for SMS</h5>
                      <p className="text-[11px] text-white/85 leading-relaxed mt-1">
                        10DLC is the US carrier standard for business SMS. We register your brand &amp; campaigns through SignalWire on your behalf. Unregistered messages are filtered or blocked.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-md bg-black/20 p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold text-warning uppercase tracking-wide">Pass-Through Fees</p>
                        <ul className="text-[11px] text-white/90 space-y-1 list-disc list-inside">
                          <li>Brand registration — <span className="font-medium text-white">$4.50 one-time</span></li>
                          <li>Campaign fee — <span className="font-medium text-white">$1.50–$30/mo</span> (first 3 mo upfront)</li>
                          <li>DCA vetting — <span className="font-medium text-white">$7.50</span> per submission</li>
                          <li>Optional brand vetting — <span className="font-medium text-white">$40</span> (raises T-Mobile caps)</li>
                          <li>T-Mobile non-use fee — <span className="font-medium text-white">$250</span> (no SMS in 60 days)</li>
                        </ul>
                        <p className="text-[11px] text-white/70 pt-1">Typical all-in: <span className="font-medium text-white">$16–$42</span> to go live</p>
                      </div>

                      <div className="rounded-md bg-black/20 p-3 space-y-2">
                        <p className="text-[11px] font-semibold text-warning uppercase tracking-wide">Approval &amp; What You Provide</p>
                        <div>
                          <p className="text-[11px] font-medium text-white">Timeline</p>
                          <p className="text-[11px] text-white/80">3–5 business days when clean. 1–2+ weeks if re-vetting is needed. No guaranteed turnaround.</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-white">Required Documents</p>
                          <p className="text-[11px] text-white/80">EIN / Tax ID, legal business name, DBA (if applicable), LLC/Inc docs, brand website, opt-in/opt-out language, sample messages, and a help message.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor cards grid */}
          <div className="mt-8 max-w-4xl mx-auto">

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ordered from lowest to highest cost */}
              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-xs text-cyan-400">Google Calendar</span>
                </div>
                <p className="text-[10px] text-white mb-1">Scheduling Sync (OAuth, bidirectional)</p>
                <p className="text-[10px] text-emerald-400 font-medium">Included — unlimited, all tiers</p>
                <p className="text-[10px] text-white">Multiple team-member calendars · iCal supported</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-3.5 h-3.5 text-channel-email" />
                  <span className="font-semibold text-xs text-channel-email">Resend</span>
                </div>
                <p className="text-[10px] text-white mb-1">Email Delivery</p>
                <p className="text-[10px] text-emerald-400 font-medium">Your own Resend account · billed directly by Resend</p>
                <p className="text-[10px] text-white">Resend pricing: Free 3,000/mo · Pro $20 (50k) · Scale $90+ · then ~$0.90 per 1,000</p>
                <p className="text-[10px] text-white">Custom domain recommended · Valid credit card required on your Resend account</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold text-xs text-purple-400">ElevenLabs</span>
                </div>
                <p className="text-[10px] text-white mb-1">AI Voice Synthesis</p>
                <p className="text-[10px] text-emerald-400 font-medium">Your own ElevenLabs account · billed directly by ElevenLabs</p>
                <p className="text-[10px] text-white">Free 15 min/mo · Starter $5 · Creator $22 · Pro $99 · pay-as-you-go available</p>
                <p className="text-[10px] text-white">Valid credit card required on your ElevenLabs account · all tiers</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-green-400" />
                  <span className="font-semibold text-xs text-green-400">SignalWire</span>
                </div>
                <p className="text-[10px] text-white mb-1">SMS & Voice Calls</p>
                <p className="text-[10px] text-emerald-400 font-medium">Your own SignalWire account · billed directly by SignalWire</p>
                <p className="text-[10px] text-white">Local number $0.50/mo · SMS $0.00415/segment · Voice $0.0066/min in / $0.008/min out · AI Agent $0.16/min</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-xs text-amber-400">A2P 10DLC Compliance</span>
                </div>
                <p className="text-[10px] text-white mb-1">US SMS Carrier Registration — required for SMS on all tiers.</p>
                <p className="text-[10px] text-amber-300 font-medium">See 10DLC fee &amp; approval details above.</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-xs text-amber-400">Stripe (Your Account)</span>
                </div>
                <p className="text-[10px] text-white mb-1">Payment Processing</p>
                <p className="text-[10px] text-white font-medium">2.9% + $0.30 per successful transaction</p>
                <p className="text-[10px] text-white">Fees paid directly to Stripe</p>
                <p className="text-[10px] text-white">Required for Invoice Agent on Elite · Volume discounts &gt;$80K/mo via stripe.com/contact/sales</p>
              </div>

              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-semibold text-xs text-pink-400">Social Media Accounts</span>
                </div>
                <p className="text-[10px] text-white mb-1">Facebook, Instagram, LinkedIn, TikTok</p>
                <p className="text-[10px] text-emerald-400 font-medium">OAuth — connect your existing pages</p>
                <p className="text-[10px] text-white">Core: manual Bridge posting · Boost/Pro/Elite: automated via Social Scheduler (up to 6 platforms)</p>
                <p className="text-[10px] text-white">Admin access to your business pages required</p>
              </div>


              <div className="rounded-lg p-3 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-semibold text-xs text-orange-400">Tavily</span>
                </div>
                <p className="text-[10px] text-white mb-1">AI Research Engine</p>
                <p className="text-[10px] text-emerald-400 font-medium">Your own Tavily account · billed directly by Tavily</p>
                <p className="text-[10px] text-white">Tavily pricing: Free 1,000 credits/mo · then $0.008/credit · Project plans from ~$30/mo</p>
                <p className="text-[10px] text-white">Search 1–2/query · Extract 1–2 per 5 URLs · Map 1 per 10 URLs · Crawl = Map + Extract</p>
                <p className="text-[10px] text-white">API key configured during onboarding · Valid credit card required on your Tavily account</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      </main>
      <PublicFooter />
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget autoOpenAfterMs={6000} autoOpenStorageKey="aura_autoopen_home" />
    </div>
  );
}