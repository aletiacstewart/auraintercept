import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'platform_admin' | 'company_admin' | 'employee';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  
  // Stability guard: once we've seen a user, don't unmount for transient loading states
  const hasSeenUser = useRef(false);
  if (user) {
    hasSeenUser.current = true;
  }

  // Only show skeleton if loading AND we've never seen a user
  // This prevents iframe destruction during token refresh or background auth events
  if (loading && !hasSeenUser.current) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect technician routes to employee auth mode with login tab
    const isTechnicianRoute = location.pathname.startsWith('/technician');
    const authPath = isTechnicianRoute ? '/auth?mode=employee&tab=login' : '/auth';
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Show a clear access-denied screen instead of silently redirecting,
    // so missing-role situations are visible to the user.
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-border rounded-lg p-6 space-y-3 text-center">
          <h1 className="text-lg font-semibold text-foreground">Access restricted</h1>
          <p className="text-sm text-muted-foreground">
            This page is only available to <span className="font-medium">{requiredRole}</span> accounts.
            You are signed in as <span className="font-medium">{userRole ?? 'unknown'}</span>.
          </p>
          <a href="/dashboard" className="inline-block text-sm text-primary underline">Return to dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
