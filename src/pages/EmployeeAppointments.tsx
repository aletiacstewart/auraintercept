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
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';
import { FormShell } from '@/components/ui/form-shell';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Calendar, ClipboardList, History, Briefcase, Plus } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader, getQueueLabels } from '@/lib/industryNavLabels';

export default function EmployeeAppointments() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { pack } = useIndustryPack();
  const apptHeader = getPageHeader('appointments', pack);
  const queueLabels = getQueueLabels(pack);

  return (
    <DashboardLayout>
      <PageContainer>
        <InlineFormProvider>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Calendar}
            title={apptHeader.title}
            description={apptHeader.description}
            featureColor="fieldops"
            action={
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Appointment
              </Button>
            }
          />
          <InlineFormHost />
          <FormShell
            id="appointment-add"
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

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="inline-flex h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1">
              <TabsTrigger value="calendar" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <ClipboardList className="h-4 w-4" />
                {queueLabels.queueTab}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="all-jobs" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Briefcase className="h-4 w-4" />
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
      </PageContainer>
    </DashboardLayout>
  );
}