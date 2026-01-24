import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAgentReviewCount = () => {
  const { companyId } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        const { count: reviewCount, error } = await supabase
          .from('ai_agent_events')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('requires_human_review', true);

        if (error) throw error;
        setCount(reviewCount || 0);
      } catch (error) {
        console.error('Failed to fetch review count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('review-count')
      .on('postgres_changes' as const, {
        event: '*',
        schema: 'public',
        table: 'ai_agent_events',
        filter: `company_id=eq.${companyId}`
      }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { count, isLoading };
};

export default useAgentReviewCount;
