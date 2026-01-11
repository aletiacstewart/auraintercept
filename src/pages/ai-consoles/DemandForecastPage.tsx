import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ForecastForm } from '@/components/analytics/forms/ForecastForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemandForecastPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No company associated with your account.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Demand Forecast</h1>
            <p className="text-muted-foreground">Predict future demand and trends</p>
          </div>
        </div>

        <ForecastForm 
          companyId={companyId} 
          onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
        />
      </div>
    </DashboardLayout>
  );
}
