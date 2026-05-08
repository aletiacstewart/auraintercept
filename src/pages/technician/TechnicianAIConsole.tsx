import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { FieldOpsAgentConsole } from '@/components/employee/FieldOpsAgentConsole';
import { useAuth } from '@/contexts/AuthContext';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';

export default function TechnicianAIConsole() {
  const { companyId, loading } = useAuth();
  const { pack } = useIndustryPack();
  const cfg = pack ? getIndustryServiceConsoleConfig(pack) : null;
  const title = cfg?.workerConsoleTitle ?? 'Service Management Console';
  const subtitle = cfg?.workerConsoleDescription ?? 'Your intelligent operations assistant';
  const specialists = cfg?.specialistShow ?? ['diagnostic', 'permit_code'];
  const specialistTitle = cfg?.specialistTitle ?? 'Need a Specialist?';
  const specialistSubtitle = cfg?.specialistSubtitle ?? 'Quick access to specialist operatives.';

  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
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
                show={specialists}
                title={specialistTitle}
                subtitle={specialistSubtitle}
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
