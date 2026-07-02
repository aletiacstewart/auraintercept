import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, TrendingUp, BarChart3, LineChart, Target, Users, Bell, Share2, Download } from 'lucide-react';
import { RevenueAnalysisForm } from '@/components/analytics/forms/RevenueAnalysisForm';
import { PerformanceReportForm } from '@/components/analytics/forms/PerformanceReportForm';
import { CustomerInsightsForm } from '@/components/analytics/forms/CustomerInsightsForm';
import { KpiDashboardForm } from '@/components/analytics/forms/KpiDashboardForm';
import { TrendForecastForm } from '@/components/analytics/forms/TrendForecastForm';
import { ReminderInsightsForm } from '@/components/analytics/forms/ReminderInsightsForm';
import { SocialAnalyticsForm } from '@/components/analytics/forms/SocialAnalyticsForm';
import { ExportReportForm } from '@/components/analytics/forms/ExportReportForm';

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
      <TabsList>
        <TabsTrigger value="revenue" className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Revenue</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Performance</span>
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Insights</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">All Insights & Reports</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="revenue" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="revenue-analysis" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Revenue</span>
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
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <LineChart className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Forecast</span>
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
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="performance-report" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Report</span>
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
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="insights-report" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Insights</span>
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
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">KPIs</span>
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

      <TabsContent value="analytics" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="all-revenue" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Revenue</span>
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
          <AccordionItem value="all-forecast" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <LineChart className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Forecast</span>
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
          <AccordionItem value="all-performance" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Report</span>
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
          <AccordionItem value="all-insights" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Insights</span>
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
          <AccordionItem value="all-kpi" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">KPIs</span>
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
          <AccordionItem value="all-social" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Social</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <SocialAnalyticsForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('social')}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-reminders" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Reminders</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ReminderInsightsForm
                companyId={companyId}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze('reminders')}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-export" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Export</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ExportReportForm
                companyId={companyId}
                onCancel={handleCancel}
                onExport={handleAnalyze('export')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
    </Tabs>
  );
}
