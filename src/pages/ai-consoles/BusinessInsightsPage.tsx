import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { InsightsReportForm } from '@/components/analytics/forms/InsightsReportForm';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BusinessInsightsPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  if (!companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No company associated with your account.</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Lightbulb}
            title="Business Insights"
            description="AI-powered business intelligence and insights"
            featureColor="analytics"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/ai-consoles/business-management')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Console
              </Button>
            }
          />
          <InsightsReportForm 
            companyId={companyId} 
            onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
