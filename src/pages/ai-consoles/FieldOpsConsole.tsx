import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, HardHat, Map as MapIcon, CalendarCheck } from 'lucide-react';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { WorkflowChainButtons } from '@/components/ui/workflow-chain-buttons';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { toast } from 'sonner';
import { useAuraCommand } from '@/hooks/useAuraCommand';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getFieldOpsWorkflows } from '@/lib/industryFieldOpsWorkflows';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';
import { isSpecialistOperative } from '@/lib/subscriptionAgentConfig';

export default function FieldOpsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { submitQuery } = useAuraCommand();
  const { pack } = useIndustryPack();
  const workflows = getFieldOpsWorkflows(pack);

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  const mode = pack.console_visibility?.field_ops ?? 'full';

  // Title & description per cluster mode
  const { title, description, icon: TitleIcon, badge } = useMemo(() => {
    if (mode === 'route_mode') return {
      title: 'Route Operations Console',
      description: 'Recurring routes, weather-aware reschedules, and crew scheduling',
      icon: MapIcon,
      badge: 'Built for recurring outdoor routes',
    };
    if (mode === 'booking_mode') return {
      title: 'Booking Operations Console',
      description: "Today's bookings, no-show recovery, and walk-in flow",
      icon: CalendarCheck,
      badge: 'Built for in-person bookings — no truck dispatch',
    };
    return {
      title: 'Field Operations Console',
      description: 'Your intelligent field operations assistant',
      icon: HardHat,
      badge: 'Saves ~10 hrs/week on dispatch',
    };
  }, [mode]);

  // Pick the most relevant specialists for this industry pack
  const specialistsForPack = useMemo(() => {
    const inPack = (pack.extra_operatives ?? []).filter(isSpecialistOperative) as IndustrySpecialistOperative[];
    if (inPack.length > 0) return inPack.slice(0, 4);
    if (mode === 'booking_mode') return ['review_responder'] as IndustrySpecialistOperative[];
    if (mode === 'route_mode') return ['site_survey'] as IndustrySpecialistOperative[];
    return ['permit_code', 'site_survey', 'diagnostic'] as IndustrySpecialistOperative[];
  }, [pack.extra_operatives, mode]);

  const specialistSubtitle =
    mode === 'booking_mode'
      ? 'Booking-side specialists — drafts, rebook outreach, review responses.'
      : mode === 'route_mode'
      ? 'Route-side specialists for surveys, treatments, and chemistry logs.'
      : 'Field-side specialists for permits, surveys, and diagnostics.';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="field_operations">
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={TitleIcon}
              title={title}
              description={description}
              featureColor="fieldops"
              showAuraBar
              badge={<ValueBadge label={badge} />}
              action={
                <div className="flex items-center gap-2">
                  <HowToUseModal {...HOW_TO_USE.fieldOpsConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/field-ops-install" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-agents')}
                      >
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        Manage Agents
                      </Button>
                    </>
                  )}
                </div>
              }
            />

            <WorkflowChainButtons
              chains={workflows}
              onTrigger={(cmd) => {
                toast.info('Running workflow…', { description: cmd.slice(0, 80) + '…' });
                submitQuery(cmd);
              }}
            />

            <FieldOpsAgentConsole />

            <SpecialistOperativesLauncher
              show={specialistsForPack}
              subtitle={specialistSubtitle}
            />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
