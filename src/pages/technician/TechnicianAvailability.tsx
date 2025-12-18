import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';

export default function TechnicianAvailability() {
  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">My Availability</h1>
        <p className="text-muted-foreground mb-6">Set your working hours and time off</p>
        <AvailabilityEditor />
      </div>
    </TechnicianDashboardLayout>
  );
}
