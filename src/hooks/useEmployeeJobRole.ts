import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JobRoleType, JOB_ROLE_CONFIGS } from '@/config/jobRoleDashboards';

type DbEmployeeJobType =
  | 'technician'
  | 'booking_agent'
  | 'dispatch'
  | 'customer_service'
  | 'billing'
  | 'marketing'
  | 'inventory'
  | 'analytics';

function normalizeJobType(dbType: DbEmployeeJobType): JobRoleType {
  switch (dbType) {
    case 'billing':
      return 'billing_specialist';
    case 'marketing':
      return 'marketing_manager';
    case 'inventory':
      return 'inventory_manager';
    case 'analytics':
      return 'analytics_manager';
    default:
      return dbType;
  }
}

export function useEmployeeJobRole() {
  const { user, userRole } = useAuth();
  const [jobTypes, setJobTypes] = useState<JobRoleType[]>([]);
  const [primaryJobType, setPrimaryJobType] = useState<JobRoleType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobTypes() {
      if (!user || userRole !== 'employee') {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employee_job_assignments')
          .select('job_type')
          .eq('employee_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const types = data.map((d) => normalizeJobType(d.job_type as DbEmployeeJobType));
          setJobTypes(types);
          // Primary is the first assigned job type
          setPrimaryJobType(types[0]);
        } else {
          setJobTypes([]);
          setPrimaryJobType(null);
        }
      } catch (err) {
        console.error('Error fetching job types:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobTypes();
  }, [user, userRole]);

  const getConfig = (jobType: JobRoleType) => JOB_ROLE_CONFIGS[jobType];

  const hasJobType = (type: JobRoleType) => jobTypes.includes(type);

  return {
    jobTypes,
    primaryJobType,
    loading,
    getConfig,
    hasJobType,
  };
}
