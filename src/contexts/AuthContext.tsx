import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string;
  email: string | null;
  balance: number;
  can_view_tracker: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  onBalanceIncrease: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Callback for balance increase
  const balanceCallbackRef = useRef<(() => void) | null>(null);
  const previousBalanceRef = useRef<number | null>(null);

  const onBalanceIncrease = useCallback((callback: () => void) => {
    balanceCallbackRef.current = callback;
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const newProfile = data as Profile;
        
        // Check if balance increased
        if (previousBalanceRef.current !== null && 
            newProfile.balance > previousBalanceRef.current &&
            balanceCallbackRef.current) {
          balanceCallbackRef.current();
        }
        
        previousBalanceRef.current = newProfile.balance;
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsModerator(false);
        return;
      }

      const role = data?.role;
      setIsAdmin(role === 'admin');
      setIsModerator(role === 'moderator');
    } catch (err) {
      console.error('Error in checkUserRole:', err);
      setIsAdmin(false);
      setIsModerator(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkUserRole(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsModerator(false);
          previousBalanceRef.current = null;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to real-time profile changes for balance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as Profile;
          
          // Check if balance increased
          if (previousBalanceRef.current !== null && 
              newData.balance > previousBalanceRef.current &&
              balanceCallbackRef.current) {
            balanceCallbackRef.current();
          }
          
          previousBalanceRef.current = newData.balance;
          setProfile(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsModerator(false);
    previousBalanceRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isModerator,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        onBalanceIncrease,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
