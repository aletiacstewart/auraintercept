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
  'AI Receptionist (Triage)': 'Your 24/7 virtual receptionist that answers calls, qualifies leads, and routes inquiries to the right team member or agent.',
  'Scheduling Agent (Booking)': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Follow-up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  'Review Agent': 'Requests reviews from satisfied customers and monitors your online reputation across platforms.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
  'Social Media Agent': 'AI-powered content creation for Facebook, Instagram, LinkedIn, TikTok, Google Business, and SMS.',
  'Social Media Scheduler': 'Content calendar management across 6 platforms. AI generates ready-to-post content.',
  'Social Media Analytics': 'Engagement tracking, reach analysis, and content performance insights across all 6 platforms.',
  'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing.',
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts.',
  'Dispatch Agent': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Provides real-time arrival estimates to customers and updates them automatically on delays.',
  'Check-in Agent': 'Manages technician check-ins and check-outs, tracking job progress in real-time.',
  'Quote Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  'Admin Agent': 'User management, company settings, and access control.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Outreach & Sales Ops Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Social Media Console': 'Unified control center to create, schedule, approve, and post social content across 6 platforms.',
  'Creative & Web Presence Console': 'AI-powered Web Presence builder with chat, voice, and booking integration.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers. No external dependencies required.',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Requires ElevenLabs and SignalWire.',
  'Email Reminders': 'Automated email reminders for appointments, follow-ups, and important updates.',
  'SMS Reminders': 'Text message reminders to reduce no-shows and keep customers informed.',
  'ElevenLabs (Voice)': 'Required for Talk to Aura (Voice) features only. NOT required for Message Aura (Text).',
  'SignalWire (SMS & Voice)': 'Required for SMS reminders and Talk to Aura (Voice) calls.',
  'Calendar Sync': 'Sync appointments with Google Calendar or any iCal-compatible calendar.',
  'API Access': 'Full API access for custom integrations and automation workflows.',
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  connect: FeatureValue;
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
      { name: 'Business Size', connect: 'Up to 10 employees', performance: 'Up to 25 employees', command: 'Up to 50 employees' },
      { name: 'Use Case', connect: 'Booking, outreach & web', performance: 'Full automation + field ops', command: 'Multi-location / Enterprise' },
    ],
  },
  {
    title: 'AI Agents (5 / 7 / 10)',
    features: [
      // Connect (5 agents)
      { name: 'AI Receptionist (Triage)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Follow-up Agent', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Agent', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing Agent', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Web Presence Agent', connect: 'check', performance: 'check', command: 'check' },
      // Performance adds 2 (7 total)
      { name: 'Dispatch Agent', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Route Agent', connect: 'x', performance: 'check', command: 'check' },
      // Command adds 3 (10 total)
      { name: 'Admin Agent', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Revenue Agent', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Insights Agent', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (4 / 6 / 7)',
    features: [
      { name: 'Customer Portal Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach & Sales Ops Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Business Management Console', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Analytics & Reports Console', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', connect: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', connect: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', connect: '10 included', performance: '25 included', command: '50 included' },
      { name: 'Additional Employees', connect: '$25/10 employees', performance: '$25/10 employees', command: '$25/10 employees' },
      { name: 'White-Label Branding', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Smart Link Sharing', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', connect: 'check', performance: 'check', command: 'check' },
      { name: 'API Access', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Customer Support', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', connect: 'Optional', performance: 'Required', command: 'Required' },
      { name: 'SignalWire (SMS & Voice)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'A2P 10DLC Compliance', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Calendar Sync', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Tavily (AI Research)', connect: 'Required', performance: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', connect: '$297', performance: '$497', command: '$697' },
      { name: 'Annual Price', connect: '$2,970/year', performance: '$4,970/year', command: '$6,970/year' },
      { name: 'Annual Savings', connect: 'Save $594', performance: 'Save $994', command: 'Save $1,394' },
    ],
  },
];

const renderValue = (
  value: FeatureValue,
  tier: 'connect' | 'performance' | 'command',
  featureName: string
) => {
  const tierStyles = {
    connect: {
      base: 'py-2 px-3 text-center bg-teal-500/10 border-x border-teal-400/20',
      check: 'text-teal-400',
      price: 'text-teal-300 font-semibold',
      savings: 'text-teal-400 text-xs',
    },
    performance: {
      base: 'py-2 px-3 text-center bg-sky-600/20 border-x border-sky-400/30',
      check: 'text-emerald-400',
      price: 'text-sky-300 font-semibold',
      savings: 'text-emerald-400 text-xs',
    },
    command: {
      base: 'py-2 px-3 text-center bg-amber-500/10 border-x border-amber-400/20',
      check: 'text-emerald-400',
      price: 'text-amber-300 font-semibold',
      savings: 'text-emerald-400 text-xs',
    },
  };

  const style = tierStyles[tier];

  if (value === 'check') {
    return (
      <td className={style.base}>
        <Check className={`w-4 h-4 ${style.check} mx-auto`} />
      </td>
    );
  }
  if (value === 'x') {
    return (
      <td className={style.base}>
        <X className="w-4 h-4 text-slate-400 mx-auto" />
      </td>
    );
  }

  const isPricing = featureName === 'Monthly Price';
  const isSavings = value.includes('Save');
  const isAddon = value.includes('Add-on') || value.startsWith('+$');
  const isOptional = value === 'Optional';

  let textClass = 'text-white text-xs';
  if (isPricing) textClass = style.price;
  else if (isSavings) textClass = style.savings;
  else if (isAddon) textClass = 'text-amber-400 text-xs';
  else if (isOptional) textClass = 'text-white/70 text-xs';

  return (
    <td className={`${style.base} ${textClass}`}>
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
        <Tooltip>
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
        </Tooltip>
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
          <col className="w-[34%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/20 bg-slate-700/80">
            <th className="text-left py-2.5 px-4 font-semibold text-white text-sm">Feature</th>
            <th className="text-center py-2.5 px-3 font-semibold bg-teal-500/20 border-x border-teal-400/30 text-sm">
              <div className="text-teal-300">Aura Connect</div>
              <div className="text-[10px] font-normal text-teal-300/70">$297/mo · 5 agents</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-sky-600/40 border-x border-sky-400/50 text-sm">
              <div className="text-sky-300">Aura Performance</div>
              <div className="text-[10px] font-normal text-sky-300/70">$497/mo · 7 agents</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold bg-amber-500/20 border-x border-amber-400/30 text-sm">
              <div className="text-amber-300">Aura Command</div>
              <div className="text-[10px] font-normal text-amber-300/70">$697/mo · 10 agents</div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sections.map((section) => {
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
                <tr className="bg-slate-700/60">
                  {hasNumbers && numbers.length === 3 ? (
                    <>
                      <td className="py-1.5 px-4 font-semibold text-sky-300">{titleText}</td>
                      <td className="py-1.5 px-3 text-center font-semibold text-teal-300/80 text-xs">{numbers[0]}</td>
                      <td className="py-1.5 px-3 text-center font-semibold text-sky-300/80 text-xs">{numbers[1]}</td>
                      <td className="py-1.5 px-3 text-center font-semibold text-amber-300/80 text-xs">{numbers[2]}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="py-1.5 px-4 font-semibold text-sky-300">
                      {section.title}
                    </td>
                  )}
                </tr>

                {/* Section Rows */}
                {section.features.map((feature) => {
                  const rowIndex = globalRowIndex++;
                  const rowBg = rowIndex % 2 === 0 ? 'bg-slate-700/20' : '';

                  return (
                    <tr key={feature.name} className={`border-b border-white/10 hover:bg-slate-600/30 ${rowBg}`}>
                      <FeatureNameCell name={feature.name} rowIndex={rowIndex} />
                      {renderValue(feature.connect, 'connect', feature.name)}
                      {renderValue(feature.performance, 'performance', feature.name)}
                      {renderValue(feature.command, 'command', feature.name)}
                    </tr>
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
