import {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Target,
  Clock,
  Calendar,
  Home,
  Scissors,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface AuraSuggestion {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
}

const GENERIC: AuraSuggestion[] = [
  { id: 'revenue',     label: 'What is my total revenue this month?',         icon: DollarSign, category: 'Revenue' },
  { id: 'forecast',    label: 'What is my projected revenue next month?',     icon: TrendingUp, category: 'Forecast' },
  { id: 'performance', label: 'Who are my top performing team members?',      icon: Users,      category: 'Performance' },
  { id: 'kpi',         label: 'Show me my key performance metrics',           icon: Target,     category: 'KPIs' },
  { id: 'comparison',  label: 'Compare this month to last month',             icon: BarChart3,  category: 'Comparison' },
  { id: 'trends',      label: 'What trends should I be aware of?',            icon: Clock,      category: 'Insights' },
];

const BY_CLUSTER: Partial<Record<IndustryPack['cluster'], AuraSuggestion[]>> = {
  trades: [
    { id: 'today_jobs',  label: "Show me today's jobs and dispatch",           icon: Calendar,   category: 'Today' },
    { id: 'overdue',     label: 'Which invoices are overdue?',                 icon: DollarSign, category: 'Billing' },
    { id: 'top_tech',    label: 'Who is my top-performing technician?',        icon: Users,      category: 'Performance' },
    { id: 'revenue',     label: "What is this week's revenue?",                icon: TrendingUp, category: 'Revenue' },
    { id: 'parts',       label: 'Which parts are running low?',                icon: BarChart3,  category: 'Inventory' },
    { id: 'callbacks',   label: 'Any callbacks or repeat issues this month?',  icon: Clock,      category: 'Quality' },
  ],
  outdoor: [
    { id: 'today_route', label: "What's today's route?",                       icon: Calendar,   category: 'Today' },
    { id: 'weather',     label: 'Any weather-impacted stops to reschedule?',   icon: Clock,      category: 'Today' },
    { id: 'overdue',     label: 'Which invoices are overdue?',                 icon: DollarSign, category: 'Billing' },
    { id: 'top_crew',    label: 'Who is my top-performing crew?',              icon: Users,      category: 'Performance' },
    { id: 'recurring',   label: 'How many recurring stops this week?',         icon: TrendingUp, category: 'Recurring' },
    { id: 'revenue',     label: "Show me this week's revenue",                 icon: BarChart3,  category: 'Revenue' },
  ],
  repair: [
    { id: 'queue',       label: "What's in today's repair queue?",             icon: Calendar,   category: 'Today' },
    { id: 'parts',       label: 'Which parts are back-ordered?',               icon: BarChart3,  category: 'Inventory' },
    { id: 'turnaround',  label: 'What is my average turnaround time?',         icon: Clock,      category: 'Performance' },
    { id: 'top_tech',    label: 'Who is my top-performing technician?',        icon: Users,      category: 'Performance' },
    { id: 'overdue',     label: 'Which invoices are overdue?',                 icon: DollarSign, category: 'Billing' },
    { id: 'revenue',     label: "Show me this week's revenue",                 icon: TrendingUp, category: 'Revenue' },
  ],
  booking: [
    { id: 'today_appts', label: "What's on today's calendar?",                 icon: Calendar,   category: 'Today' },
    { id: 'no_shows',    label: 'How many no-shows this week?',                icon: Clock,      category: 'Quality' },
    { id: 'top_member',  label: 'Who is my top-performing team member?',       icon: Users,      category: 'Performance' },
    { id: 'revenue',     label: "Show me this week's revenue",                 icon: DollarSign, category: 'Revenue' },
    { id: 'forecast',    label: 'What does next week look like?',              icon: TrendingUp, category: 'Forecast' },
    { id: 'trends',      label: 'Any booking trends I should know?',           icon: BarChart3,  category: 'Insights' },
  ],
};

const BY_INDUSTRY: Record<string, AuraSuggestion[]> = {
  real_estate: [
    { id: 'showings',    label: "What showings are booked today?",             icon: Home,       category: 'Today' },
    { id: 'listings',    label: 'How are my active listings performing?',      icon: BarChart3,  category: 'Listings' },
    { id: 'pipeline',    label: 'Show me my buyer pipeline',                   icon: Users,      category: 'Pipeline' },
    { id: 'commission',  label: "What are this month's commissions?",          icon: DollarSign, category: 'Revenue' },
    { id: 'top_agent',   label: 'Who is my top-performing agent?',             icon: TrendingUp, category: 'Performance' },
    { id: 'leads',       label: 'Any new buyer/seller leads to follow up?',    icon: Clock,      category: 'Leads' },
  ],
  salon: [
    { id: 'today_chair', label: "What's today's chair schedule?",              icon: Scissors,   category: 'Today' },
    { id: 'rebookings',  label: 'How is my rebooking rate?',                   icon: TrendingUp, category: 'Retention' },
    { id: 'top_stylist', label: 'Who is my top-performing stylist?',           icon: Users,      category: 'Performance' },
    { id: 'revenue',     label: "Show me this week's revenue",                 icon: DollarSign, category: 'Revenue' },
    { id: 'no_shows',    label: 'How many no-shows this week?',                icon: Clock,      category: 'Quality' },
    { id: 'services',    label: 'Which services are most popular?',            icon: BarChart3,  category: 'Insights' },
  ],
  restaurants: [
    { id: 'covers',      label: "What's tonight's reservation count?",         icon: Utensils,   category: 'Today' },
    { id: 'avg_ticket',  label: 'What is my average ticket this week?',        icon: DollarSign, category: 'Revenue' },
    { id: 'no_shows',    label: 'How many no-shows this week?',                icon: Clock,      category: 'Quality' },
    { id: 'top_server',  label: 'Who is my top-performing server?',            icon: Users,      category: 'Performance' },
    { id: 'menu',        label: 'Which menu items are top sellers?',           icon: BarChart3,  category: 'Menu' },
    { id: 'forecast',    label: 'What does next weekend look like?',           icon: TrendingUp, category: 'Forecast' },
  ],
  fitness: [
    { id: 'classes',     label: "What's today's class schedule?",              icon: Calendar,   category: 'Today' },
    { id: 'attendance',  label: 'How is my class attendance trending?',        icon: TrendingUp, category: 'Attendance' },
    { id: 'top_trainer', label: 'Who is my top-performing trainer?',           icon: Users,      category: 'Performance' },
    { id: 'churn',       label: 'How is my member churn this month?',          icon: Clock,      category: 'Retention' },
    { id: 'revenue',     label: "Show me this month's revenue",                icon: DollarSign, category: 'Revenue' },
    { id: 'popular',     label: 'Which classes are most popular?',             icon: BarChart3,  category: 'Insights' },
  ],
};

export function getIndustryAuraSuggestions(
  pack: IndustryPack | null | undefined,
): AuraSuggestion[] {
  if (!pack) return GENERIC;
  return (
    BY_INDUSTRY[pack.industry_id] ??
    BY_CLUSTER[pack.cluster] ??
    GENERIC
  );
}

export const GENERIC_AURA_SUGGESTIONS = GENERIC;