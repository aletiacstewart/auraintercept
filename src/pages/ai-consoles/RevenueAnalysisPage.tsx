import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { RevenueAnalysisForm } from '@/components/analytics/forms/RevenueAnalysisForm';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export default function RevenueAnalysisPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={DollarSign}
            title="Revenue Analysis"
            description="Analyze revenue, invoices, and paid performance"
            featureColor="invoices"
            showAuraBar
          />

          {companyId ? (
            <RevenueAnalysisForm
              companyId={companyId}
              onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
            />
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
