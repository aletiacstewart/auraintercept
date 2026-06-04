import { useState } from 'react';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { CompanyJobQueue } from '@/components/company/CompanyJobQueue';
import { AddAppointmentForm } from '@/components/appointments/AddAppointmentForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FormShell } from '@/components/ui/form-shell';
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';
import { Calendar, ClipboardList, History, Briefcase, Plus, X } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getQueueLabels } from '@/lib/industryNavLabels';

interface AppointmentsManagerProps {
  onClose?: () => void;
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({ onClose }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { pack } = useIndustryPack();
  const queueLabels = getQueueLabels(pack);

  return (
    <InlineFormProvider>
    <div className="min-w-0 space-y-4 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-feature-appointments/15">
            <Calendar className="h-5 w-5 text-feature-appointments" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground">Appointments</h3>
            <p className="text-sm text-muted-foreground">
              View and manage scheduled appointments
            </p>
          </div>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="truncate">Add Appointment</span>
          </Button>
          <FormShell
            id="add-appointment"
            title="Add Appointment"
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0"
          >
            <AddAppointmentForm
              onSuccess={() => setIsAddOpen(false)}
              onCancel={() => setIsAddOpen(false)}
            />
          </FormShell>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <InlineFormHost />

      <Tabs defaultValue="calendar" className="w-full min-w-0 overflow-hidden">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-border/50 bg-muted/30 p-1.5 sm:inline-flex sm:w-auto sm:rounded-full">
          <TabsTrigger value="calendar" className="min-w-0 flex items-center gap-1.5 rounded-md sm:rounded-full">
            <Calendar className="h-3 w-3" />
            <span className="truncate">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="min-w-0 flex items-center gap-1.5 rounded-md sm:rounded-full">
            <ClipboardList className="h-3 w-3" />
            <span className="truncate">{queueLabels.queueTab}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="min-w-0 flex items-center gap-1.5 rounded-md sm:rounded-full">
            <History className="h-3 w-3" />
            <span className="truncate">History</span>
          </TabsTrigger>
          <TabsTrigger value="all-jobs" className="min-w-0 flex items-center gap-1.5 rounded-md sm:rounded-full">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{queueLabels.allJobsTab}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <AppointmentCalendar />
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <TechnicianJobQueue emptyTitle={queueLabels.emptyTitle} emptyHint={queueLabels.emptyHint} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <CompletedJobsHistory />
        </TabsContent>
        <TabsContent value="all-jobs" className="mt-4">
          <CompanyJobQueue emptyTitle={queueLabels.emptyTitle} emptyHint={queueLabels.emptyHint} />
        </TabsContent>
      </Tabs>
    </div>
    </InlineFormProvider>
  );
};
