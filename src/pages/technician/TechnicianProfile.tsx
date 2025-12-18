import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { ProfileSettings } from '@/components/employee/ProfileSettings';

export default function TechnicianProfile() {
  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your personal information</p>
        <ProfileSettings />
      </div>
    </TechnicianDashboardLayout>
  );
}
