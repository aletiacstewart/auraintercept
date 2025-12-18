import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { useAuth } from '@/contexts/AuthContext';

export default function TechnicianAIConsole() {
  const { companyId, loading } = useAuth();

  return (
    <TechnicianDashboardLayout>
      <div className="h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : companyId ? (
          <FieldOpsAgentConsole companyId={companyId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No company associated with this account.</p>
          </div>
        )}
      </div>
    </TechnicianDashboardLayout>
  );
}
