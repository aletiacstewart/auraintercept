import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SocialMediaAgentConsole } from '@/components/social/SocialMediaAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Share2 } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function SocialMediaConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredTier="command">
          <div className="space-y-6">
            <PageHeader
              icon={Share2}
              title="Aura Social Signal Ops"
              description="AI-powered social signal creation, scheduling, and analytics"
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
            
            <SocialMediaAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
