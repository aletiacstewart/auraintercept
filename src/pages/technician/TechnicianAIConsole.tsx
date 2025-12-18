import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { useAuth } from '@/contexts/AuthContext';

export default function TechnicianAIConsole() {
  const { companyId } = useAuth();

  return (
    <TechnicianDashboardLayout>
      <div className="h-full">
        {companyId ? (
          <FieldOpsAgentConsole companyId={companyId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    </TechnicianDashboardLayout>
  );
}
