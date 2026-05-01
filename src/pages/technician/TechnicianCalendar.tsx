import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';

export default function TechnicianCalendar() {
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
          <p className="text-white mt-1">View and manage your schedule</p>
        </div>
        <AppointmentCalendar />
      </div>
    </TechnicianDashboardLayout>
  );
}
