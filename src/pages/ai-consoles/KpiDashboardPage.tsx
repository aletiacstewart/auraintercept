import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { KpiDashboardForm } from '@/components/analytics/forms/KpiDashboardForm';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';

export default function KpiDashboardPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Gauge}
            title="KPI Dashboard"
            description="Build and export KPI dashboards for your business"
            featureColor="analytics"
            showAuraBar
          />

          {companyId ? (
            <KpiDashboardForm
              companyId={companyId}
              onCancel={() => navigate('/dashboard/ai-consoles/analytics')}
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
