import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmployeeAvailability() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('availability_json')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Availability</h1>
          <p className="text-muted-foreground">
            Set your working hours for each day of the week
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <AvailabilityEditor 
            initialAvailability={profile?.availability_json as any}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
