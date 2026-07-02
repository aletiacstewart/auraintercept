import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, Calendar, FileText, Receipt, Package, Briefcase, Users, Building2, UserCheck, UsersRound } from 'lucide-react';
import { LeadsManager } from '@/components/leads/LeadsManager';
import { AppointmentsManager } from '@/components/appointments/AppointmentsManager';
import { QuotesManager } from '@/components/quotes/QuotesManager';
import { InvoicesManager } from '@/components/invoices/InvoicesManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { CompaniesManager } from '@/components/businessops/CompaniesManager';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CustomersManager } from '@/components/businessops/CustomersManager';
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';

interface BusinessOpsHubTabsProps {
  defaultTab?: string;
}

export function BusinessOpsHubTabs({ defaultTab = 'sales' }: BusinessOpsHubTabsProps) {
  return (
    <InlineFormProvider>
    <InlineFormHost className="mb-4" />
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        <TabsTrigger value="sales" className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          <span>Sales</span>
        </TabsTrigger>
        <TabsTrigger value="appointments" className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Appointments</span>
        </TabsTrigger>
        <TabsTrigger value="inventory" className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          <span>Inventory</span>
        </TabsTrigger>
        <TabsTrigger value="people" className="flex items-center gap-1.5">
          <UsersRound className="h-3.5 w-3.5" />
          <span>People</span>
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          <span>All Business Ops</span>
        </TabsTrigger>
      </TabsList>

      {/* Sales Tab */}
      <TabsContent value="sales" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="leads" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-feature-leads" />
                <span className="font-semibold text-foreground">Leads</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <LeadsManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="quotes" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-feature-quotes" />
                <span className="font-semibold text-foreground">Quotes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <QuotesManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="invoices" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-feature-invoices" />
                <span className="font-semibold text-foreground">Invoices</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <InvoicesManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* Appointments Tab */}
      <TabsContent value="appointments" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="appointments-section" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-feature-appointments" />
                <span className="font-semibold text-foreground">Appointments</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <AppointmentsManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* Inventory Tab */}
      <TabsContent value="inventory" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="inventory-items" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-feature-inventory" />
                <span className="font-semibold text-foreground">Inventory</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <InventoryManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* People Tab */}
      <TabsContent value="people" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="companies" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-feature-companies" />
                <span className="font-semibold text-foreground">Companies</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <CompaniesManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="employees" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-feature-employees" />
                <span className="font-semibold text-foreground">Employees</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <EmployeeManagement />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="customers" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-feature-customers" />
                <span className="font-semibold text-foreground">Customers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <CustomersManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* All Business Ops Tab */}
      <TabsContent value="all" className="mt-6">
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="all-leads" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-feature-leads" />
                <span className="font-semibold text-foreground">Leads</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <LeadsManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-appointments" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-feature-appointments" />
                <span className="font-semibold text-foreground">Appointments</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <AppointmentsManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-quotes" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-feature-quotes" />
                <span className="font-semibold text-foreground">Quotes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <QuotesManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-invoices" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-feature-invoices" />
                <span className="font-semibold text-foreground">Invoices</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <InvoicesManager />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="all-inventory" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-feature-inventory" />
                <span className="font-semibold text-foreground">Inventory</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <InventoryManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
    </Tabs>
    </InlineFormProvider>
  );
}
