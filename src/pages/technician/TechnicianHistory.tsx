import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';

export default function TechnicianHistory() {
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job History</h1>
          <p className="text-muted-foreground mt-1">View your completed jobs and performance</p>
        </div>
        <CompletedJobsHistory />
      </div>
    </TechnicianDashboardLayout>
  );
}
