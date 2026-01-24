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
  
  // AI Agents - Command adds (13 more = 23 total)
  'Admin Agent': 'User management, company settings, and access control.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Warranty Agent': 'Manages warranty claims, tracks coverage periods, and automates claim processing.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Promo Agent': 'Manages promotional codes, discounts, and special offers across channels.',
  'Social Media Signal Agent': 'AI-powered content creation for all social platforms.',
  'Signal Scheduler': 'Automated post scheduling across 6 platforms.',
  'Signal Analytics': 'Engagement metrics and performance tracking.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  
  // Summary
  'All 23 AI Agents': 'Full access to all 23 specialized AI agents for complete business automation.',
  
  // Control Centers
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Marketing & Sales Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Social Media Signal Console': 'Unified dashboard to manage all your social media accounts and content calendar.',
  'Web Presence Console': 'AI-powered Web Presence builder with chat, voice, and booking integration.',
  'All 7 Control Centers': 'Full access to all 7 specialized control consoles.',
  
  // Communication Channels - Chat vs Voice distinction
  'Talk to Aura (Text-Based)': 'Text-based chat interface using keyboard input. Available on ALL tiers including Core. No external dependencies required (no ElevenLabs or Twilio needed). Customers type questions and receive text responses.',
  'Proxy Voice Chat (Chat & Outbound)': 'Speech-based AI conversations using microphone and speakers. Available on Single-Point and above. Requires ElevenLabs for natural voice synthesis and Twilio for telephony. Different from Talk to Aura text chat.',
  'Email Reminders': 'Automated email reminders for appointments, follow-ups, and important updates.',
  'SMS Reminders': 'Text message reminders to reduce no-shows and keep customers informed.',
  
  // 3rd Party Integrations - Clarify voice-only requirements
  'ElevenLabs (Proxy Voice Chat)': 'Required for Proxy Voice Chat features only (speech-based conversations). NOT required for Talk to Aura text chat which works on all tiers without any external dependencies.',
  'Twilio (SMS & Voice)': 'Required for SMS reminders and Proxy Voice Chat calls. NOT required for Talk to Aura text chat.',
  
  // Platform features
  'Calendar Sync': 'Sync appointments with Google Calendar or any iCal-compatible calendar.',
  'CRM Integration': 'Connect with popular CRM systems to keep customer data synchronized.',
  'API Access': 'Full API access for custom integrations and automation workflows.',
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  core: FeatureValue;
  halo: FeatureValue;
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
    title: 'AI Agents (0 / 3 / 3 / 10 / 23)',
    features: [
      // Single-Point tier (3 agents) - Halo has triage, booking, followup
      { name: 'AI Receptionist (Triage)', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Follow-up Agent', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Review Agent', core: 'x', halo: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      // Multi-Track tier adds (7 more = 10 total) - Halo has booking
      { name: 'Scheduling Agent (Booking)', core: 'x', halo: 'check', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Dispatch Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Route Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'ETA Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Check-in Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Quote Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Invoice Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      // Command tier adds (13 more = 23 total)
      { name: 'Admin Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Inventory Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Warranty Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Campaign Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Lead Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Promo Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Social Media Signal Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Signal Scheduler', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Signal Analytics', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Performance Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Revenue Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Insights Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Forecast Agent', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (0 / 1 / 1 / 2 / 7)',
    features: [
      { name: 'Customer Portal Console', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Field Operations Console', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Business Management Console', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Marketing & Sales Console', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Analytics & Reports Console', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Social Media Signal Console', core: 'check', halo: 'x', singlePoint: 'Add-on', multiTrack: 'check', command: 'check' },
      { name: 'Web Presence Console', core: 'check', halo: 'x', singlePoint: 'Add-on', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Talk to Aura (Text-Based)', core: 'check', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Proxy Voice Chat (Chat & Outbound)', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Email Reminders', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'SMS Reminders', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', core: 'x', halo: 'Unlimited', singlePoint: 'Unlimited', multiTrack: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', core: '2 included', halo: '2 included', singlePoint: '5 included', multiTrack: '10 included', command: '25 included' },
      { name: 'Additional Employees', core: '$10/employee', halo: '$10/employee', singlePoint: '$10/employee', multiTrack: '$10/employee', command: '$10/employee' },
      { name: 'White-Label Branding', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Web Presence', core: 'check', halo: 'x', singlePoint: 'Choice of 1', multiTrack: 'check', command: 'check' },
      { name: 'Social Media Signal', core: 'check', halo: 'x', singlePoint: 'Choice of 1', multiTrack: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', core: 'check', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', core: 'x', halo: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'CRM Integration', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'API Access', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Priority Support', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Dedicated Account Manager', core: 'x', halo: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', core: 'x', halo: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', core: 'x', halo: 'x', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Twilio (SMS & Voice)', core: 'x', halo: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Proxy Voice Chat)', core: 'x', halo: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Calendar Sync', core: 'x', halo: 'Optional', singlePoint: 'Optional', multiTrack: 'Optional', command: 'Optional' },
      { name: 'Social Media Accounts', core: 'Required', halo: 'x', singlePoint: 'Optional', multiTrack: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', core: '$500', halo: '$397', singlePoint: '$1,500', multiTrack: '$3,997', command: '$6,997' },
      { name: 'Annual Price', core: '$5,000/year', halo: '$3,970/year', singlePoint: '$15,000/year', multiTrack: '$39,970/year', command: '$69,970/year' },
      { name: 'Annual Savings', core: 'Save $1,000', halo: 'Save $794', singlePoint: 'Save $3,000', multiTrack: 'Save $7,994', command: 'Save $13,994' },
    ],
  },
];

const renderValue = (value: FeatureValue, isHighlighted: boolean, featureName: string, isHalo: boolean = false) => {
  let baseClass = 'py-2 px-3 text-center';
  
  if (isHighlighted) {
    baseClass = 'py-2 px-3 text-center bg-sky-600/20 border-x border-sky-400/30';
  } else if (isHalo) {
    baseClass = 'py-2 px-3 text-center bg-rose-500/10 border-x border-rose-400/20';
  }

  if (value === 'check') {
    const checkColor = isHalo ? 'text-rose-400' : 'text-emerald-400';
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
    } else if (isHighlighted) {
      textClass = 'text-sky-300 font-semibold';
    } else {
      textClass = 'text-white font-semibold';
    }
  } else if (isSavings) {
    textClass = isHalo ? 'text-rose-400 text-xs' : 'text-emerald-400 text-xs';
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
          <col className="w-[26%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/20 bg-slate-700/80">
            <th className="text-left py-2.5 px-4 font-semibold text-white text-sm">Feature</th>
            <th className="text-center py-2.5 px-3 font-semibold bg-rose-500/20 border-x border-rose-400/30 text-sm">
              <div className="text-rose-300">Aura Halo</div>
              <div className="text-xs font-normal text-rose-300/70">$397/mo</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Core</div>
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
            <th className="text-center py-2.5 px-3 font-semibold text-white text-sm">
              <div>Command</div>
              <div className="text-xs font-normal text-white/70">$6,997/mo</div>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sections.map((section) => (
            <>
              {/* Section Header */}
              <tr key={`section-${section.title}`} className="bg-slate-700/60">
                <td colSpan={6} className="py-1.5 px-4 font-semibold text-sky-300">
                  {section.title}
                </td>
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
          ))}
        </tbody>
      </table>
    </TooltipProvider>
  );
};
