import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { ClipboardList, History, Calendar } from 'lucide-react';

const TechnicianCalendar = () => {
  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
          <p className="text-muted-foreground">View and manage your scheduled appointments and job assignments</p>
        </div>
        
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue" className="flex items-center gap-2">
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

          <TabsContent value="queue">
            <TechnicianJobQueue />
          </TabsContent>

          <TabsContent value="history">
            <CompletedJobsHistory />
          </TabsContent>

          <TabsContent value="calendar">
            <AppointmentCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </RoleDashboardLayout>
  );
};

export default TechnicianCalendar;
