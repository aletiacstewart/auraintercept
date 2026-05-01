import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, HardHat } from 'lucide-react';
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

export default function FieldOpsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { submitQuery } = useAuraCommand();
  const { pack } = useIndustryPack();
  const workflows = getFieldOpsWorkflows(pack);

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="field_operations">
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={HardHat}
              title="Field Operations Console"
              description="Your intelligent field operations assistant"
              featureColor="fieldops"
              showAuraBar
              badge={<ValueBadge label="Saves ~10 hrs/week on dispatch" />}
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
              show={['permit_code', 'site_survey', 'diagnostic']}
              subtitle="Field-side specialists for permits, surveys, and diagnostics."
            />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
