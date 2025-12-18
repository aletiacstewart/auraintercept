import { ReactNode, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RoleDashboardLayout } from "@/components/dashboard/RoleDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeJobRole } from "@/hooks/useEmployeeJobRole";
import type { JobRoleType } from "@/config/jobRoleDashboards";

/**
 * UI-only layout chooser.
 * Employees with a non-technician job type should keep their role sidebar
 * when navigating to shared pages (e.g. Invoices/Quotes/Messages).
 */
export function RoleAwareDashboardLayout({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const { primaryJobType, loading } = useEmployeeJobRole();

  useEffect(() => {
    // Temporary debug to confirm which layout is chosen
    console.debug("[RoleAwareDashboardLayout]", { userRole, primaryJobType, loading });
  }, [userRole, primaryJobType, loading]);


  // Wait for job role to load before deciding which layout to show
  if (userRole === "employee" && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole === "employee" && primaryJobType && primaryJobType !== "technician") {
    return <RoleDashboardLayout jobRole={primaryJobType as JobRoleType}>{children}</RoleDashboardLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
