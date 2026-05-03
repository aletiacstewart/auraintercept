import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { useIndustryPack } from '@/hooks/useIndustryPack';

export default function TechnicianJobs() {
  const { pack } = useIndustryPack();
  const jobNoun = pack?.terminology?.job || 'Job';
  const jobNounPlural = `${jobNoun}s`;
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My {jobNounPlural}</h1>
          <p className="text-white mt-1">Manage your assigned {jobNoun.toLowerCase()} queue</p>
        </div>
        <TechnicianJobQueue />
      </div>
    </TechnicianDashboardLayout>
  );
}
