import { useState } from 'react';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { CompanyJobQueue } from '@/components/company/CompanyJobQueue';
import { AddAppointmentForm } from '@/components/appointments/AddAppointmentForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, ClipboardList, History, Briefcase, Plus, X } from 'lucide-react';

interface AppointmentsManagerProps {
  onClose?: () => void;
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({ onClose }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Appointments</h3>
          <p className="text-sm text-foreground/70">
            View and manage scheduled appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="calendar" className="flex items-center gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2 text-xs">
            <ClipboardList className="h-3.5 w-3.5" />
            Job Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
          <TabsTrigger value="all-jobs" className="flex items-center gap-2 text-xs">
            <Briefcase className="h-3.5 w-3.5" />
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
  );
};
