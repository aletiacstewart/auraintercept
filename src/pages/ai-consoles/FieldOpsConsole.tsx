import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, HardHat, Route, MapPin, Wrench } from 'lucide-react';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { WorkflowChainButtons, type WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import { toast } from 'sonner';

const FIELD_OPS_WORKFLOWS: WorkflowChain[] = [
  {
    id: 'dispatch-complete',
    label: 'Dispatch → Complete',
    description: 'Full field job from dispatch to completion report',
    icon: Route,
    steps: ['Dispatch', 'Route', 'Arrive', 'Complete'],
    command: 'Dispatch the next pending job to the nearest available technician, optimize the route, and prepare the completion checklist',
  },
  {
    id: 'emergency-dispatch',
    label: 'Emergency Job',
    description: 'Fast-track an emergency service call',
    icon: MapPin,
    steps: ['Triage', 'Assign', 'Route', 'ETA Notify'],
    command: 'Create an emergency service call, assign the closest available technician, calculate the fastest route, and send the customer an ETA notification',
  },
  {
    id: 'end-of-day',
    label: 'End of Day Wrap-Up',
    description: 'Close out all field jobs and generate daily summary',
    icon: Wrench,
    steps: ['Review Jobs', 'Close Open', 'Summary'],
    command: 'Review all field jobs from today, close any that are completed, and generate an end-of-day summary with technician performance metrics',
  },
];

export default function FieldOpsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="field_operations">
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={HardHat}
              title="Technician-Field Ops"
              description="Your intelligent field operations assistant"
              featureColor="fieldops"
              showAuraBar
              badge={<ValueBadge label="Saves ~10 hrs/week on dispatch" />}
              action={
                canManageSettings ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/ai-agents')}
                    className="h-7"
                  >
                    <Cpu className="h-3.5 w-3.5 mr-1.5" />
                    Manage Agents
                  </Button>
                ) : null
              }
            />

            <WorkflowChainButtons
              chains={FIELD_OPS_WORKFLOWS}
              onTrigger={(cmd) => toast.info('Workflow queued', { description: cmd.slice(0, 80) + '...' })}
            />

            <FieldOpsAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
