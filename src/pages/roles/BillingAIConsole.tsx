import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RoleDashboardLayout } from "@/components/dashboard/RoleDashboardLayout";
import { BillingAgentConsole } from "@/components/billing/BillingAgentConsole";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingAIConsole() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Billing AI Console | Dashboard";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="billing_specialist">
      <main className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Billing AI Console</h1>
          <p className="text-muted-foreground">
            AI-powered assistant for invoicing, quotes, and payment management.
          </p>
        </header>

        <section aria-label="Billing AI Console">
          <BillingAgentConsole companyId={companyId || undefined} />
        </section>
      </main>
    </RoleDashboardLayout>
  );
}
