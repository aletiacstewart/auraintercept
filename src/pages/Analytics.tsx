import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { PerformanceAnalytics } from '@/components/analytics/PerformanceAnalytics';
import { ForecastAnalytics } from '@/components/analytics/ForecastAnalytics';
import { InsightsAnalytics } from '@/components/analytics/InsightsAnalytics';
import { IntakeAnalytics } from '@/components/analytics/IntakeAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, DollarSign, Bot, TrendingUp, Sparkles, ClipboardList } from 'lucide-react';

export default function Analytics() {
  const { userRole, companyId } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get('company');

  // If platform admin with a company query param, show company analytics
  const showCompanyView = selectedCompanyId && userRole === 'platform_admin';
  const effectiveCompanyId = showCompanyView ? selectedCompanyId : companyId;
  const initialTab = searchParams.get('tab') || 'overview';

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={BarChart3}
            title="Analytics"
            description="View insights and performance metrics"
            showAuraBar
          />
          
          {userRole === 'platform_admin' && !showCompanyView ? (
            // Platform admin view with tabs including platform-wide analytics
            <Tabs defaultValue="platform" className="space-y-4">
              <TabsList>
                <TabsTrigger value="platform" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Platform
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="platform">
                <PlatformAnalytics />
              </TabsContent>
            </Tabs>
          ) : effectiveCompanyId ? (
            // Company view with all analytics tabs
            <Tabs defaultValue={initialTab} className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  AI Agents
                </TabsTrigger>
                <TabsTrigger value="forecast" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Forecast
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="intake" className="flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Intake
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <CompanyAnalytics companyId={effectiveCompanyId} showCompanyName={showCompanyView || false} />
              </TabsContent>
              
              <TabsContent value="revenue">
                <RevenueAnalytics companyId={effectiveCompanyId} />
              </TabsContent>
              
              <TabsContent value="performance">
                <PerformanceAnalytics companyId={effectiveCompanyId} />
              </TabsContent>
              
              <TabsContent value="forecast">
                <ForecastAnalytics companyId={effectiveCompanyId} />
              </TabsContent>
              
              <TabsContent value="insights">
                <InsightsAnalytics companyId={effectiveCompanyId} />
              </TabsContent>

              <TabsContent value="intake">
                <IntakeAnalytics companyId={effectiveCompanyId} />
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
