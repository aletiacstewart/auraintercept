import React from 'react';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { ProfileSettings } from '@/components/employee/ProfileSettings';

export default function TechnicianProfile() {
  return (
    <TechnicianDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information</p>
        </div>
        <ProfileSettings />
      </div>
    </TechnicianDashboardLayout>
  );
}
