import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';

export default function TechnicianAvailability() {
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
          <p className="text-muted-foreground mt-1">Set your working hours and time off</p>
        </div>
        <AvailabilityEditor />
      </div>
    </TechnicianDashboardLayout>
  );
}
