import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ClipboardList, History } from 'lucide-react';

export default function EmployeeAppointments() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled appointments and job assignments
          </p>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Job Queue
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="jobs" className="mt-4">
            <TechnicianJobQueue />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <CompletedJobsHistory />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <AppointmentCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
