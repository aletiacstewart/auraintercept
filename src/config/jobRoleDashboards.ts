// Job role to dashboard configuration mapping
export type JobRoleType =
  | 'technician'
  | 'booking_agent'
  | 'dispatch'
  | 'marketing_manager'
  | 'sales_rep'
  | 'customer_service'
  | 'inventory_manager'
  | 'billing_specialist'
  | 'compliance_officer'
  | 'analytics_manager';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export interface JobRoleConfig {
  title: string;
  description: string;
  agents: string[];
  navItems: NavItem[];
  quickActions: string[];
}

/**
 * Canonical role dashboard “home” routes.
 * (Used by RoleDashboardLayout role switcher to avoid string replace bugs)
 */
export const JOB_ROLE_ROUTES: Record<JobRoleType, string> = {
  technician: '/dashboard/technician',
  booking_agent: '/dashboard/booking-agent',
  dispatch: '/dashboard/dispatch',
  marketing_manager: '/dashboard/marketing',
  sales_rep: '/dashboard/sales',
  customer_service: '/dashboard/customer-service',
  inventory_manager: '/dashboard/inventory-manager',
  billing_specialist: '/dashboard/billing',
  compliance_officer: '/dashboard/compliance',
  analytics_manager: '/dashboard/analytics-manager',
};

export const JOB_ROLE_CONFIGS: Record<JobRoleType, JobRoleConfig> = {
  technician: {
    title: 'Technician Dashboard',
    description: 'Field operations and job management',
    agents: ['dispatch', 'route', 'eta', 'checkin', 'inventory'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/technician' },
      { label: 'Job Queue', icon: 'ClipboardList', path: '/dashboard/technician/jobs' },
      { label: 'My Calendar', icon: 'Calendar', path: '/dashboard/appointments' },
      { label: 'Availability', icon: 'Clock', path: '/dashboard/availability' },
      { label: 'Inventory', icon: 'Package', path: '/dashboard/inventory' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Messages', icon: 'MessageSquare', path: '/dashboard/messages' },
    ],
    quickActions: ['accept_job', 'directions', 'en_route', 'check_in', 'complete'],
  },
  booking_agent: {
    title: 'Booking Agent Dashboard',
    description: 'Appointment scheduling and customer engagement',
    agents: ['triage', 'booking', 'followup', 'review'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/booking-agent' },
      { label: 'Appointments', icon: 'Calendar', path: '/dashboard/appointments' },
      { label: 'Customer Queue', icon: 'Users', path: '/dashboard/booking-agent/queue' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Call History', icon: 'Phone', path: '/dashboard/calls' },
      { label: 'Messages', icon: 'MessageSquare', path: '/dashboard/messages' },
    ],
    quickActions: ['book_appointment', 'reschedule', 'cancel', 'follow_up'],
  },
  dispatch: {
    title: 'Dispatch Dashboard',
    description: 'Technician assignment and routing',
    agents: ['dispatch', 'route', 'eta'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/dispatch' },
      { label: 'Live Map', icon: 'Map', path: '/dashboard/dispatch/map' },
      { label: 'Job Assignments', icon: 'ClipboardList', path: '/dashboard/dispatch/assignments' },
      { label: 'Technicians', icon: 'Users', path: '/dashboard/employees' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    ],
    quickActions: ['assign_tech', 'update_eta', 'reroute', 'emergency_dispatch'],
  },
  marketing_manager: {
    title: 'Marketing Dashboard',
    description: 'Campaigns and customer growth',
    agents: ['promo', 'referral', 'winback', 'seasonal'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/marketing' },
      { label: 'Campaigns', icon: 'Megaphone', path: '/dashboard/campaigns' },
      { label: 'Referrals', icon: 'Gift', path: '/dashboard/referrals' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
      { label: 'Messages', icon: 'MessageSquare', path: '/dashboard/messages' },
    ],
    quickActions: ['create_campaign', 'send_promo', 'winback_customer', 'referral_invite'],
  },
  sales_rep: {
    title: 'Sales Dashboard',
    description: 'Quotes and customer conversion',
    agents: ['quoting', 'followup', 'promo'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/sales' },
      { label: 'Quotes', icon: 'FileText', path: '/dashboard/quotes' },
      { label: 'Leads', icon: 'UserPlus', path: '/dashboard/sales/leads' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Call History', icon: 'Phone', path: '/dashboard/calls' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    ],
    quickActions: ['create_quote', 'follow_up_lead', 'send_proposal', 'close_deal'],
  },
  customer_service: {
    title: 'Customer Service Dashboard',
    description: 'Customer support and issue resolution',
    agents: ['triage', 'booking', 'followup', 'review', 'warranty'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/customer-service' },
      { label: 'Support Queue', icon: 'Inbox', path: '/dashboard/customer-service/queue' },
      { label: 'Appointments', icon: 'Calendar', path: '/dashboard/appointments' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Call History', icon: 'Phone', path: '/dashboard/calls' },
      { label: 'Messages', icon: 'MessageSquare', path: '/dashboard/messages' },
    ],
    quickActions: ['respond_ticket', 'escalate', 'schedule_callback', 'resolve'],
  },
  inventory_manager: {
    title: 'Inventory Dashboard',
    description: 'Stock management and ordering',
    agents: ['inventory'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/inventory-manager' },
      { label: 'Inventory', icon: 'Package', path: '/dashboard/inventory' },
      { label: 'Orders', icon: 'ShoppingCart', path: '/dashboard/inventory-manager/orders' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    ],
    quickActions: ['check_stock', 'reorder', 'transfer_parts', 'audit'],
  },
  billing_specialist: {
    title: 'Billing Dashboard',
    description: 'Invoicing and payment management',
    agents: ['invoice', 'quoting', 'followup', 'insights', 'forecast'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/billing' },
      { label: 'Invoices', icon: 'Receipt', path: '/dashboard/invoices' },
      { label: 'Quotes', icon: 'FileText', path: '/dashboard/quotes' },
      { label: 'Reports', icon: 'TrendingUp', path: '/dashboard/billing/reports' },
      { label: 'Billing AI Console', icon: 'Bot', path: '/dashboard/billing/ai-console' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    ],
    quickActions: ['create_invoice', 'send_reminder', 'process_payment', 'refund', 'revenue_report', 'payment_forecast', 'overdue_followup'],
  },
  compliance_officer: {
    title: 'Compliance Dashboard',
    description: 'Warranties and regulatory compliance',
    agents: ['warranty', 'insights'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/compliance' },
      { label: 'Warranties', icon: 'Shield', path: '/dashboard/warranties' },
      { label: 'Reports', icon: 'FileCheck', path: '/dashboard/compliance/reports' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
    ],
    quickActions: ['check_warranty', 'generate_report', 'flag_issue', 'audit_log'],
  },
  analytics_manager: {
    title: 'Analytics Dashboard',
    description: 'Business intelligence and forecasting',
    agents: ['insights', 'forecast'],
    navItems: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/dashboard/analytics-manager' },
      { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
      { label: 'Reports', icon: 'FileBarChart', path: '/dashboard/analytics-manager/reports' },
      { label: 'AI Console', icon: 'Bot', path: '/dashboard/ai-agent' },
      { label: 'Forecasts', icon: 'TrendingUp', path: '/dashboard/analytics-manager/forecasts' },
    ],
    quickActions: ['generate_report', 'run_forecast', 'export_data', 'schedule_report'],
  },
};

// Map job types to agent categories for filtering
export const JOB_TYPE_TO_AGENT_CATEGORIES: Record<JobRoleType, string[]> = {
  technician: ['field_operations', 'business_operations'],
  booking_agent: ['customer_engagement'],
  dispatch: ['field_operations'],
  marketing_manager: ['marketing_sales'],
  sales_rep: ['customer_engagement', 'business_operations', 'marketing_sales'],
  customer_service: ['customer_engagement', 'business_operations'],
  inventory_manager: ['business_operations'],
  billing_specialist: ['business_operations', 'analytics', 'customer_engagement'],
  compliance_officer: ['business_operations', 'analytics'],
  analytics_manager: ['analytics'],
};
