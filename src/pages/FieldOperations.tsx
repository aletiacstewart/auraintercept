import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FieldOpsManager } from '@/components/fieldops';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Route, MapPin, ClipboardCheck } from 'lucide-react';
import { WorkflowChainButtons, type WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { toast } from 'sonner';

const DISPATCH_WORKFLOWS: WorkflowChain[] = [
  {
    id: 'smart-dispatch',
    label: 'Smart Dispatch',
    description: 'Auto-assign jobs based on location, skill, and workload',
    icon: Route,
    steps: ['Analyze Queue', 'Match Tech', 'Dispatch', 'Notify'],
    command: 'Analyze pending jobs, match each to the best technician by distance and skill, dispatch all, and send customer notifications with ETAs',
  },
  {
    id: 'reoptimize',
    label: 'Re-optimize Routes',
    description: 'Recalculate all active routes for efficiency',
    icon: MapPin,
    steps: ['Gather Active', 'Optimize', 'Update ETAs'],
    command: 'Re-optimize all active technician routes for minimum travel time and update customer ETAs accordingly',
  },
  {
    id: 'daily-dispatch-report',
    label: 'Dispatch Report',
    description: 'Generate today\'s dispatch performance summary',
    icon: ClipboardCheck,
    steps: ['Collect Data', 'Analyze', 'Report'],
    command: 'Generate a dispatch performance report for today including on-time rates, average response times, and technician utilization',
  },
];

export default function FieldOperations() {
  const { companyId, loading } = useAuth();

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
        <div className="space-y-6">
          <PageHeader
            icon={Truck}
            title="Dispatch-Field Ops"
            description="Real-time dispatch console for managing field technicians"
            featureColor="fieldops"
            showAuraBar
          />
          <WorkflowChainButtons
            chains={DISPATCH_WORKFLOWS}
            onTrigger={(cmd) => toast.info('Workflow queued', { description: cmd.slice(0, 80) + '...' })}
          />
          <div className="h-[calc(100vh-20rem)]">
            <FieldOpsManager companyId={companyId} />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}