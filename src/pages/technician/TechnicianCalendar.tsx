import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';

export default function TechnicianCalendar() {
  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">My Calendar</h1>
        <AppointmentCalendar />
      </div>
    </TechnicianDashboardLayout>
  );
}
