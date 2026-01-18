import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, TrendingUp, Lightbulb, BarChart3, LineChart, Target, Users, Activity } from 'lucide-react';
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

      <TabsContent value="revenue" className="mt-6">
        <Accordion type="single" collapsible defaultValue="revenue-analysis" className="space-y-4">
          <AccordionItem value="revenue-analysis" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold">Revenue Analysis</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <RevenueAnalysisForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('revenue')}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="trend-forecast" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <LineChart className="h-5 w-5 text-primary" />
                <span className="font-semibold">Trend Forecast</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <TrendForecastForm
                companyId={companyId}
                onCancel={handleCancel}
                onForecast={handleAnalyze('forecast')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      <TabsContent value="performance" className="mt-6">
        <Accordion type="single" collapsible defaultValue="performance-report" className="space-y-4">
          <AccordionItem value="performance-report" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Performance Report</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <PerformanceReportForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('performance')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        <Accordion type="single" collapsible defaultValue="insights-report" className="space-y-4">
          <AccordionItem value="insights-report" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span className="font-semibold">Business Insights</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <InsightsReportForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('insights')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <Accordion type="single" collapsible defaultValue="customer-insights" className="space-y-4">
          <AccordionItem value="customer-insights" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">Customer Insights</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <CustomerInsightsForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('customers')}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="kpi-dashboard" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <span className="font-semibold">KPI Dashboard</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <KpiDashboardForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('kpi')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
    </Tabs>
  );
}
