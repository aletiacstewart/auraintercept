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
import { MedicalComplianceNotice } from '@/components/marketing/MedicalComplianceNotice';
import { BusinessTypeContextStrip } from '@/components/marketing/BusinessTypeContextStrip';

export default function AnalyticsConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';
  const industryLabel = pack.label || 'service business';
  const description = `Reports and insights for your ${industryLabel.toLowerCase()}.`;

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="analytics_reports">
          <div className="space-y-6">
            <MedicalComplianceNotice industryId={pack?.industry_id} />
            <PageHeader
              icon={BarChart3}
              title="Analytics & Reports"
              description={description}
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label="Saves ~5 hrs/week on reporting" />}
              action={
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.analyticsConsole} />
                  {canManageSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard/ai-agents/analytics_intelligence')}
                      className="w-full sm:w-auto"
                    >
                      <Cpu className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate">Manage Agents</span>
                    </Button>
                  )}
                </div>
              }
            />
            
            <AnalyticsAgentConsole />
            <BusinessTypeContextStrip subtitle="Benchmarks for your business type" />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
