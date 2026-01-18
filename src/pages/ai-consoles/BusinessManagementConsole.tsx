import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Briefcase } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function BusinessManagementConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredTier="enterprise">
          <div className="space-y-6">
            <PageHeader
              icon={Briefcase}
              title="Business Management Console"
              description="AI-powered business operations and management tools"
              action={
                canManageSettings ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/ai-agents')}
                  >
                    <Cpu className="h-3.5 w-3.5 mr-1.5" />
                    Manage Agents
                  </Button>
                ) : undefined
              }
            />
            
            <BusinessOpsAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
