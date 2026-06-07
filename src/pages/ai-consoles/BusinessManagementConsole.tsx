import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Briefcase } from 'lucide-react';
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
import { getBusinessWorkflows } from '@/lib/industryWorkflows';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';

export default function BusinessManagementConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { submitQuery } = useAuraCommand();
  const { pack } = useIndustryPack();
  // Workflow chains are derived from the company's industry pack so terminology
  // (Showing vs Job, Buyer vs Customer) and the chain set match the vertical.
  const businessWorkflows = useMemo(() => getBusinessWorkflows(pack), [pack]);
  // Surface only the admin-relevant specialists actually opted-in by the
  // company's industry pack — e.g. trades get insurance_claim/permit_code,
  // real estate gets offer_drafter, restaurants get review_responder, etc.
  // The launcher hides itself if the resolved list is empty.
  const adminSpecialists = useMemo(
    () => (pack?.extra_operatives ?? []) as IndustrySpecialistOperative[],
    [pack],
  );
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="business_management">
          <div className="space-y-6">
            <PageHeader
              icon={Briefcase}
              title="Business Management Console"
              description="Run day-to-day operations from one place."
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label="Automates 60-70% of admin tasks" />}
              action={
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.businessMgmtConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/business-mgt-ops-install" />
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
              chains={businessWorkflows}
              onTrigger={(cmd) => {
                toast.info('Running workflow…', { description: cmd.slice(0, 80) + '…' });
                submitQuery(cmd);
              }}
            />

            <BusinessOpsAgentConsole />

            {adminSpecialists.length > 0 && (
              <SpecialistOperativesLauncher
                show={adminSpecialists}
                subtitle="Industry-specific admin specialists for your vertical."
              />
            )}
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
