import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerInsightsForm } from '@/components/analytics/forms/CustomerInsightsForm';
import { useNavigate } from 'react-router-dom';
import { UsersRound } from 'lucide-react';

export default function CustomerInsightsPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={UsersRound}
            title="Customer Insights"
            description="Understand behavior, segments, and retention"
            featureColor="customers"
            showAuraBar
          />

          {companyId ? (
            <CustomerInsightsForm
              companyId={companyId}
              onCancel={() => navigate('/dashboard/ai-consoles/analytics')}
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
