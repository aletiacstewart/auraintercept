import { useEffect } from "react";
import { RoleDashboardLayout } from "@/components/dashboard/RoleDashboardLayout";
import { ReportsDashboard } from "@/components/company/ReportsDashboard";

export default function BillingReports() {
  useEffect(() => {
    document.title = "Billing Reports | Dashboard";
  }, []);

  return (
    <RoleDashboardLayout jobRole="billing_specialist">
      <main className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Billing reports</h1>
          <p className="text-muted-foreground">
            Scheduled digests and financial reporting for your company.
          </p>
        </header>

        <section aria-label="Billing reports dashboard">
          <ReportsDashboard />
        </section>
      </main>
    </RoleDashboardLayout>
  );
}
