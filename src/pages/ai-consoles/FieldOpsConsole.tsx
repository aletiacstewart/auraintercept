import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, HardHat } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

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

            <FieldOpsAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
