import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Monitor, Code, Cpu, Eye, HeadphonesIcon, PanelRightOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { MedicalComplianceNotice } from '@/components/marketing/MedicalComplianceNotice';
import { BusinessTypeContextStrip } from '@/components/marketing/BusinessTypeContextStrip';
import { getPortalCopy } from '@/lib/industryPortalCopy';
import type { IndustrySpecialistOperative } from '@/lib/subscriptionAgentConfig';

// Cluster-aware specialist roster for the customer-facing portal.
// Trades/Repair surface diagnostics & claims; Outdoor surfaces site surveys;
// Booking-first surfaces booking/loyalty/review specialists tuned per industry.
const PORTAL_SPECIALISTS_BY_CLUSTER: Record<string, IndustrySpecialistOperative[]> = {
  trades: ['diagnostic', 'permit_code', 'insurance_claim', 'review_responder'],
  outdoor: ['site_survey', 'insurance_claim', 'diagnostic', 'review_responder'],
  repair: ['diagnostic', 'review_responder'],
  booking: ['task_triager', 'calendar_optimizer', 'review_responder'],
};
const PORTAL_SPECIALISTS_BY_INDUSTRY: Record<string, IndustrySpecialistOperative[]> = {
  real_estate: ['listing_writer', 'offer_drafter', 'comp_analyst', 'review_responder'],
  beauty_wellness: ['style_consultant', 'loyalty_coach', 'review_responder'],
  restaurants: ['menu_writer', 'review_responder'],
  personal_assistant: ['task_triager', 'calendar_optimizer', 'review_responder'],
};

export default function CustomerPortalConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  const [showPreview, setShowPreview] = useState(false);
  const { pack } = useIndustryPack();
  const copy = getPortalCopy(pack);
  const specialists =
    (pack && PORTAL_SPECIALISTS_BY_INDUSTRY[pack.industry_id]) ||
    (pack && PORTAL_SPECIALISTS_BY_CLUSTER[pack.cluster]) ||
    ['diagnostic', 'site_survey', 'insurance_claim'];

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="customer_portal">
          <div className="space-y-6">
            <MedicalComplianceNotice industryId={pack?.industry_id} />
            {/* Admin Preview Mode Banner */}
            {canManageSettings && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Eye className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  <span className="font-medium">Admin Preview</span> — Customers see this via the widget on your site.
                </AlertDescription>
              </Alert>
            )}

            <PageHeader
              icon={HeadphonesIcon}
              title={copy.title}
              description={copy.description}
              featureColor="customers"
              showAuraBar
              badge={
                canManageSettings ? (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                    Admin Preview
                  </Badge>
                ) : undefined
              }
              action={
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  <HowToUseModal {...HOW_TO_USE.customerPortalConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/customer-portal-app-install" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview((p) => !p)}
                        className="hidden lg:flex gap-1.5"
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        {showPreview ? 'Hide Preview' : 'Live Preview'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-agents/triage')}
                        className="w-full sm:w-auto"
                      >
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        <span className="truncate">Manage Agents</span>
                      </Button>
                    </>
                  )}
                  {userRole !== 'employee' && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'customer' | 'debug')} className="w-full sm:w-auto">
                      <TabsList className="grid h-auto w-full grid-cols-2 gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-1 sm:inline-flex sm:w-auto sm:rounded-full">
                        <TabsTrigger value="customer" className="min-w-0 text-xs px-2 sm:px-3 py-1.5 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                          <Monitor className="h-3 w-3 mr-1" />
                          <span className="truncate">Customer View</span>
                        </TabsTrigger>
                        <TabsTrigger value="debug" className="min-w-0 text-xs px-2 sm:px-3 py-1.5 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                          <Code className="h-3 w-3 mr-1" />
                          <span className="truncate">Debug</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
              }
            />
            
            <div className={showPreview ? 'flex gap-6' : ''}>
              <div className={showPreview ? 'flex-1 min-w-0' : ''}>
                <BusinessTypeContextStrip subtitle="Customer experience tuned for your business type" />
                {viewMode === 'customer' ? (
                  <AIAgentConsole allowCompanySelection={userRole === 'platform_admin' || userRole === 'company_admin'} />
                ) : (
                  <AIAgentChat />
                )}
                <div className="mt-6">
                  <SpecialistOperativesLauncher
                    show={specialists}
                    subtitle={copy.specialistSubtitle}
                  />
                </div>
              </div>
              {showPreview && (
                <div className="hidden lg:block w-[420px] shrink-0 sticky top-4 self-start">
                  <WidgetPreview />
                </div>
              )}
            </div>
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}