import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Calendar, ClipboardList, History, Briefcase, Plus, Link2 } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader, getQueueLabels } from '@/lib/industryNavLabels';
import { PendingAuraDraftsPanel } from '@/components/automation/PendingAuraDraftsPanel';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeeAppointments() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { pack } = useIndustryPack();
  const apptHeader = getPageHeader('appointments', pack);
  const queueLabels = getQueueLabels(pack);
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const isRestaurant = pack?.industry_id === 'restaurants';
  const isPlatformAdmin = userRole === 'platform_admin';

  if (isRestaurant && !isPlatformAdmin) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={Link2}
              title="Reservations are handled via Smart Links"
              description="Aura texts guests a link to your booking page, menu, hours, or catering form."
              featureColor="fieldops"
            />
            <div className="rounded-lg border border-border/50 bg-muted/20 p-8 text-center space-y-4">
              <p className="text-muted-foreground max-w-xl mx-auto">
                This platform does not manage in-app restaurant reservations. Configure your
                external booking link, menu, hours, and catering form in the Customer Portal,
                and Aura will share them via voice and chat.
              </p>
              <Button onClick={() => navigate('/dashboard/ai-consoles/customer-portal')}>
                Configure Smart Links
              </Button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

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
              <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="truncate">Add Appointment</span>
              </Button>
            }
          />
          <InlineFormHost />
          <PendingAuraDraftsPanel channel="appointment" title="Pending Aura Appointment Drafts" />
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

          <Tabs defaultValue="calendar" className="w-full min-w-0 overflow-hidden">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-border/50 bg-muted/30 p-1.5 sm:inline-flex sm:w-auto sm:rounded-full">
              <TabsTrigger value="calendar" className="min-w-0 flex items-center gap-2 px-2 sm:px-4 py-2 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Calendar className="h-4 w-4" />
                <span className="truncate">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="min-w-0 flex items-center gap-2 px-2 sm:px-4 py-2 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <ClipboardList className="h-4 w-4" />
                <span className="truncate">{queueLabels.queueTab}</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="min-w-0 flex items-center gap-2 px-2 sm:px-4 py-2 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <History className="h-4 w-4" />
                <span className="truncate">History</span>
              </TabsTrigger>
              <TabsTrigger value="all-jobs" className="min-w-0 flex items-center gap-2 px-2 sm:px-4 py-2 rounded-md sm:rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Briefcase className="h-4 w-4" />
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
      </PageContainer>
    </DashboardLayout>
  );
}