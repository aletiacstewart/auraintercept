import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { LeadForm } from '@/components/marketing/forms/LeadForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewLeadPage() {
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-[0.05em]">New Lead</h1>
            <p className="text-white/70">Capture a new lead for your business</p>
          </div>
        </div>

        <LeadForm 
          companyId={companyId} 
          onCancel={() => navigate('/dashboard/leads')}
          onSuccess={() => navigate('/dashboard/leads')}
        />
      </div>
    </DashboardLayout>
  );
}
