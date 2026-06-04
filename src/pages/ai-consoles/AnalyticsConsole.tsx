import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { AnalyticsAgentConsole } from '@/components/analytics/AnalyticsAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, BarChart3 } from 'lucide-react';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { useIndustryPack } from '@/hooks/useIndustryPack';

export default function AnalyticsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';
  const industryLabel = pack.label || 'service business';
  const description = `AI-powered analytics, reporting, and ${industryLabel.toLowerCase()} business insights.`;

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="analytics_reports">
          <div className="space-y-6">
            <PageHeader
              icon={BarChart3}
              title="Analytics & Reports Console"
              description={description}
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label="Saves ~5 hrs/week on reporting" />}
              action={
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.analyticsConsole} />
                  {canManageSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard/ai-agents')}
                      className="flex-1 sm:flex-none"
                    >
                      <Cpu className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate">Manage Agents</span>
                    </Button>
                  )}
                </div>
              }
            />
            
            <AnalyticsAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
