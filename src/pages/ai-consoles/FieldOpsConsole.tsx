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
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';
import { isSpecialistOperative } from '@/lib/subscriptionAgentConfig';

export default function FieldOpsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { submitQuery } = useAuraCommand();
  const { pack } = useIndustryPack();
  const workflows = getFieldOpsWorkflows(pack);
  const serviceConfig = useMemo(() => getIndustryServiceConsoleConfig(pack), [pack]);

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  const mode = pack.console_visibility?.field_ops ?? 'full';

  const { title, description, icon: TitleIcon, badge } = useMemo(() => ({
    title: serviceConfig.workerConsoleTitle,
    description: serviceConfig.workerConsoleDescription || serviceConfig.consoleDescription,
    icon: serviceConfig.fieldRouting ? (mode === 'route_mode' ? MapIcon : HardHat) : CalendarCheck,
    badge: serviceConfig.consoleBadge,
  }), [mode, serviceConfig]);

  // Pick the most relevant specialists for this industry pack
  const specialistsForPack = useMemo(() => {
    const inPack = (pack.extra_operatives ?? []).filter(isSpecialistOperative) as IndustrySpecialistOperative[];
    if (inPack.length > 0) return inPack.slice(0, 4);
    if (!serviceConfig.fieldRouting) return serviceConfig.specialistShow;
    if (mode === 'route_mode') return ['site_survey'] as IndustrySpecialistOperative[];
    return ['permit_code', 'site_survey', 'diagnostic'] as IndustrySpecialistOperative[];
  }, [pack.extra_operatives, mode, serviceConfig]);

  const specialistSubtitle = serviceConfig.specialistSubtitle;

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
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.fieldOpsConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/field-ops-install" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-agents')}
                        className="w-full sm:w-auto"
                      >
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        <span className="truncate">Manage Agents</span>
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
