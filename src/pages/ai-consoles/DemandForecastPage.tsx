import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { ForecastForm } from '@/components/analytics/forms/ForecastForm';
import { useNavigate } from 'react-router-dom';
import { LineChart } from 'lucide-react';

export default function DemandForecastPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={LineChart}
            title="Revenue Forecast"
            description="Forecast revenue and staffing needs"
            featureColor="invoices"
            showAuraBar
          />

          {companyId ? (
            <ForecastForm
              companyId={companyId}
              onCancel={() => navigate('/dashboard/ai-consoles/business-mgt-ops')}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-white">No company associated with your account.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
