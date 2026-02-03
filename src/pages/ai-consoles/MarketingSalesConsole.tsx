import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MarketingSalesAgentConsole } from '@/components/marketing/MarketingSalesAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Megaphone } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function MarketingSalesConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="marketing_sales">
          <div className="space-y-6">
            <PageHeader
              icon={Megaphone}
              title="Outreach & Sales Ops"
              description="AI-powered marketing automation and sales intelligence"
              featureColor="platform"
              showAuraBar
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
            
            <MarketingSalesAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
