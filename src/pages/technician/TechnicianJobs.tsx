import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';

export default function TechnicianJobs() {
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage your assigned job queue</p>
        </div>
        <TechnicianJobQueue />
      </div>
    </TechnicianDashboardLayout>
  );
}
