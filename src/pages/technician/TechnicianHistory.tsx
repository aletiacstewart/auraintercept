import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';

export default function TechnicianHistory() {
  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Job History</h1>
        <p className="text-muted-foreground mb-6">View your completed jobs and performance</p>
        <CompletedJobsHistory />
      </div>
    </TechnicianDashboardLayout>
  );
}
