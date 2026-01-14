import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerInsightsForm } from '@/components/analytics/forms/CustomerInsightsForm';
import { useNavigate } from 'react-router-dom';

export default function CustomerInsightsPage() {
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
      <CustomerInsightsForm 
        companyId={companyId} 
        onCancel={() => navigate('/dashboard/ai-consoles/analytics')}
      />
    </DashboardLayout>
  );
}