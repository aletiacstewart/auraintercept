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
            description="Estimate costs and calculate potential savings from AI reminders"
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
                <TabsList className="mb-4">
                  <TabsTrigger value="costs" className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    Estimate Costs
                  </TabsTrigger>
                  <TabsTrigger value="roi" className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
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
