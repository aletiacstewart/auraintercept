import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { PerformanceAnalytics } from '@/components/analytics/PerformanceAnalytics';
import { ForecastAnalytics } from '@/components/analytics/ForecastAnalytics';
import { InsightsAnalytics } from '@/components/analytics/InsightsAnalytics';
import { IntakeAnalytics } from '@/components/analytics/IntakeAnalytics';
import { AnalyticsAgentConsole } from '@/components/analytics/AnalyticsAgentConsole';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Gauge,
  FileText,
  ClipboardList,
  Filter,
  Cpu,
} from 'lucide-react';
import { FunnelAnalytics } from '@/components/analytics/FunnelAnalytics';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { MedicalComplianceNotice } from '@/components/marketing/MedicalComplianceNotice';
import { BusinessTypeContextStrip } from '@/components/marketing/BusinessTypeContextStrip';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';

const VALID_TABS = [
  'overview',
  'revenue',
  'customers',
  'forecast',
  'performance',
  'reports',
  'intake',
] as const;

/** Legacy tab names that used to be separate pages or tab values. */
const TAB_ALIASES: Record<string, (typeof VALID_TABS)[number]> = {
  analytics: 'overview',
  kpi: 'reports',
  'kpi-dashboard': 'reports',
  'performance-report': 'reports',
  export: 'reports',
  insights: 'customers',
  'business-insights': 'customers',
  'customer-insights': 'customers',
  'revenue-analysis': 'revenue',
  'revenue-forecast': 'forecast',
  demand: 'forecast',
};

function resolveTab(raw: string | null): (typeof VALID_TABS)[number] {
  if (!raw) return 'overview';
  if ((VALID_TABS as readonly string[]).includes(raw)) {
    return raw as (typeof VALID_TABS)[number];
  }
  return TAB_ALIASES[raw] ?? 'overview';
}

export default function Analytics() {
  const { userRole, companyId } = useAuth();
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  const analyticsHeader = getPageHeader('analytics', pack);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get('company');

  // If platform admin with a company query param, show company analytics
  const showCompanyView = selectedCompanyId && userRole === 'platform_admin';
  const effectiveCompanyId = showCompanyView ? selectedCompanyId : companyId;
  const activeTab = resolveTab(searchParams.get('tab'));
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <MedicalComplianceNotice industryId={pack?.industry_id} />
          <PageHeader
            icon={BarChart3}
            title={analyticsHeader.title}
            description={analyticsHeader.description}
            showAuraBar
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

          {userRole === 'platform_admin' && !showCompanyView ? (
            // Platform admin view with tabs including platform-wide analytics
            <Tabs defaultValue="platform" className="space-y-4">
              <TabsList>
                <TabsTrigger value="platform" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Platform
                </TabsTrigger>
                <TabsTrigger value="funnel" className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Signup Funnel
                </TabsTrigger>
              </TabsList>

              <TabsContent value="platform">
                <PlatformAnalytics />
              </TabsContent>
              <TabsContent value="funnel">
                <FunnelAnalytics />
              </TabsContent>
            </Tabs>
          ) : effectiveCompanyId ? (
            // Company view — one home for every analytics surface
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="forecast" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Forecast
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="intake" className="flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Intake
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <AnalyticsTab>
                  <CompanyAnalytics
                    companyId={effectiveCompanyId}
                    showCompanyName={showCompanyView || false}
                  />
                </AnalyticsTab>
              </TabsContent>

              <TabsContent value="revenue">
                <AnalyticsTab>
                  <RevenueAnalytics companyId={effectiveCompanyId} />
                </AnalyticsTab>
              </TabsContent>

              <TabsContent value="customers">
                <AnalyticsTab>
                  <InsightsAnalytics companyId={effectiveCompanyId} />
                </AnalyticsTab>
              </TabsContent>

              <TabsContent value="forecast">
                <AnalyticsTab>
                  <ForecastAnalytics companyId={effectiveCompanyId} />
                </AnalyticsTab>
              </TabsContent>

              <TabsContent value="performance">
                <AnalyticsTab>
                  <PerformanceAnalytics companyId={effectiveCompanyId} />
                </AnalyticsTab>
              </TabsContent>

              <TabsContent value="reports">
                <FeatureGate requiredConsole="analytics_reports">
                  <AnalyticsTab>
                    <div className="space-y-6">
                      <AnalyticsAgentConsole />
                      <BusinessTypeContextStrip subtitle="Benchmarks for your business type" />
                    </div>
                  </AnalyticsTab>
                </FeatureGate>
              </TabsContent>

              <TabsContent value="intake">
                <AnalyticsTab>
                  <IntakeAnalytics companyId={effectiveCompanyId} />
                </AnalyticsTab>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No company associated with your account.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
