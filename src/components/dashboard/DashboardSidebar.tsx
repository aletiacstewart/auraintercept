import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { navItemAllowedByProfile } from '@/lib/profileConsoleMap';
import { getNavLabels, getPageHeader } from '@/lib/industryNavLabels';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';
import { isNavHrefHiddenForIndustry } from '@/lib/industryNavVisibility';
import {
  NAVIGATION_BY_ROLE,
  RESTRICTED_SECTIONS,
  type NavGroup,
  type NavItem,
  type NavRole,
} from '@/lib/navigationConfig';

const GLOW_MAP: Record<string, string> = {
  'text-feature-overview': '189,100%,65%',
  'text-feature-config': '221,100%,65%',
  'text-feature-platform': '189,100%,55%',
  'text-feature-fieldops': '84,100%,55%',
  'text-feature-customers': '38,100%,65%',
  'text-feature-employees': '173,100%,55%',
  'text-feature-analytics': '223,100%,65%',
  'text-feature-marketing': '292,100%,70%',
  'text-feature-integrations': '282,80%,70%',
};

/**
 * Role-based sidebar menu.
 *
 * The per-role lists live in `src/lib/navigationConfig.ts`. Everything that
 * decides whether an entry is actually visible — plan tier, employee job
 * role, company profile spec, industry pack overrides — is applied here so
 * the config file stays plain data.
 */
export function DashboardSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();
  const { subscriptionTier, isAtLeastTier } = useSubscription();
  const { jobTypes, hasJobType } = useEmployeeJobRole();
  const { pack: industryPack } = useIndustryPack();
  const {
    loading: industryLoading,
    label: industryLabel,
    isFeatureEnabled,
  } = useIndustryConfig();
  const { workspace } = useWorkspace();
  const { spec: profileSpec } = useCompanyProfile();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const navLabels = getNavLabels(industryPack);
  const serviceConfig = getIndustryServiceConsoleConfig(industryPack);
  const scheduleLabel = getPageHeader('appointments', industryPack).title;

  const isPlatformAdmin = userRole === 'platform_admin';
  const userHasFullAccess =
    isPlatformAdmin ||
    userRole === 'company_admin' ||
    (userRole === 'employee' && jobTypes.some((jt) => ['manager', 'customer_service'].includes(jt)));

  const operatingModel = workspace?.operatingModel ?? 'field_dispatch';
  const operationsLabelByModel: Record<string, string> = {
    field_dispatch: navLabels.dispatchView || 'Dispatch View',
    appointment_booking: 'Appointment Console',
    pipeline_sales: 'Pipeline Console',
    receptionist_only: 'Receptionist Console',
    custom: 'Operations',
  };
  const operationsLabel = operationsLabelByModel[operatingModel] ?? 'Operations';
  const dispatchAllowed =
    (workspace?.restrictions as { dispatch?: boolean } | undefined)?.dispatch !== false;
  const fieldOpsMode = industryPack?.console_visibility?.field_ops ?? 'full';
  const fieldOpsHidden =
    !isPlatformAdmin &&
    (fieldOpsMode === 'hidden' ||
      fieldOpsMode === 'booking_mode' ||
      !dispatchAllowed ||
      operatingModel === 'receptionist_only');

  const role: NavRole = (userRole as NavRole) ?? 'employee';
  const groups: NavGroup[] = NAVIGATION_BY_ROLE[role] ?? NAVIGATION_BY_ROLE.employee;

  const filteredGroups = groups
    .filter((group) => {
      if (RESTRICTED_SECTIONS.includes(group.label) && !userHasFullAccess) return false;
      if (isPlatformAdmin) return true;
      if (group.requiredTier && subscriptionTier && !isAtLeastTier(group.requiredTier)) return false;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items
        .map((item): NavItem => {
          if (item.href === '/dashboard/ai-consoles/field-ops') {
            return { ...item, label: serviceConfig.workerSubItemLabel || navLabels.techView };
          }
          if (item.href === '/dashboard/dispatch-field-ops') {
            if (industryPack?.industry_id === 'saas_platform') {
              return { ...item, href: '/dashboard/video-console', label: 'Operations Map', icon: Map };
            }
            const dispatchLabel = serviceConfig.dispatchSubItemLabel || operationsLabel;
            const resolvedWorker = serviceConfig.workerSubItemLabel || navLabels.techView;
            return { ...item, label: dispatchLabel === resolvedWorker ? 'Dispatch' : dispatchLabel };
          }
          if (item.href === '/dashboard/appointments' && userRole !== 'employee') {
            return { ...item, label: scheduleLabel };
          }
          if (item.href === '/technician/jobs') {
            return { ...item, label: `My ${serviceConfig.jobNounPlural || 'Jobs'}` };
          }
          if (item.href === '/technician/history') {
            return { ...item, label: `${serviceConfig.jobNoun || 'Job'} History` };
          }
          if (item.href === '/technician/install') {
            return { ...item, label: serviceConfig.installAppLabel || 'Install App' };
          }
          return item;
        })
        .filter((item) => {
          if (!isPlatformAdmin && !navItemAllowedByProfile(item.href, profileSpec)) return false;
          if (
            fieldOpsHidden &&
            (item.href === '/dashboard/ai-consoles/field-ops' ||
              item.href === '/dashboard/dispatch-field-ops')
          ) {
            return false;
          }
          if (!isPlatformAdmin && isNavHrefHiddenForIndustry(industryPack?.industry_id, item.href)) {
            return false;
          }
          if (isPlatformAdmin) return true;
          // Business-type gate: skipped while the pack is still resolving so
          // the menu never flickers items in and out.
          if (item.requiredFeature && !industryLoading && !isFeatureEnabled(item.requiredFeature)) {
            return false;
          }
          if (item.requiredTier && subscriptionTier && !isAtLeastTier(item.requiredTier)) return false;
          if (userRole === 'employee' && item.requiredJobTypes) {
            return item.requiredJobTypes.some((jt) => hasJobType(jt as never));
          }
          return true;
        }),
    }))
    .filter((group) => group.items.length > 0);

  const isItemActive = (href: string) =>
    location.pathname + location.search === href ||
    (location.pathname === href.split('?')[0] &&
      href.includes('?') &&
      location.search.includes(href.split('?')[1]?.split('=')[1] || ''));

  const activeStyle = {
    background: 'hsl(var(--primary) / 0.1)',
    color: 'hsl(var(--primary))',
    boxShadow: '0 0 12px hsl(var(--primary) / 0.2), inset 0 0 0 1px hsl(var(--primary) / 0.2)',
    borderRadius: 8,
  } as const;
  const idleStyle = { color: 'rgba(255,255,255,0.92)' } as const;

  return (
    <nav className="space-y-1 px-2 py-1">
      {!collapsed && !industryLoading && (
        <p
          className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          title={`${industryLabel} dashboard`}
        >
          {industryLabel} Dashboard
        </p>
      )}
      {filteredGroups.map((group) => (
        <div key={group.label} className="space-y-0.5">
          {!collapsed && (
            <p
              className="px-3 py-0 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(0,229,255,0.35)' }}
            >
              {group.label === 'Operations'
                ? serviceConfig.fieldOpsSectionLabel || 'Operations'
                : group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = !!item.submenu?.length;
            const submenuOpen =
              openSubmenus[item.href] ??
              (hasSubmenu && item.submenu!.some((s) => location.pathname === s.href));
            const isActive = !hasSubmenu && isItemActive(item.href);

            return (
              <div key={item.href}>
                <Button
                  variant="ghost"
                  data-tour-id={item.tourId}
                  className={cn(
                    '!h-7 py-0.5 w-full justify-start gap-3 transition-all duration-200 hover:bg-transparent hover:text-[inherit]',
                    collapsed && 'justify-center px-2'
                  )}
                  style={isActive ? activeStyle : idleStyle}
                  onMouseEnter={(e) => {
                    if (isActive) return;
                    const hsl = item.featureColor ? GLOW_MAP[item.featureColor] : null;
                    const el = e.currentTarget as HTMLElement;
                    if (hsl) {
                      el.style.color = `hsl(${hsl})`;
                      el.style.background = `hsl(${hsl}/0.07)`;
                      el.style.boxShadow = `0 0 14px hsl(${hsl}/0.35), inset 0 0 0 1px hsl(${hsl}/0.18)`;
                    } else {
                      el.style.color = 'rgba(255,255,255,0.95)';
                      el.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isActive) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = 'rgba(255,255,255,0.92)';
                    el.style.background = 'transparent';
                    el.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    if (hasSubmenu) {
                      setOpenSubmenus((prev) => ({ ...prev, [item.href]: !submenuOpen }));
                    } else if (item.external) {
                      window.open(item.href, '_blank');
                    } else {
                      navigate(item.href);
                    }
                  }}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      item.featureColor && !isActive && item.featureColor
                    )}
                    style={isActive ? { color: 'hsl(var(--primary))' } : undefined}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && hasSubmenu && (
                    <span className="ml-auto">
                      {submenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </Button>

                {hasSubmenu && submenuOpen && !collapsed && (
                  <div className="ml-6 space-y-0.5 border-l pl-2" style={{ borderColor: 'rgba(0,229,255,0.15)' }}>
                    {item.submenu!.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = location.pathname === sub.href;
                      return (
                        <Button
                          key={sub.href}
                          variant="ghost"
                          className="!h-7 py-0.5 w-full justify-start gap-2 text-sm hover:bg-transparent"
                          style={subActive ? activeStyle : idleStyle}
                          onClick={() => navigate(sub.href)}
                        >
                          {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{sub.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
