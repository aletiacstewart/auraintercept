import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MarketingSalesAgentConsole } from '@/components/marketing/MarketingSalesAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Megaphone, Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MarketingSalesMasterPDF from '@/components/documentation/MarketingSalesMasterPDF';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getMarketingPlaybook } from '@/lib/industryMarketingPlaybooks';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';

// Cluster-aware marketing specialists. Surfaces the AI roles most useful for
// outreach campaigns in each industry cluster (Phase 4 contextual surfacing).
const MARKETING_SPECIALISTS_BY_CLUSTER: Record<string, IndustrySpecialistOperative[]> = {
  trades:  ['review_responder', 'insurance_claim'],
  outdoor: ['review_responder', 'site_survey'],
  repair:  ['review_responder', 'diagnostic'],
  booking: ['review_responder', 'loyalty_coach', 'calendar_optimizer'],
};
const MARKETING_SPECIALISTS_BY_INDUSTRY: Record<string, IndustrySpecialistOperative[]> = {
  real_estate:     ['listing_writer', 'comp_analyst', 'review_responder'],
  beauty_wellness: ['style_consultant', 'loyalty_coach', 'review_responder'],
  restaurants:     ['menu_writer', 'review_responder'],
  personal_assistant: ['task_triager', 'calendar_optimizer', 'review_responder'],
};

export default function MarketingSalesConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  const playbook = getMarketingPlaybook(pack);
  const marketingSpecialists =
    (pack && MARKETING_SPECIALISTS_BY_INDUSTRY[pack.industry_id]) ||
    (pack && MARKETING_SPECIALISTS_BY_CLUSTER[pack.cluster]) ||
    ['review_responder'];

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="marketing_sales">
          <div className="space-y-6">
            <PageHeader
              icon={Megaphone}
              title="Outreach & Sales Console"
              description={playbook.description}
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label={playbook.tagline} />}
              action={
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.outreachSalesConsole} />
                  <PDFDownloadLink
                    document={<MarketingSalesMasterPDF />}
                    fileName={`marketing-sales-master-guide-${new Date().toISOString().split('T')[0]}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" size="sm" disabled={loading} className="flex-1 sm:flex-none">
                        {loading ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        <span className="truncate">Master Guide PDF</span>
                      </Button>
                    )}
                  </PDFDownloadLink>
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
            
            <MarketingSalesAgentConsole />

            <SpecialistOperativesLauncher
              show={marketingSpecialists}
              title="Marketing Specialists"
              subtitle="AI specialists that draft listings, menus, review replies, and loyalty offers for your industry."
            />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
