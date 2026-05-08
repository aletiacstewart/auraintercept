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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-feature-appointments/15">
            <Calendar className="h-5 w-5 text-feature-appointments" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Appointments</h3>
            <p className="text-sm text-muted-foreground">
              View and manage scheduled appointments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
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

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" />
            {queueLabels.queueTab}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-3 w-3" />
            History
          </TabsTrigger>
          <TabsTrigger value="all-jobs" className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" />
            {queueLabels.allJobsTab}
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
