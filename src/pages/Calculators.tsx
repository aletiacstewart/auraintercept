import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CostCalculator } from '@/components/integrations/CostCalculator';
import { ROICalculator } from '@/components/integrations/ROICalculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp } from 'lucide-react';

export default function Calculators() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost & ROI Calculator</h1>
          <p className="text-muted-foreground">Estimate costs and calculate potential savings from AI-powered reminders</p>
        </div>

        {/* Calculator Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-primary" />
              Financial Planning Tools
            </CardTitle>
            <CardDescription className="text-white/70">Plan your budget and measure return on investment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="costs" className="flex items-center gap-1">
                  <Calculator className="w-4 h-4" />
                  Estimate Costs
                </TabsTrigger>
                <TabsTrigger value="roi" className="flex items-center gap-1">
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
    </DashboardLayout>
  );
}
