import { Check, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Feature definitions with tooltips
const featureDescriptions: Record<string, string> = {
  // AI Agents - Single-Point (3)
  'AI Receptionist (Triage)': 'Your 24/7 virtual receptionist that answers calls, qualifies leads, and routes inquiries to the right team member or agent.',
  'Follow-up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  'Review Agent': 'Requests reviews from satisfied customers and monitors your online reputation across platforms.',
  
  // AI Agents - Multi-Track adds (7 more = 10 total)
  'Scheduling Agent (Booking)': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Dispatch Agent': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Provides real-time arrival estimates to customers and updates them automatically on delays.',
  'Check-in Agent': 'Manages technician check-ins and check-outs, tracking job progress in real-time.',
  'Quote Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  
  // AI Agents - Command adds (14 more = 24 total)
  'Admin Agent': 'User management, company settings, and access control.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
  'Social Media Agent': 'AI-powered content creation for all social platforms.',
  'Social Media Scheduler': 'Automated post scheduling across 6 platforms.',
  'Social Media Analytics': 'Engagement metrics and performance tracking.',
  'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing.',
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  
  // Summary
  'All 24 AI Agents': 'Full access to all 24 specialized AI agents for complete business automation.',
  
  // Control Centers
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Outreach & Sales Ops Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Social Media Console': 'Unified dashboard to manage all your social media accounts and content calendar.',
  'Web Presence Console': 'AI-powered Web Presence builder with chat, voice, and booking integration.',
  'All 7 Control Centers': 'Full access to all 7 specialized control consoles.',
  
  // Communication Channels - Chat vs Voice distinction
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers including Core. No external dependencies required (no ElevenLabs or Twilio needed). Customers type questions and receive text responses.',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Available on Aura Express and above (where enabled). Requires ElevenLabs for natural voice synthesis and Twilio for telephony. Different from Message Aura (Text).',
  'Email Reminders': 'Automated email reminders for appointments, follow-ups, and important updates.',
  'SMS Reminders': 'Text message reminders to reduce no-shows and keep customers informed.',
  
  // 3rd Party Integrations - Clarify voice-only requirements
  'ElevenLabs (Voice)': 'Required for Talk to Aura (Voice) features only (speech-based conversations). NOT required for Message Aura (Text) which works on all tiers without any external dependencies.',
  'Twilio (SMS & Voice)': 'Required for SMS reminders and Talk to Aura (Voice) calls. NOT required for Message Aura (Text).',
  
  // Platform features
  'Calendar Sync': 'Sync appointments with Google Calendar or any iCal-compatible calendar.',
  'API Access': 'Full API access for custom integrations and automation workflows.',
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  express: FeatureValue;
  flow: FeatureValue;
  halo: FeatureValue;
  core: FeatureValue;
  singlePoint: FeatureValue;
  multiTrack: FeatureValue;
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
      { name: 'Business Size', express: 'Single Restaurants', flow: 'Individual/Real Estate', halo: 'Salons & Spas', core: 'Up to 4 employees', singlePoint: 'Up to 8 employees', multiTrack: 'Up to 16 employees', command: 'Up to 32 employees' },
      { name: 'Use Case', express: 'Voice + smart links', flow: 'Calendar & showings', halo: 'Appointment-based', core: 'Digital presence tools', singlePoint: 'Lead capture focus', multiTrack: 'Field operations', command: 'Multi-location / Enterprise' },
    ],
  },
  {
    title: 'AI Agents (1 / 7 / 12 / 8 / 12 / 18 / 24)',
    features: [
      // AI Receptionist - ALL tiers
      { name: 'AI Receptionist (Triage)', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Scheduling agents
      { name: 'Scheduling Agent (Booking)', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Follow-up Agent', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Review Agent
      { name: 'Review Agent', express: 'x', flow: 'x', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Outreach & Sales - NOT in Express/Flow
      { name: 'Campaign Agent', express: 'x', flow: 'x', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Lead Agent', express: 'x', flow: 'x', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Marketing Agent', express: 'x', flow: 'x', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Social Media - NOT in Express
      { name: 'Social Media Agent', express: 'x', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Social Media Scheduler', express: 'x', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Social Media Analytics', express: 'x', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Creative & Web Presence - NOT in Express
      { name: 'Creative Agent', express: 'x', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Web Presence Agent', express: 'x', flow: 'x', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Field Operations
      { name: 'Dispatch Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Route Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'ETA Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Check-in Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      // Business Operations
      { name: 'Quote Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Invoice Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      // Command tier only
      { name: 'Admin Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Inventory Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Performance Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Revenue Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Insights Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Forecast Agent', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (0 / 1 / 4 / 2 / 4 / 5 / 7)',
    features: [
      { name: 'Customer Portal Console', express: 'x', flow: 'x', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Outreach & Sales Ops Console', express: 'x', flow: 'x', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Social Media Console', express: 'x', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Web Presence Console', express: 'x', flow: 'x', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Field Operations Console', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Business Management Console', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Analytics & Reports Console', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', express: 'check', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Email Reminders', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'SMS Reminders', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', express: 'x', flow: 'Unlimited', halo: 'Unlimited', core: 'x', singlePoint: 'Unlimited', multiTrack: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', express: '2 included', flow: '1 included', halo: '3 included', core: '2 included', singlePoint: '5 included', multiTrack: '10 included', command: '25 included' },
      { name: 'Additional Employees', express: '$10/employee', flow: '$10/employee', halo: '$10/employee', core: '$10/employee', singlePoint: '$10/employee', multiTrack: '$10/employee', command: '$10/employee' },
      { name: 'White-Label Branding', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Smart Link Sharing', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'API Access', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Priority Support', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Dedicated Account Manager', express: 'x', flow: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', express: 'Optional', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', express: 'Optional', flow: 'Optional', halo: 'Optional', core: 'Optional', singlePoint: 'Optional', multiTrack: 'Required', command: 'Required' },
      { name: 'Twilio (SMS & Voice)', express: 'Required', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', express: 'Required', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Calendar Sync', express: 'Optional', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Optional', multiTrack: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', express: 'Optional', flow: 'Required', halo: 'Required', core: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Tavily (AI Research)', express: 'Optional', flow: 'Required', halo: 'Required', core: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', express: '$197', flow: '$297', halo: '$397', core: '$500', singlePoint: '$1,500', multiTrack: '$3,997', command: '$5,997' },
      { name: 'Annual Price', express: '$1,970/year', flow: '$2,970/year', halo: '$3,970/year', core: '$5,000/year', singlePoint: '$15,000/year', multiTrack: '$39,970/year', command: '$59,970/year' },
      { name: 'Annual Savings', express: 'Save $394', flow: 'Save $594', halo: 'Save $794', core: 'Save $1,000', singlePoint: 'Save $3,000', multiTrack: 'Save $7,994', command: 'Save $11,994' },
    ],
  },
];

const renderValue = (value: FeatureValue, isHighlighted: boolean, featureName: string, isHalo: boolean = false, isFlow: boolean = false) => {
  let baseClass = 'py-2 px-3 text-center';
  
  if (isHighlighted) {
    baseClass = 'py-2 px-3 text-center bg-sky-600/20 border-x border-sky-400/30';
  } else if (isHalo) {
    baseClass = 'py-2 px-3 text-center bg-rose-500/10 border-x border-rose-400/20';
  } else if (isFlow) {
    baseClass = 'py-2 px-3 text-center bg-teal-500/10 border-x border-teal-400/20';
  }

  if (value === 'check') {
    let checkColor = 'text-emerald-400';
    if (isHalo) checkColor = 'text-rose-400';
    if (isFlow) checkColor = 'text-teal-400';
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
    if (isHalo) {
      textClass = 'text-rose-300 font-semibold';
    } else if (isFlow) {
      textClass = 'text-teal-300 font-semibold';
    } else if (isHighlighted) {
      textClass = 'text-sky-300 font-semibold';
    } else {
      textClass = 'text-white font-semibold';
    }
  } else if (isSavings) {
    if (isHalo) {
      textClass = 'text-rose-400 text-xs';
    } else if (isFlow) {
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
              <div className="text-orange-300">Aura Express</div>
              <div className="text-[10px] font-normal text-orange-300/70">$197/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-teal-500/20 border-x border-teal-400/30 text-sm">
              <div className="text-teal-300">Aura Flow</div>
              <div className="text-[10px] font-normal text-teal-300/70">$297/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-rose-500/20 border-x border-rose-400/30 text-sm">
              <div className="text-rose-300">Aura Halo</div>
              <div className="text-xs font-normal text-rose-300/70">$397/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Core</div>
              <div className="text-xs font-normal text-emerald-400">AI-Assisted</div>
              <div className="text-xs font-normal text-white/70">$500/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Single-Point</div>
              <div className="text-xs font-normal text-white/70">$1,500/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-sky-600/40 border-x border-sky-400/50 text-sm">
              <div className="text-sky-300">Multi-Track</div>
              <div className="text-xs font-normal text-white/70">$3,997/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-amber-500/20 border-x border-amber-400/30 text-sm">
              <div className="text-amber-300">Command</div>
              <div className="text-[10px] font-normal text-amber-400/80">Enterprise</div>
              <div className="text-xs font-normal text-white/70">$5,997/mo</div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sections.map((section) => {
            // Check if title has numbers in parentheses like "AI Agents (1 / 7 / 12 / 8 / 12 / 18 / 24)"
            const numberMatch = section.title.match(/^(.+?)\s*\(([^)]+)\)$/);
            const hasNumbers = numberMatch && numberMatch[2].includes('/');
            
            let titleText = section.title;
            let numbers: string[] = [];
            
            if (hasNumbers && numberMatch) {
              titleText = numberMatch[1];
              numbers = numberMatch[2].split('/').map(n => n.trim());
            }
            
            return (
            <>
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
                      {renderValue(feature.express, false, feature.name)}
                      {renderValue(feature.flow, false, feature.name, false, true)}
                      {renderValue(feature.halo, false, feature.name, true)}
                      {renderValue(feature.core, false, feature.name)}
                      {renderValue(feature.singlePoint, false, feature.name)}
                      {renderValue(feature.multiTrack, true, feature.name)}
                      {renderValue(feature.command, false, feature.name)}
                    </tr>
                  </Tooltip>
                );
              })}
            </>
          );
          })}
        </tbody>
      </table>
    </TooltipProvider>
  );
};
