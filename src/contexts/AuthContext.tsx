import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  companyId: string | null;
  subscribed: boolean;
  subscriptionTier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  inTrial: boolean;
  trialEndsAt: string | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [inTrial, setInTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token || !user?.email) return;
    
    // Bypass subscription for test accounts and platform admins
    const isTestAccount = user.email.endsWith('@test.com') || userRole === 'platform_admin';
    if (isTestAccount) {
      setSubscribed(true);
      setSubscriptionTier('command');
      setSubscriptionEnd(null);
      setInTrial(false);
      setTrialEndsAt(null);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Silently ignore auth errors (stale tokens during login/logout transitions)
        const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
        if (errMsg.includes('Auth session missing') || errMsg.includes('401') || errMsg.includes('Unauthorized')) {
          console.warn('Subscription check skipped: session not ready');
          return;
        }
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscribed(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setInTrial(data?.in_trial ?? false);
      setTrialEndsAt(data?.trial_ends_at ?? null);
      
      // Trust the tier returned from check-subscription edge function
      if (data?.tier) {
        setSubscriptionTier(data.tier as SubscriptionTier);
      } else {
        setSubscriptionTier(data?.subscribed ? 'command' : 'free');
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  }, [session?.access_token, user?.email, userRole]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Failed to load user role:', roleError);
      }

      setUserRole(roleData?.role ?? null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load user profile:', profileError);
      }

      setCompanyId(profileData?.company_id ?? null);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setUserRole(null);
      setCompanyId(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener - MUST NOT be async to prevent deadlocks
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only synchronous state updates in callback
      setSession(session);
      setUser(session?.user ?? null);

      // Only set loading=true for identity-changing events to avoid UI flicker
      const isIdentityChange = event === 'SIGNED_IN' || event === 'SIGNED_OUT';

      if (session?.user) {
        if (isIdentityChange) {
          setLoading(true);
        }
        // Defer Supabase calls with setTimeout to prevent deadlock
        setTimeout(async () => {
          try {
            await fetchUserData(session.user.id);
          } finally {
            if (isIdentityChange) {
              setLoading(false);
            }
          }
        }, 0);
      } else {
        setUserRole(null);
        setCompanyId(null);
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setInTrial(false);
        setTrialEndsAt(null);
        if (isIdentityChange) {
          setLoading(false);
        }
      }
    });

    // Check for existing session - don't toggle loading since it's already true
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          try {
            await fetchUserData(session.user.id);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription on session change and periodically
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 60000); // Every 60 seconds
      return () => clearInterval(interval);
    }
  }, [session?.access_token, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setCompanyId(null);
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setInTrial(false);
    setTrialEndsAt(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      companyId, 
      subscribed, 
      subscriptionTier, 
      subscriptionEnd,
      inTrial,
      trialEndsAt,
      signOut, 
      checkSubscription 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
