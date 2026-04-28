import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Briefcase, Receipt, ClipboardList, ArrowRightLeft } from 'lucide-react';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { WorkflowChainButtons, type WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { toast } from 'sonner';
import { useAuraCommand } from '@/hooks/useAuraCommand';

const BUSINESS_WORKFLOWS: WorkflowChain[] = [
  {
    id: 'lead-to-invoice',
    label: 'Lead → Invoice',
    description: 'Full job lifecycle from new lead to paid invoice',
    icon: ArrowRightLeft,
    steps: ['Lead', 'Quote', 'Schedule', 'Invoice'],
    command: 'Run the full job flow: create a quote from my latest lead, schedule the appointment, and generate an invoice when done',
  },
  {
    id: 'quote-to-job',
    label: 'Quote → Job',
    description: 'Convert an approved quote into a scheduled job',
    icon: ClipboardList,
    steps: ['Quote', 'Approve', 'Schedule', 'Assign'],
    command: 'Take my most recent pending quote, approve it, schedule the job, and assign the best available technician',
  },
  {
    id: 'invoice-chase',
    label: 'Invoice Follow-Up',
    description: 'Chase overdue invoices with smart reminders',
    icon: Receipt,
    steps: ['Find Overdue', 'Draft Reminder', 'Send'],
    command: 'Find all overdue invoices, draft friendly payment reminders for each, and show them for my approval before sending',
  },
];

export default function BusinessManagementConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { submitQuery } = useAuraCommand();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="business_management">
          <div className="space-y-6">
            <PageHeader
              icon={Briefcase}
              title="Business Mgt Ops Console"
              description="AI-powered business operations and management tools"
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label="Automates 60-70% of admin tasks" />}
              action={
                <div className="flex items-center gap-2">
                  <HowToUseModal {...HOW_TO_USE.businessMgmtConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/business-mgt-ops-install" />
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
              chains={BUSINESS_WORKFLOWS}
              onTrigger={(cmd) => {
                toast.info('Running workflow…', { description: cmd.slice(0, 80) + '…' });
                submitQuery(cmd);
              }}
            />

            <BusinessOpsAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
