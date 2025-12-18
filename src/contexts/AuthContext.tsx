import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

// Map Stripe product IDs to tier names
const PRODUCT_TO_TIER: Record<string, SubscriptionTier> = {
  'prod_TbzYMyd0yO0shv': 'enterprise', // Enterprise Company Subscription - $250/month
};

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
      setSubscriptionTier('enterprise');
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
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscribed(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setInTrial(data?.in_trial ?? false);
      setTrialEndsAt(data?.trial_ends_at ?? null);
      
      if (data?.tier) {
        setSubscriptionTier(data.tier as SubscriptionTier);
      } else if (data?.product_id && PRODUCT_TO_TIER[data.product_id]) {
        setSubscriptionTier(PRODUCT_TO_TIER[data.product_id]);
      } else {
        setSubscriptionTier(data?.subscribed ? 'enterprise' : 'free');
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  }, [session?.access_token, user?.email, userRole]);

  const fetchUserData = async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (roleData) {
      setUserRole(roleData.role);
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileData) {
      setCompanyId(profileData.company_id);
    }
  };

  useEffect(() => {
    // Set up auth state listener - MUST NOT be async to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates in callback
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setCompanyId(null);
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
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
