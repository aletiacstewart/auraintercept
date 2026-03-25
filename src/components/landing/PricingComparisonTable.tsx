import React from 'react';
import { Check, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Feature definitions with tooltips
const featureDescriptions: Record<string, string> = {
  // AI Agents - Lead Capture Stack
  'AI Receptionist (Triage)': 'Your 24/7 virtual receptionist that answers calls, qualifies leads, and routes inquiries to the right team member or agent.',
  
  // AI Agents - Booking Stack
  'Scheduling Agent (Booking)': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Follow-up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  
  // AI Agents - Marketing Stack
  'Review Agent': 'Requests reviews from satisfied customers and monitors your online reputation across platforms.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
  'Social Media Agent': 'AI-powered content creation for Facebook, Instagram, LinkedIn, TikTok, Google Business, and SMS. Generates platform-optimized captions, hashtags, and image prompts.',
  'Social Media Scheduler': 'Content calendar management across 6 platforms. AI generates ready-to-post content. Use the Manual Bridge to copy content and open the platform composer with one click. Own API credentials can be configured for automatic posting.',
  'Social Media Analytics': 'Engagement tracking, reach analysis, and content performance insights across all 6 platforms. Tracks manual and API-posted content.',
  'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing.',
  
  // AI Agents - Office Stack
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts.',
  
  // AI Agents - Field Ops Stack
  'Dispatch Agent': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Provides real-time arrival estimates to customers and updates them automatically on delays.',
  'Check-in Agent': 'Manages technician check-ins and check-outs, tracking job progress in real-time.',
  'Quote Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  
  // AI Agents - Business Intelligence Stack
  'Admin Agent': 'User management, company settings, and access control.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  
  // Summary
  'All 24 AI Agents': 'Full access to all 24 specialized AI agents for complete business automation.',
  
  // Control Centers
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Outreach & Sales Ops Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Social Media Console': 'Unified control center to create, schedule, approve, and post social content across 6 platforms. Includes the Manual Bridge (copy + open platform composer) and Own API setup for companies who want automatic posting. Platform-level auto-posting coming soon.',
  'Creative & Web Presence Console': 'AI-powered Web Presence builder with chat, voice, and booking integration.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'All 7 Control Centers': 'Full access to all 7 specialized control consoles.',
  
  // Communication Channels - Chat vs Voice distinction
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers. No external dependencies required (no ElevenLabs or SignalWire needed). Customers type questions and receive text responses.',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Requires ElevenLabs for natural voice synthesis and SignalWire for telephony. Available on ALL tiers.',
  'Email Reminders': 'Automated email reminders for appointments, follow-ups, and important updates.',
  'SMS Reminders': 'Text message reminders to reduce no-shows and keep customers informed.',
  
  // 3rd Party Integrations - Clarify voice-only requirements
  'ElevenLabs (Voice)': 'Required for Talk to Aura (Voice) features only (speech-based conversations). NOT required for Message Aura (Text) which works on all tiers without any external dependencies.',
  'SignalWire (SMS & Voice)': 'Required for SMS reminders and Talk to Aura (Voice) calls. NOT required for Message Aura (Text).',
  
  // Platform features
  'Calendar Sync': 'Sync appointments with Google Calendar or any iCal-compatible calendar.',
  'API Access': 'Full API access for custom integrations and automation workflows.',
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
  scheduling: FeatureValue;
  growth: FeatureValue;
  business: FeatureValue;
  fieldOps: FeatureValue;
  performance: FeatureValue;
  command: FeatureValue;
}

interface FeatureSection {
  title: string;
  features: FeatureRow[];
}

const sections: FeatureSection[] = [
  {
    title: 'Ideal For',
    features: [
      { name: 'Business Size', starter: 'Single Location', scheduling: 'Up to 3 employees', growth: 'Up to 5 employees', business: 'Up to 8 employees', fieldOps: 'Up to 15 employees', performance: 'Up to 25 employees', command: 'Up to 50 employees' },
      { name: 'Use Case', starter: 'Voice + smart links', scheduling: 'Calendar & booking', growth: 'Marketing & social', business: 'Digital presence', fieldOps: 'Field operations', performance: 'Full automation', command: 'Multi-location / Enterprise' },
    ],
  },
  {
    title: 'AI Agents (1 / 3 / 11 / 12 / 18 / 22 / 24)',
    features: [
      // Lead Capture Stack (1 agent) - All tiers
      { name: 'AI Receptionist (Triage)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      
      // Booking Stack (2 agents) - Scheduling+
      { name: 'Scheduling Agent (Booking)', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Follow-up Agent', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      
      // Marketing Stack (8 agents) - Growth+
      { name: 'Review Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Campaign Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Lead Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Scheduler', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Analytics', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      
      // Office Stack (1 agent) - Business+
      { name: 'Web Presence Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      
      // Field Ops Stack (6 agents) - Field Ops+
      { name: 'Dispatch Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Route Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'ETA Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Check-in Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Quote Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Invoice Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      
      // Business Intelligence Stack - Performance (4 agents), Command adds 2 more
      { name: 'Admin Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Inventory Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Performance Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Insights Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      // Advanced Analytics - Command only
      { name: 'Revenue Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'x', command: 'check' },
      { name: 'Forecast Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (0 / 1 / 3 / 4 / 6 / 7 / 7)',
    features: [
      { name: 'Customer Portal Console', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach & Sales Ops Console', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Business Management Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Analytics & Reports Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', starter: 'x', scheduling: 'Unlimited', growth: 'Unlimited', business: 'Unlimited', fieldOps: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', starter: '2 included', scheduling: '3 included', growth: '5 included', business: '8 included', fieldOps: '15 included', performance: '25 included', command: '50 included' },
      { name: 'Additional Employees', starter: '$25/10 employees', scheduling: '$25/10 employees', growth: '$25/10 employees', business: '$25/10 employees', fieldOps: '$25/10 employees', performance: '$25/10 employees', command: '$25/10 employees' },
      { name: 'White-Label Branding', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Smart Link Sharing', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'API Access', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Customer Support', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', starter: 'Optional', scheduling: 'Optional', growth: 'Optional', business: 'Optional', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'SignalWire (SMS & Voice)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'A2P 10DLC Compliance', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Calendar Sync', starter: 'Optional', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', starter: 'Optional', scheduling: 'Optional', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Tavily (AI Research)', starter: 'Optional', scheduling: 'Optional', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', starter: '$197', scheduling: '$397', growth: '$597', business: '$797', fieldOps: '$1,497', performance: '$497', command: '$697' },
      { name: 'Annual Price', starter: '$1,970/year', scheduling: '$3,970/year', growth: '$5,970/year', business: '$7,970/year', fieldOps: '$14,970/year', performance: '$4,970/year', command: '$6,970/year' },
      { name: 'Annual Savings', starter: 'Save $394', scheduling: 'Save $794', growth: 'Save $1,194', business: 'Save $1,594', fieldOps: 'Save $2,994', performance: 'Save $994', command: 'Save $1,394' },
    ],
  },
];

const renderValue = (value: FeatureValue, isHighlighted: boolean, featureName: string, isGrowth: boolean = false, isScheduling: boolean = false) => {
  let baseClass = 'py-2 px-3 text-center';
  
  if (isHighlighted) {
    baseClass = 'py-2 px-3 text-center bg-sky-600/20 border-x border-sky-400/30';
  } else if (isGrowth) {
    baseClass = 'py-2 px-3 text-center bg-rose-500/10 border-x border-rose-400/20';
  } else if (isScheduling) {
    baseClass = 'py-2 px-3 text-center bg-teal-500/10 border-x border-teal-400/20';
  }

  if (value === 'check') {
    let checkColor = 'text-emerald-400';
    if (isGrowth) checkColor = 'text-rose-400';
    if (isScheduling) checkColor = 'text-teal-400';
    return (
      <td className={baseClass}>
        <Check className={`w-4 h-4 ${checkColor} mx-auto`} />
      </td>
    );
  }
  if (value === 'x') {
    return (
      <td className={baseClass}>
        <X className="w-4 h-4 text-slate-400 mx-auto" />
      </td>
    );
  }
  
  // Special styling for different value types
  const isPricing = featureName === 'Monthly Price';
  const isSavings = value.includes('Save');
  const isAddon = value.includes('Add-on') || value.startsWith('+$');
  const isOptional = value === 'Optional';
  
  let textClass = 'text-white text-xs';
  if (isPricing) {
    if (isGrowth) {
      textClass = 'text-rose-300 font-semibold';
    } else if (isScheduling) {
      textClass = 'text-teal-300 font-semibold';
    } else if (isHighlighted) {
      textClass = 'text-sky-300 font-semibold';
    } else {
      textClass = 'text-white font-semibold';
    }
  } else if (isSavings) {
    if (isGrowth) {
      textClass = 'text-rose-400 text-xs';
    } else if (isScheduling) {
      textClass = 'text-teal-400 text-xs';
    } else {
      textClass = 'text-emerald-400 text-xs';
    }
  } else if (isAddon) {
    textClass = 'text-amber-400 text-xs';
  } else if (isOptional) {
    textClass = 'text-white/70 text-xs';
  }
  
  return (
    <td className={`${baseClass} ${textClass}`}>
      {value}
    </td>
  );
};

const FeatureNameCell = ({ name, rowIndex }: { name: string; rowIndex: number }) => {
  const description = featureDescriptions[name];
  const isEven = rowIndex % 2 === 0;
  const baseClass = `py-2 px-4 text-white ${isEven ? 'bg-slate-700/30' : ''}`;
  
  if (description) {
    return (
      <td className={baseClass}>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-white/40 hover:border-sky-400 hover:text-sky-300 transition-colors">
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="max-w-xs bg-slate-800 text-white border-slate-600 z-50"
        >
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </td>
    );
  }
  
  return <td className={baseClass}>{name}</td>;
};

export const PricingComparisonTable = () => {
  let globalRowIndex = 0;
  
  return (
    <TooltipProvider delayDuration={200}>
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/20 bg-slate-700/80">
            <th className="text-left py-2.5 px-4 font-semibold text-white text-sm">Feature</th>
            <th className="text-center py-2.5 px-3 font-semibold bg-orange-500/15 border-x border-orange-400/20 text-sm">
              <div className="text-orange-300">Aura Starter</div>
              <div className="text-[10px] font-normal text-orange-300/70">$197/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-teal-500/20 border-x border-teal-400/30 text-sm">
              <div className="text-teal-300">Aura Connect</div>
              <div className="text-[10px] font-normal text-teal-300/70">$397/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-rose-500/20 border-x border-rose-400/30 text-sm">
              <div className="text-rose-300">Aura Growth</div>
              <div className="text-xs font-normal text-rose-300/70">$397/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Aura Presence</div>
              <div className="text-xs font-normal text-emerald-400">Digital-First</div>
              <div className="text-xs font-normal text-white/70">$797/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Aura Logistics</div>
              <div className="text-xs font-normal text-white/70">$1,497/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-sky-600/40 border-x border-sky-400/50 text-sm">
              <div className="text-sky-300">Aura Performance</div>
              <div className="text-xs font-normal text-white/70">$497/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-amber-500/20 border-x border-amber-400/30 text-sm">
              <div className="text-amber-300">Aura Command</div>
              <div className="text-[10px] font-normal text-amber-400/80">Enterprise</div>
              <div className="text-xs font-normal text-white/70">$697/mo</div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sections.map((section) => {
            // Check if title has numbers in parentheses like "AI Agents (1 / 3 / 11 / 12 / 18 / 24 / 24)"
            const numberMatch = section.title.match(/^(.+?)\s*\(([^)]+)\)$/);
            const hasNumbers = numberMatch && numberMatch[2].includes('/');
            
            let titleText = section.title;
            let numbers: string[] = [];
            
            if (hasNumbers && numberMatch) {
              titleText = numberMatch[1];
              numbers = numberMatch[2].split('/').map(n => n.trim());
            }
            
            return (
            <React.Fragment key={section.title}>
              {/* Section Header */}
              <tr key={`section-${section.title}`} className="bg-slate-700/60">
                {hasNumbers && numbers.length === 7 ? (
                  <>
                    <td className="py-1.5 px-4 font-semibold text-sky-300">
                      {titleText}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-orange-300/80 text-xs">
                      {numbers[0]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-teal-300/80 text-xs">
                      {numbers[1]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-rose-300/80 text-xs">
                      {numbers[2]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-white/80 text-xs">
                      {numbers[3]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-white/80 text-xs">
                      {numbers[4]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-sky-300/80 text-xs">
                      {numbers[5]}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-amber-300/80 text-xs">
                      {numbers[6]}
                    </td>
                  </>
                ) : (
                  <td colSpan={8} className="py-1.5 px-4 font-semibold text-sky-300">
                    {section.title}
                  </td>
                )}
              </tr>
              
              {/* Section Rows */}
              {section.features.map((feature) => {
                const rowIndex = globalRowIndex++;
                const isEven = rowIndex % 2 === 0;
                const rowBg = isEven ? 'bg-slate-700/20' : '';
                
                return (
                  <Tooltip key={feature.name}>
                    <tr className={`border-b border-white/10 hover:bg-slate-600/30 ${rowBg}`}>
                      <FeatureNameCell name={feature.name} rowIndex={rowIndex} />
                      {renderValue(feature.starter, false, feature.name)}
                      {renderValue(feature.scheduling, false, feature.name, false, true)}
                      {renderValue(feature.growth, false, feature.name, true)}
                      {renderValue(feature.business, false, feature.name)}
                      {renderValue(feature.fieldOps, false, feature.name)}
                      {renderValue(feature.performance, true, feature.name)}
                      {renderValue(feature.command, false, feature.name)}
                    </tr>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          );
          })}
        </tbody>
      </table>
    </TooltipProvider>
  );
};
