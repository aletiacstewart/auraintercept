import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { useAuth } from '@/contexts/AuthContext';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';

export default function TechnicianAIConsole() {
  const { companyId, loading } = useAuth();

  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Operations Console</h1>
          <p className="text-muted-foreground mt-1">Your intelligent field operations assistant</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : companyId ? (
          <>
            <FieldOpsAgentConsole companyId={companyId} />
            <div className="mt-6">
              <SpecialistOperativesLauncher
                show={['diagnostic', 'permit_code']}
                title="Need a Specialist?"
                subtitle="Quick access to diagnostic and permit/code lookups while on-site."
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No company associated with this account.</p>
          </div>
        )}
      </div>
    </TechnicianDashboardLayout>
  );
}
