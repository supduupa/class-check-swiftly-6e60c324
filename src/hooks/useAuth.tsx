import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        // Handle JWT expiration by signing out
        if (error.code === 'PGRST301' || error.code === 'PGRST303' || error.message?.includes('JWT')) {
          console.log('JWT expired, signing out...');
          await supabase.auth.signOut();
          return null;
        }

        // Only log non-network errors to avoid console noise
        if (!error.message?.includes('Failed to fetch')) {
          console.error('Error fetching profile:', error);
        }

        return null;
      }

      // If no profile exists yet, create one for this authenticated user
      if (!data) {
        const fallbackName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'User';

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            full_name: fallbackName,
            email: authUser.email ?? null,
            role: 'Student'
          })
          .select('*')
          .maybeSingle();

        if (createError) {
          // If profile was created in parallel by another request, fetch again
          const { data: refetchedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (refetchedProfile) {
            return refetchedProfile;
          }

          if (!createError.message?.includes('duplicate key') && createError.code !== '23505') {
            console.error('Error creating profile:', createError);
          }
          return null;
        }

        return createdProfile;
      }

      return data;
    } catch (error) {
      // Only log non-network errors to avoid console noise
      if (error instanceof Error && !error.message?.includes('Failed to fetch')) {
        console.error('Error fetching profile:', error);
      }
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
          // Skip re-fetching profile on token refresh if we already have it
          if (event === 'TOKEN_REFRESHED' && profile) {
            setLoading(false);
            return;
          }
          setTimeout(async () => {
            if (!isMounted) return;
            const profileData = await fetchProfile(session.user);
            if (isMounted) {
              setProfile(profileData);
              setLoading(false);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user);
        if (isMounted) setProfile(profileData);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};