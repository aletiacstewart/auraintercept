import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';

export default function TechnicianJobs() {
  return (
    <TechnicianDashboardLayout>
      <div className="h-full">
        <TechnicianJobQueue />
      </div>
    </TechnicianDashboardLayout>
  );
}
