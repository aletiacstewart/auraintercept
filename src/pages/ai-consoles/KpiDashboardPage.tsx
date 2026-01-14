import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { KpiDashboardForm } from '@/components/analytics/forms/KpiDashboardForm';
import { useNavigate } from 'react-router-dom';

export default function KpiDashboardPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-white/70">No company associated with your account.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <KpiDashboardForm 
        companyId={companyId} 
        onCancel={() => navigate('/dashboard/ai-consoles/analytics')}
      />
    </DashboardLayout>
  );
}