import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { RevenueAnalysisForm } from '@/components/analytics/forms/RevenueAnalysisForm';
import { PerformanceReportForm } from '@/components/analytics/forms/PerformanceReportForm';
import { InsightsReportForm } from '@/components/analytics/forms/InsightsReportForm';
import { CustomerInsightsForm } from '@/components/analytics/forms/CustomerInsightsForm';
import { KpiDashboardForm } from '@/components/analytics/forms/KpiDashboardForm';
import { TrendForecastForm } from '@/components/analytics/forms/TrendForecastForm';

interface AuraTabsProps {
  companyId: string;
  defaultTab?: string;
  onAnalyze?: (type: string, data: Record<string, unknown>) => void;
}

export function AuraTabs({ companyId, defaultTab = 'revenue', onAnalyze }: AuraTabsProps) {
  const handleAnalyze = (type: string) => (data: Record<string, unknown>) => {
    onAnalyze?.(type, data);
  };

  // Empty handler for cancel since we don't hide forms in tabbed view
  const handleCancel = () => {};

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
        <TabsTrigger value="revenue" className="flex items-center gap-2 data-[state=active]:bg-background">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Revenue</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-background">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Performance</span>
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-background">
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Insights</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">All Analytics</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="revenue" className="mt-6 space-y-6">
        <RevenueAnalysisForm
          companyId={companyId}
          onCancel={handleCancel}
          onAnalyze={handleAnalyze('revenue')}
        />
        <TrendForecastForm
          companyId={companyId}
          onCancel={handleCancel}
          onForecast={handleAnalyze('forecast')}
        />
      </TabsContent>

      <TabsContent value="performance" className="mt-6">
        <PerformanceReportForm
          companyId={companyId}
          onCancel={handleCancel}
          onAnalyze={handleAnalyze('performance')}
        />
      </TabsContent>

      <TabsContent value="insights" className="mt-6 space-y-6">
        <InsightsReportForm
          companyId={companyId}
          onCancel={handleCancel}
          onAnalyze={handleAnalyze('insights')}
        />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6 space-y-6">
        <CustomerInsightsForm
          companyId={companyId}
          onCancel={handleCancel}
          onAnalyze={handleAnalyze('customers')}
        />
        <KpiDashboardForm
          companyId={companyId}
          onCancel={handleCancel}
          onAnalyze={handleAnalyze('kpi')}
        />
      </TabsContent>
    </Tabs>
  );
}
