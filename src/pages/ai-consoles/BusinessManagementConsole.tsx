import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BusinessOpsAgentConsole } from '@/components/billing/BusinessOpsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function BusinessManagementConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <FeatureGate requiredTier="enterprise">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Business Management Ops Console</h2>
              {canManageSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/ai-agents')}
                  className="h-7"
                >
                  <Cpu className="h-3.5 w-3.5 mr-1.5" />
                  Manage Agents
                </Button>
              )}
            </div>
          </div>
          
          <BusinessOpsAgentConsole />
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
