import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAuth } from '@/contexts/AuthContext';
import { PerformanceReportForm } from '@/components/analytics/forms/PerformanceReportForm';
import { useNavigate } from 'react-router-dom';

export default function PerformanceReportPage() {
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
        <PerformanceReportForm 
          companyId={companyId} 
          onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
