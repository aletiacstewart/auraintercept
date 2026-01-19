import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, Calendar, FileText, Receipt, Package, ShieldCheck, Briefcase, Users, Building2, UserCheck, UsersRound } from 'lucide-react';
import { LeadsManager } from '@/components/leads/LeadsManager';
import { AppointmentsManager } from '@/components/appointments/AppointmentsManager';
import { QuotesManager } from '@/components/quotes/QuotesManager';
import { InvoicesManager } from '@/components/invoices/InvoicesManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { CompaniesManager } from '@/components/businessops/CompaniesManager';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CustomersManager } from '@/components/businessops/CustomersManager';

interface BusinessOpsHubTabsProps {
  defaultTab?: string;
}

export function BusinessOpsHubTabs({ defaultTab = 'sales' }: BusinessOpsHubTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      {/* Dark pill-based navigation container */}
      <div className="bg-card rounded-[2rem] p-6 border border-border/30">
        <TabsList className="flex flex-wrap gap-3 bg-transparent h-auto p-0 justify-start">
          <TabsTrigger 
            value="sales" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card-foreground/10 border border-card-foreground/30 text-card-foreground/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/50 data-[state=active]:shadow-md transition-all hover:bg-card-foreground/15"
          >
            <DollarSign className="h-4 w-4" />
            <span>Sales</span>
          </TabsTrigger>
          <TabsTrigger 
            value="operations" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card-foreground/10 border border-card-foreground/30 text-card-foreground/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/50 data-[state=active]:shadow-md transition-all hover:bg-card-foreground/15"
          >
            <Calendar className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card-foreground/10 border border-card-foreground/30 text-card-foreground/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/50 data-[state=active]:shadow-md transition-all hover:bg-card-foreground/15"
          >
            <Package className="h-4 w-4" />
            <span>Inventory</span>
          </TabsTrigger>
          <TabsTrigger 
            value="people" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card-foreground/10 border border-card-foreground/30 text-card-foreground/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/50 data-[state=active]:shadow-md transition-all hover:bg-card-foreground/15"
          >
            <UsersRound className="h-4 w-4" />
            <span>People</span>
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card-foreground/10 border border-card-foreground/30 text-card-foreground/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/50 data-[state=active]:shadow-md transition-all hover:bg-card-foreground/15"
          >
            <Briefcase className="h-4 w-4" />
            <span>All Business Ops</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Sales Tab */}
      <TabsContent value="sales" className="mt-6">
        <Accordion type="single" collapsible defaultValue="leads" className="space-y-4">
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
        </Accordion>
      </TabsContent>

      {/* Operations Tab */}
      <TabsContent value="operations" className="mt-6">
        <Accordion type="single" collapsible defaultValue="appointments" className="space-y-4">
          <AccordionItem value="appointments" className="border border-border rounded-lg bg-background px-4">
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

      {/* Inventory Tab */}
      <TabsContent value="inventory" className="mt-6">
        <Accordion type="single" collapsible defaultValue="inventory-items" className="space-y-4">
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
          <AccordionItem value="warranties" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-feature-warranties" />
                <span className="font-semibold text-foreground">Warranties</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WarrantiesManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>

      {/* People Tab */}
      <TabsContent value="people" className="mt-6">
        <Accordion type="single" collapsible defaultValue="companies" className="space-y-4">
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
        <Accordion type="single" collapsible defaultValue="all-leads" className="space-y-4">
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
          <AccordionItem value="all-warranties" className="border border-border rounded-lg bg-background px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-foreground">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-feature-warranties" />
                <span className="font-semibold text-foreground">Warranties</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WarrantiesManager />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
    </Tabs>
  );
}
