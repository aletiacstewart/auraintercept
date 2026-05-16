import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { PerformanceReportForm } from '@/components/analytics/forms/PerformanceReportForm';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export default function PerformanceReportPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={BarChart3}
            title="Performance Report"
            description="Review team output, goals, and trends"
            featureColor="analytics"
            showAuraBar
          />

          {companyId ? (
            <PerformanceReportForm
              companyId={companyId}
              onCancel={() => navigate('/dashboard/ai-consoles/business-mgt-ops')}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-foreground">No company associated with your account.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
