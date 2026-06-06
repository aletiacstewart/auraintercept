import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FieldOpsManager } from '@/components/fieldops';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Route, MapPin, ClipboardCheck, CalendarCheck } from 'lucide-react';
import { WorkflowChainButtons, type WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { toast } from 'sonner';
import { useAuraCommand } from '@/hooks/useAuraCommand';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { hasFieldTechnicians } from '@/lib/industryCapabilities';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';

const DISPATCH_WORKFLOWS: WorkflowChain[] = [
  {
    id: 'smart-dispatch',
    label: 'Smart Dispatch',
    description: 'Auto-assign jobs based on location, skill, and workload',
    icon: Route,
    steps: ['Analyze Queue', 'Match Tech', 'Dispatch', 'Notify'],
    command: 'Analyze pending jobs, match each to the best technician by distance and skill, dispatch all, and send customer notifications with ETAs',
    preview: {
      reads: [
        'Pending jobs and appointments (last 24h)',
        'Active technicians, skills, and current location',
        'Customer contact info (name + phone)',
      ],
      writes: [
        'Creates / updates rows in job_assignments',
        'Marks appointments as dispatched',
      ],
      sideEffects: [
        { channel: 'assignment', description: 'Assigns each pending job to a technician' },
        { channel: 'sms', description: 'Sends one ETA SMS per affected customer' },
      ],
      estimatedVolume: 'Up to all pending jobs in the queue',
    },
  },
  {
    id: 'reoptimize',
    label: 'Re-optimize Routes',
    description: 'Recalculate all active routes for efficiency',
    icon: MapPin,
    steps: ['Gather Active', 'Optimize', 'Update ETAs'],
    command: 'Re-optimize all active technician routes for minimum travel time and update customer ETAs accordingly',
    preview: {
      reads: [
        'All active job_assignments and their order',
        'Technician current locations',
      ],
      writes: [
        'Updates estimated_arrival_minutes and route order on job_assignments',
      ],
      sideEffects: [
        { channel: 'sms', description: 'Sends updated-ETA SMS only to customers whose ETA changed materially' },
      ],
      estimatedVolume: 'All active routes for today',
    },
  },
  {
    id: 'daily-dispatch-report',
    label: 'Dispatch Report',
    description: 'Generate today\'s dispatch performance summary',
    icon: ClipboardCheck,
    steps: ['Collect Data', 'Analyze', 'Report'],
    command: 'Generate a dispatch performance report for today including on-time rates, average response times, and technician utilization',
    preview: {
      reads: [
        'Today\'s job_assignments (assigned, en-route, arrived, completed times)',
        'Technician roster and shift hours',
      ],
      writes: [],
      sideEffects: [
        { channel: 'none', description: 'Read-only — produces a summary in the chat panel' },
      ],
    },
  },
];

export default function FieldOperations() {
  const { companyId, loading } = useAuth();
  const { submitQuery } = useAuraCommand();
  const { pack } = useIndustryPack();
  const serviceConfig = getIndustryServiceConsoleConfig(pack);
  const isDispatch = hasFieldTechnicians(pack) && serviceConfig.fieldRouting;
  const jobNoun = serviceConfig.jobNoun;

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Skeleton className="h-[600px] w-full" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No company selected
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <InlineFormProvider>
        <div className="space-y-6">
          <PageHeader
            icon={isDispatch ? Truck : CalendarCheck}
            title={isDispatch ? serviceConfig.consoleTitle : serviceConfig.appointmentBoardTitle}
            description={
              isDispatch
                ? serviceConfig.consoleDescription
                : serviceConfig.appointmentBoardDescription
            }
            featureColor="fieldops"
            showAuraBar
            action={<InstallOnPhoneButton to="/dashboard/dispatch-field-ops-install" />}
          />
          <InlineFormHost />
          {isDispatch && (
            <WorkflowChainButtons
              chains={DISPATCH_WORKFLOWS}
              onTrigger={(cmd) => {
                toast.info('Running workflow…', { description: cmd.slice(0, 80) + '…' });
                submitQuery(cmd);
              }}
            />
          )}
          <div className="h-[calc(100vh-20rem)]">
            <FieldOpsManager companyId={companyId} />
          </div>
        </div>
        </InlineFormProvider>
      </PageContainer>
    </DashboardLayout>
  );
}