/**
 * Single source of truth for the dashboard menu.
 *
 * `NAVIGATION_BY_ROLE` gives each role its own, deliberately short list of
 * groups. The extra fields on each item (requiredTier, requiredJobTypes,
 * featureColor, tourId) keep the existing smart hiding working: plan level,
 * employee job role, industry pack and company profile still decide what is
 * actually rendered — that filtering lives in `DashboardSidebar`.
 */
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Bot,
  Puzzle,
  FileText,
  BarChart3,
  Crown,
  Megaphone,
  HeadphonesIcon,
  Truck,
  Briefcase,
  Map,
  HelpCircle,
  Clock,
  ClipboardList,
  History,
  User,
  BookOpen,
  Globe,
  Share2,
  Target,
  CreditCard,
  Kanban,
  Home,
  Smartphone,
  Key,
  Flag,
  Activity,
  Package,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import type { SubscriptionTier } from '@/lib/subscriptionAgentConfig';
import type { FeatureKey } from '@/lib/industryConfig';

export type NavRole = 'platform_admin' | 'company_admin' | 'employee' | 'technician' | 'customer';

export interface NavSubItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

export interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  requiredJobTypes?: string[];
  external?: boolean;
  featureColor?: string;
  requiredTier?: SubscriptionTier;
  /**
   * Business-type gate. When set, the item only appears if the company's
   * industry pack lists this feature. Core items (dashboard, agents, settings,
   * connections, team, billing, help) deliberately carry no gate.
   */
  requiredFeature?: FeatureKey;
  tourId?: string;
  submenu?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  requiredTier?: SubscriptionTier;
}

/** Sections hidden from employees without full access (manager / customer service). */
export const RESTRICTED_SECTIONS = ['Configuration', 'Integrations', 'Admin'];

const COMPANY_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', featureColor: 'text-feature-overview', tourId: 'nav-dashboard' },
      { label: 'Agents', icon: Bot, href: '/dashboard/ai-agents', featureColor: 'text-feature-config', tourId: 'nav-ai-operatives' },
      { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', featureColor: 'text-feature-platform', requiredTier: 'command', tourId: 'nav-analytics-reports' },
    ],
  },
  {
    label: 'Customers',
    requiredTier: 'starter',
    items: [
      { label: 'Scheduling', icon: Calendar, href: '/dashboard/appointments', featureColor: 'text-feature-appointments', requiredTier: 'starter', requiredFeature: 'scheduling', tourId: 'nav-my-schedule' },
      { label: 'Leads', icon: Target, href: '/dashboard/leads', featureColor: 'text-feature-customers', requiredTier: 'starter', requiredFeature: 'marketing', tourId: 'nav-leads' },
      { label: 'Customer Portal', icon: HeadphonesIcon, href: '/dashboard/ai-consoles/customer-portal', requiredJobTypes: ['customer_service', 'booking_agent', 'dispatch'], featureColor: 'text-feature-customers', requiredTier: 'starter', requiredFeature: 'customer_portal', tourId: 'nav-customer-portal' },
      { label: 'Customer Website App', icon: Globe, href: '/dashboard/customer-website-app', featureColor: 'text-feature-customers', requiredTier: 'starter', requiredFeature: 'customer_portal', tourId: 'nav-customer-website-app' },
    ],
  },
  {
    label: 'Operations',
    requiredTier: 'connect',
    items: [
      { label: 'Technician View', icon: Truck, href: '/dashboard/ai-consoles/field-ops', requiredJobTypes: ['technician', 'dispatch'], featureColor: 'text-feature-fieldops', requiredTier: 'connect', requiredFeature: 'field_ops', tourId: 'nav-field-ops' },
      { label: 'Dispatch View', icon: Map, href: '/dashboard/dispatch-field-ops', featureColor: 'text-feature-fieldops', requiredTier: 'connect', requiredFeature: 'field_ops', tourId: 'nav-dispatch-ops' },
    ],
  },
  {
    label: 'Business',
    requiredTier: 'performance',
    items: [
      { label: 'Business Management', icon: Briefcase, href: '/dashboard/ai-consoles/business-mgt-ops', requiredJobTypes: ['billing_specialist'], featureColor: 'text-feature-platform', requiredTier: 'performance', requiredFeature: 'invoicing', tourId: 'nav-business-mgt-ops' },
      { label: 'Pipeline', icon: Kanban, href: '/dashboard/pipeline', featureColor: 'text-feature-platform', requiredTier: 'performance', requiredFeature: 'marketing' },
    ],
  },
  {
    label: 'Marketing',
    requiredTier: 'starter',
    items: [
      { label: 'Outreach & Sales', icon: Megaphone, href: '/dashboard/ai-consoles/marketing-sales', featureColor: 'text-feature-platform', requiredTier: 'starter', requiredFeature: 'marketing', tourId: 'nav-marketing-sales' },
      { label: 'Social Media', icon: Share2, href: '/dashboard/ai-consoles/social-media', featureColor: 'text-feature-platform', requiredTier: 'connect', requiredFeature: 'marketing', tourId: 'nav-social-media' },
      { label: 'Website', icon: Globe, href: '/dashboard/smart-website', featureColor: 'text-feature-platform', requiredTier: 'starter', tourId: 'nav-web-presence' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Knowledge Base', icon: BookOpen, href: '/dashboard/knowledge', featureColor: 'text-feature-config', tourId: 'nav-knowledge-base' },
      { label: 'Automation', icon: Bot, href: '/dashboard/automation', featureColor: 'text-feature-config' },
      { label: 'Settings', icon: Settings, href: '/dashboard/quick-setup', featureColor: 'text-feature-config', tourId: 'nav-quick-setup' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Connections', icon: Puzzle, href: '/dashboard/integrations', featureColor: 'text-feature-integrations', tourId: 'nav-integrations-overview' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Team', icon: Users, href: '/dashboard/employees', featureColor: 'text-feature-employees', tourId: 'nav-team' },
      { label: 'Billing', icon: CreditCard, href: '/dashboard/subscription', featureColor: 'text-feature-overview', tourId: 'nav-subscription' },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', featureColor: 'text-feature-overview', tourId: 'nav-help' },
    ],
  },
];

const PLATFORM_GROUPS: NavGroup[] = [
  ...COMPANY_GROUPS,
  {
    label: 'Platform',
    items: [
      { label: 'Companies', icon: Building2, href: '/dashboard/companies', featureColor: 'text-feature-platform' },
      { label: 'Subscription Analytics', icon: Crown, href: '/dashboard/subscription-analytics', featureColor: 'text-feature-overview', tourId: 'nav-subscription-analytics' },
      { label: 'Live Demo Superadmin', icon: User, href: '/dashboard/super-switcher', featureColor: 'text-feature-overview' },
      { label: 'Platform Guides', icon: FileText, href: '/dashboard/platform-guides', featureColor: 'text-feature-overview', tourId: 'nav-platform-guides' },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Admin',
        icon: Key,
        href: '/dashboard/admin',
        featureColor: 'text-feature-config',
        tourId: 'nav-admin',
        submenu: [
          { label: 'Industry Packs', href: '/dashboard/admin/industry-packs', icon: Package },
          { label: 'Feature Flags', href: '/dashboard/admin/feature-flags', icon: Flag },
          { label: 'System Health', href: '/dashboard/admin/system-health', icon: Activity },
        ],
      },
    ],
  },
];

const EMPLOYEE_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', featureColor: 'text-feature-overview', tourId: 'nav-dashboard' },
      { label: 'My Schedule', icon: Calendar, href: '/dashboard/appointments', tourId: 'nav-my-schedule' },
      { label: 'Jobs', icon: ClipboardList, href: '/technician/jobs', tourId: 'nav-my-jobs' },
      { label: 'Messages', icon: MessageSquare, href: '/dashboard/messages', tourId: 'nav-messages' },
      { label: 'Profile', icon: User, href: '/technician/profile', tourId: 'nav-tech-profile' },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'AI Console', icon: Bot, href: '/technician/ai-console', tourId: 'nav-tech-ai-console' },
      { label: 'Calendar', icon: Calendar, href: '/technician/calendar', tourId: 'nav-tech-calendar' },
      { label: 'Job History', icon: History, href: '/technician/history', tourId: 'nav-job-history' },
      { label: 'Availability', icon: Clock, href: '/technician/availability', tourId: 'nav-availability' },
      { label: 'Customer Portal', icon: HeadphonesIcon, href: '/dashboard/ai-consoles/customer-portal', requiredJobTypes: ['customer_service', 'booking_agent', 'dispatch'], featureColor: 'text-feature-customers' },
      { label: 'Technician View', icon: Truck, href: '/dashboard/ai-consoles/field-ops', requiredJobTypes: ['technician', 'dispatch'], featureColor: 'text-feature-fieldops' },
      { label: 'Install App', icon: Puzzle, href: '/technician/install', tourId: 'nav-tech-install' },
      { label: 'Help', icon: HelpCircle, href: '/dashboard/help', featureColor: 'text-feature-overview', tourId: 'nav-help' },
    ],
  },
];

const TECHNICIAN_GROUPS: NavGroup[] = [
  {
    label: 'Field',
    items: [
      { label: 'Dashboard', icon: Home, href: '/technician' },
      { label: 'My Jobs', icon: ClipboardList, href: '/technician/jobs' },
      { label: 'AI Console', icon: Bot, href: '/technician/ai-console' },
      { label: 'Calendar', icon: Calendar, href: '/technician/calendar' },
      { label: 'Job History', icon: History, href: '/technician/history' },
      { label: 'Schedule', icon: Clock, href: '/technician/availability' },
      { label: 'Messages', icon: MessageSquare, href: '/dashboard/messages' },
      { label: 'Profile', icon: User, href: '/technician/profile' },
      { label: 'Install App', icon: Smartphone, href: '/technician/install' },
    ],
  },
];

const CUSTOMER_GROUPS: NavGroup[] = [
  {
    label: 'Portal',
    items: [
      { label: 'Book', icon: Calendar, href: '/customer-portal' },
      { label: 'My Appointments', icon: CheckCircle2, href: '/customer-portal?tab=appointments' },
      { label: 'Invoices', icon: Receipt, href: '/customer-portal?tab=invoices' },
      { label: 'Support', icon: MessageSquare, href: '/customer-portal?tab=support' },
    ],
  },
];

export const NAVIGATION_BY_ROLE: Record<NavRole, NavGroup[]> = {
  platform_admin: PLATFORM_GROUPS,
  company_admin: COMPANY_GROUPS,
  employee: EMPLOYEE_GROUPS,
  technician: TECHNICIAN_GROUPS,
  customer: CUSTOMER_GROUPS,
};

/** Flat lookup used for page titles and tour anchoring. */
export function findNavItemByHref(href: string): NavItem | undefined {
  for (const groups of Object.values(NAVIGATION_BY_ROLE)) {
    for (const group of groups) {
      for (const item of group.items) {
        if (item.href === href) return item;
      }
    }
  }
  return undefined;
}
