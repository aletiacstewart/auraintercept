import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { InsightsReportForm } from '@/components/analytics/forms/InsightsReportForm';
import { useNavigate } from 'react-router-dom';

export default function BusinessInsightsPage() {
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
      <InsightsReportForm 
        companyId={companyId} 
        onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
      />
    </DashboardLayout>
  );
}