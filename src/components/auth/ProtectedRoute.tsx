import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'platform_admin' | 'company_admin' | 'employee';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
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
    // Redirect technician routes to employee auth mode
    const isTechnicianRoute = location.pathname.startsWith('/technician');
    const authPath = isTechnicianRoute ? '/auth?mode=employee' : '/auth';
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // If user doesn't have required role, redirect to their appropriate dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
