import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { CostCalculator } from '@/components/integrations/CostCalculator';
import { ROICalculator } from '@/components/integrations/ROICalculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp } from 'lucide-react';

export default function Calculators() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Calculator}
            title="Cost & ROI Calculator"
            description="Estimate costs and calculate potential savings from AI-powered reminders"
            featureColor="analytics"
            showAuraBar
          />

          {/* Calculator Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-primary" />
                Financial Planning Tools
              </CardTitle>
              <CardDescription>Plan your budget and measure return on investment</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="costs" className="w-full">
                <TabsList className="inline-flex h-auto p-2 bg-muted/30 rounded-2xl border border-border gap-1 mb-4">
                  <TabsTrigger value="costs" className="flex items-center gap-1 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <Calculator className="w-4 h-4" />
                    Estimate Costs
                  </TabsTrigger>
                  <TabsTrigger value="roi" className="flex items-center gap-1 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                    <TrendingUp className="w-4 h-4" />
                    Calculate ROI
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="costs">
                  <CostCalculator />
                </TabsContent>
                <TabsContent value="roi">
                  <ROICalculator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
