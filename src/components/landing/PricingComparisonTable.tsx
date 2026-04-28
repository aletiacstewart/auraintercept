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
  'Booking Agent': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Follow-Up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  'Review Agent': 'Automated Google & Yelp review requests with sentiment tracking after completed jobs.',
  'Creative Content Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing.',
  'Campaign Agent': 'Multi-channel email/SMS campaign creation, scheduling, and performance tracking.',
  'Lead Agent': 'Lead scoring, pipeline management, and conversion tracking to close more deals.',
  'Outreach Agent': 'Automated outbound sequences and prospect engagement for new business development.',
  'Dispatch Agent': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Real-time arrival estimates and automatic customer notification updates.',
  'Check-In Agent': 'Job progress logging, time tracking, and on-site status updates for field teams.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts.',
  'Social Scheduler Agent': 'Cross-platform scheduling, optimal timing, and auto-publishing across 6 social platforms.',
  'Social Analytics Agent': 'Engagement metrics, audience insights, and growth tracking across all social channels.',
  'Admin Agent': 'User management, company settings, role-based permissions, and access control.',
  'Quoting Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Revenue analytics, profitability reports, and financial trend analysis.',
  'Forecast Agent': 'Demand prediction, seasonal trends, and capacity planning for your business.',
  
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Outreach & Sales Ops Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Social Media Console': 'Unified control center to create, schedule, approve, and post social content across 6 platforms.',
  'Creative & Web Presence Console': 'AI-powered Web Presence builder with chat, voice, and booking integration.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'AI Operatives Hub': 'Central control center for managing and monitoring all AI operatives.',
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers. No external dependencies required.',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Requires ElevenLabs and SignalWire.',
  'Email Reminders': 'Automated email reminders for appointments, follow-ups, and important updates.',
  'SMS Reminders': 'Text message reminders to reduce no-shows and keep customers informed.',
  'Calendar Sync': 'Sync appointments with Google Calendar or any iCal-compatible calendar.',
  'API Access': 'Full API access for custom integrations and automation workflows.',
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
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
      { name: 'Business Size', starter: 'Solo / Small', connect: 'Small teams', performance: 'Growing companies', command: 'Enterprise' },
      { name: 'Use Case', starter: 'Booking & web presence', connect: 'Field service teams', performance: 'Full business mgmt', command: 'Full suite enterprise' },
    ],
  },
  {
    title: 'Smart AI Agents (8 / 12 / 16 / 24)',
    features: [
      { name: 'AI Receptionist (Triage)', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Booking Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Follow-Up Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Review Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Content Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Web Presence Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Lead Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Dispatch Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Route Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'ETA Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Check-In Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Campaign Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Outreach Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Social Scheduler Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Social Analytics Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Admin Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Quoting Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Invoice Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Inventory Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Insights Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Performance Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Revenue Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Forecast Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      
    ],
  },
  {
    title: 'Control Centers (3 / 5 / 5 / 7+)',
    features: [
      { name: 'Customer Portal Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach & Sales Ops Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Business Management Console', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Analytics & Reports Console', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'AI Operatives Hub',
    features: [
      { name: 'AI Operatives Hub', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', starter: 'Unlimited', connect: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', starter: '10 included', connect: '25 included', performance: '50 included', command: 'Unlimited' },
      { name: 'Additional Employees', starter: '$25/10 employees', connect: '$25/10 employees', performance: '$25/10 employees', command: 'Included' },
      { name: 'White-Label Branding', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Smart Link Sharing', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'API Access', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Customer Support', starter: 'check', connect: 'check', performance: 'check', command: 'Priority' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', starter: 'Required', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', starter: 'Optional', connect: 'Optional', performance: 'Optional', command: 'Required' },
      { name: 'SignalWire (SMS & Voice)', starter: 'Limited', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', starter: 'Limited', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'A2P 10DLC Compliance', starter: 'Optional', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Calendar Sync', starter: 'Required', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', starter: 'Optional', connect: 'Optional', performance: 'Required', command: 'Required' },
      { name: 'Tavily (AI Research)', starter: 'Optional', connect: 'Optional', performance: 'Optional', command: 'Optional' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', starter: '$197', connect: '$497', performance: '$997', command: '$1,997' },
      { name: 'Annual Price', starter: '$1,970/year', connect: '$4,970/year', performance: '$9,970/year', command: '$19,970/year' },
      { name: 'Annual Savings', starter: 'Save ~$394', connect: 'Save ~$994', performance: 'Save ~$1,994', command: 'Save ~$3,994' },
      { name: 'Implementation Fee', starter: '$0', connect: '$299', performance: '$599', command: '$999' },
    ],
  },
];

type TierKey = 'starter' | 'connect' | 'performance' | 'command';

const renderValue = (
  value: FeatureValue,
  tier: TierKey,
  featureName: string
) => {
  const tierStyles = {
    starter: {
      base: 'py-2 px-2 text-center bg-teal-500/10 border-x border-teal-400/20',
      check: 'text-teal-400',
      price: 'text-teal-300 font-semibold',
      savings: 'text-teal-400 text-xs',
    },
    connect: {
      base: 'py-2 px-2 text-center bg-sky-600/20 border-x border-sky-400/30',
      check: 'text-emerald-400',
      price: 'text-sky-300 font-semibold',
      savings: 'text-emerald-400 text-xs',
    },
    performance: {
      base: 'py-2 px-2 text-center bg-purple-500/10 border-x border-purple-400/20',
      check: 'text-emerald-400',
      price: 'text-purple-300 font-semibold',
      savings: 'text-emerald-400 text-xs',
    },
    command: {
      base: 'py-2 px-2 text-center bg-amber-500/10 border-x border-amber-400/20',
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
  const isLimited = value === 'Limited';

  let textClass = 'text-white text-xs';
  if (isPricing) textClass = style.price;
  else if (isSavings) textClass = style.savings;
  else if (isAddon) textClass = 'text-amber-400 text-xs';
  else if (isOptional) textClass = 'text-white/70 text-xs';
  else if (isLimited) textClass = 'text-yellow-400/80 text-xs';

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
          <col className="w-[26%]" />
          <col className="w-[18.5%]" />
          <col className="w-[18.5%]" />
          <col className="w-[18.5%]" />
          <col className="w-[18.5%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/20 bg-slate-700/80">
            <th className="text-left py-2.5 px-4 font-semibold text-white text-sm">Feature</th>
            <th className="text-center py-2.5 px-2 font-semibold bg-teal-500/20 border-x border-teal-400/30 text-xs">
              <div className="text-teal-300">Aura Core</div>
              <div className="text-[10px] font-normal text-teal-300/70">$197/mo · 8 agents</div>
            </th>
            <th className="text-center py-2.5 px-2 font-semibold bg-sky-600/40 border-x border-sky-400/50 text-xs">
              <div className="text-sky-300">Aura Boost</div>
              <div className="text-[10px] font-normal text-sky-300/70">$497/mo · 12 agents</div>
            </th>
            <th className="text-center py-2.5 px-2 font-semibold bg-purple-500/20 border-x border-purple-400/30 text-xs">
              <div className="text-purple-300">Aura Pro</div>
              <div className="text-[10px] font-normal text-purple-300/70">$997/mo · 16 agents</div>
            </th>
            <th className="text-center py-2.5 px-2 font-semibold bg-amber-500/20 border-x border-amber-400/30 text-xs">
              <div className="text-amber-300">Aura Elite</div>
              <div className="text-[10px] font-normal text-amber-300/70">$1,997/mo · 24</div>
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
                  {hasNumbers && numbers.length === 4 ? (
                    <>
                      <td className="py-1.5 px-4 font-semibold text-sky-300">{titleText}</td>
                      <td className="py-1.5 px-2 text-center font-semibold text-teal-300/80 text-xs">{numbers[0]}</td>
                      <td className="py-1.5 px-2 text-center font-semibold text-sky-300/80 text-xs">{numbers[1]}</td>
                      <td className="py-1.5 px-2 text-center font-semibold text-purple-300/80 text-xs">{numbers[2]}</td>
                      <td className="py-1.5 px-2 text-center font-semibold text-amber-300/80 text-xs">{numbers[3]}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="py-1.5 px-4 font-semibold text-sky-300">
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
                      {renderValue(feature.starter, 'starter', feature.name)}
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
