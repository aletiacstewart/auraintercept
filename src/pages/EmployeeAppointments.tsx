import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { CompanyJobQueue } from '@/components/company/CompanyJobQueue';
import { AddAppointmentForm } from '@/components/appointments/AddAppointmentForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Calendar, ClipboardList, History, Briefcase, Plus } from 'lucide-react';

export default function EmployeeAppointments() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Calendar}
            title="Appointments"
            description="View and manage scheduled appointments"
            action={
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0">
                  <AddAppointmentForm
                    onSuccess={() => setIsAddOpen(false)}
                    onCancel={() => setIsAddOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            }
          />

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Job Queue
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="all-jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                All Jobs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="mt-4">
              <AppointmentCalendar />
            </TabsContent>
            <TabsContent value="jobs" className="mt-4">
              <TechnicianJobQueue />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <CompletedJobsHistory />
            </TabsContent>
            <TabsContent value="all-jobs" className="mt-4">
              <CompanyJobQueue />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}