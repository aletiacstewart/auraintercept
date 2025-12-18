import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JobRoleType, JOB_ROLE_CONFIGS } from '@/config/jobRoleDashboards';

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
          const types = data.map(d => d.job_type as JobRoleType);
          setJobTypes(types);
          // Primary is the first assigned job type
          setPrimaryJobType(types[0]);
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
