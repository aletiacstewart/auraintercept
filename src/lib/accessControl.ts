// Access control helpers for restricting sections based on user role and job types

export type UserRole = 'platform_admin' | 'company_admin' | 'employee' | 'customer';
export type JobType = 'technician' | 'booking_agent' | 'dispatch' | 'customer_service' | 'manager' | 'billing' | 'marketing' | 'inventory' | 'analytics';

// Job types that grant full company access (similar to company_admin)
const FULL_ACCESS_JOB_TYPES: JobType[] = ['manager', 'customer_service'];

/**
 * Check if a user has full access to all company features
 * Platform admins, company admins, and employees with manager/customer_service roles have full access
 */
export function hasFullAccess(
  userRole: string | null,
  jobTypes: string[] = []
): boolean {
  // Platform admin and company admin always have full access
  if (userRole === 'platform_admin' || userRole === 'company_admin') {
    return true;
  }
  
  // Employees with manager or customer_service roles have full access
  if (userRole === 'employee') {
    return jobTypes.some(jt => FULL_ACCESS_JOB_TYPES.includes(jt as JobType));
  }
  
  return false;
}

/**
 * Check if user can access the AI Agent Hub
 * Only platform_admin, company_admin, and employees with full access
 */
export function canAccessAIAgentHub(userRole: string | null, jobTypes: string[] = []): boolean {
  return hasFullAccess(userRole, jobTypes);
}

/**
 * Check if user can access Configuration section
 * Only platform_admin, company_admin, and employees with full access
 */
export function canAccessConfiguration(userRole: string | null, jobTypes: string[] = []): boolean {
  return hasFullAccess(userRole, jobTypes);
}

/**
 * Check if user can access 3rd Party Integrations section
 * Only platform_admin, company_admin, and employees with full access
 */
export function canAccessIntegrations(userRole: string | null, jobTypes: string[] = []): boolean {
  return hasFullAccess(userRole, jobTypes);
}

/**
 * Check if user can manage AI agents (toggle on/off, change settings)
 * Only platform_admin and company_admin can manage agents
 */
export function canManageAIAgents(userRole: string | null): boolean {
  return userRole === 'platform_admin' || userRole === 'company_admin';
}

/**
 * Check if user can access a specific navigation section
 */
export function canAccessNavSection(
  sectionLabel: string,
  userRole: string | null,
  jobTypes: string[] = []
): boolean {
  const restrictedSections = ['Configuration', '3rd Party Integrations'];
  
  if (restrictedSections.includes(sectionLabel)) {
    return hasFullAccess(userRole, jobTypes);
  }
  
  return true; // Allow access to non-restricted sections
}

/**
 * Filter navigation groups based on user access
 */
export function filterNavGroupsByAccess(
  navGroups: Array<{ label: string; items: any[] }>,
  userRole: string | null,
  jobTypes: string[] = []
): Array<{ label: string; items: any[] }> {
  return navGroups.filter(group => canAccessNavSection(group.label, userRole, jobTypes));
}
