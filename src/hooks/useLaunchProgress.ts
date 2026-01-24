import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_MILESTONES, Milestone } from "@/components/onboarding/GoLiveTimeline";

interface LaunchProgress {
  id: string;
  company_id: string;
  launch_type: 'concierge' | 'self_guided';
  target_go_live_date: string | null;
  current_phase: 'setup' | 'testing' | 'soft_launch' | 'live';
  kickoff_scheduled_at: string | null;
  kickoff_completed_at: string | null;
  started_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LaunchMilestone {
  id: string;
  company_id: string;
  milestone_key: string;
  target_day: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string | null;
}

interface RoleMapping {
  id: string;
  company_id: string;
  role: string;
  currently_handled_by: string;
  pain_level: number | null;
  mapped_agent_type: string | null;
  auto_activated: boolean | null;
  created_at: string | null;
}

export function useLaunchProgress() {
  const { companyId } = useAuth();
  const [launchProgress, setLaunchProgress] = useState<LaunchProgress | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [roleMappings, setRoleMappings] = useState<RoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    fetchLaunchData();
  }, [companyId]);

  const fetchLaunchData = async () => {
    if (!companyId) return;

    try {
      // Fetch launch progress
      const { data: progressData } = await supabase
        .from('launch_progress')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (progressData) {
        setLaunchProgress(progressData as LaunchProgress);
        if (progressData.started_at) {
          setStartDate(new Date(progressData.started_at));
        }
      }

      // Fetch completed milestones
      const { data: milestonesData } = await supabase
        .from('launch_milestones')
        .select('*')
        .eq('company_id', companyId);

      const completedKeys = new Set(
        (milestonesData || [])
          .filter((m: LaunchMilestone) => m.completed_at)
          .map((m: LaunchMilestone) => m.milestone_key)
      );

      // Merge with default milestones
      const mergedMilestones: Milestone[] = DEFAULT_MILESTONES.map(m => ({
        ...m,
        isComplete: completedKeys.has(m.key),
      }));
      setMilestones(mergedMilestones);

      // Fetch role mappings
      const { data: mappingsData } = await supabase
        .from('role_mappings')
        .select('*')
        .eq('company_id', companyId);

      setRoleMappings(mappingsData || []);
    } catch (error) {
      console.error('Error fetching launch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeMilestone = async (key: string, notes?: string) => {
    if (!companyId) return;

    try {
      const milestone = DEFAULT_MILESTONES.find(m => m.key === key);
      
      await supabase.from('launch_milestones').upsert({
        company_id: companyId,
        milestone_key: key,
        target_day: milestone?.targetDay || null,
        completed_at: new Date().toISOString(),
        notes: notes || null,
      });

      // Update local state
      setMilestones(prev => prev.map(m => 
        m.key === key ? { ...m, isComplete: true } : m
      ));

      // Check if we need to update phase
      const updatedMilestones = milestones.map(m => 
        m.key === key ? { ...m, isComplete: true } : m
      );
      
      const setupComplete = updatedMilestones
        .filter(m => m.phase === 'setup')
        .every(m => m.isComplete);
      
      const testingComplete = updatedMilestones
        .filter(m => m.phase === 'testing')
        .every(m => m.isComplete);

      const softLaunchComplete = updatedMilestones
        .filter(m => m.phase === 'soft_launch')
        .every(m => m.isComplete);

      let newPhase: LaunchProgress['current_phase'] = 'setup';
      if (softLaunchComplete) newPhase = 'live';
      else if (testingComplete) newPhase = 'soft_launch';
      else if (setupComplete) newPhase = 'testing';

      if (launchProgress && newPhase !== launchProgress.current_phase) {
        await supabase
          .from('launch_progress')
          .update({ current_phase: newPhase, updated_at: new Date().toISOString() })
          .eq('company_id', companyId);
        
        setLaunchProgress(prev => prev ? { ...prev, current_phase: newPhase } : null);
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
    }
  };

  const uncompleteMilestone = async (key: string) => {
    if (!companyId) return;

    try {
      await supabase
        .from('launch_milestones')
        .update({ completed_at: null })
        .eq('company_id', companyId)
        .eq('milestone_key', key);

      setMilestones(prev => prev.map(m => 
        m.key === key ? { ...m, isComplete: false } : m
      ));
    } catch (error) {
      console.error('Error uncompleting milestone:', error);
    }
  };

  const getProgress = () => {
    const completedCount = milestones.filter(m => m.isComplete).length;
    return {
      completedCount,
      totalCount: milestones.length,
      percentage: milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0,
    };
  };

  const getCurrentDay = () => {
    const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  return {
    launchProgress,
    milestones,
    roleMappings,
    isLoading,
    startDate,
    completeMilestone,
    uncompleteMilestone,
    getProgress,
    getCurrentDay,
    refetch: fetchLaunchData,
  };
}
