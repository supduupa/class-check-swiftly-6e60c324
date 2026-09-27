import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MAX_PROFILE_FETCH_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 250;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const authReadyRef = useRef(false);
  const profileCreationAttemptedRef = useRef<Set<string>>(new Set());

  const fetchProfile = async (authUser: User): Promise<Profile | null> => {
    for (let attempt = 0; attempt < MAX_PROFILE_FETCH_ATTEMPTS; attempt += 1) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST301' || error.code === 'PGRST303' || error.message?.includes('JWT')) {
            console.log('JWT expired, signing out...');
            await supabase.auth.signOut();
            return null;
          }

          if (!error.message?.includes('Failed to fetch')) {
            console.error('Error fetching profile:', error);
          }

          return null;
        }

        if (data) {
          return data;
        }

        if (attempt < MAX_PROFILE_FETCH_ATTEMPTS - 1) {
          await wait(RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }

        if (profileCreationAttemptedRef.current.has(authUser.id)) {
          return null;
        }

        const {
          data: { user: verifiedUser },
          error: verifyError,
        } = await supabase.auth.getUser();

        if (verifyError || !verifiedUser || verifiedUser.id !== authUser.id) {
          return null;
        }

        profileCreationAttemptedRef.current.add(authUser.id);

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
            role: 'Student',
          })
          .select('*')
          .maybeSingle();

        if (createError) {
          const { data: refetchedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (refetchedProfile) {
            return refetchedProfile;
          }

          if (
            !createError.message?.includes('duplicate key') &&
            createError.code !== '23505' &&
            createError.code !== '42501'
          ) {
            console.error('Error creating profile:', createError);
          }

          return null;
        }

        return createdProfile;
      } catch (error) {
        if (error instanceof Error && !error.message?.includes('Failed to fetch')) {
          console.error('Error fetching profile:', error);
        }
        return null;
      }
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      if (nextSession) {
        setSession(nextSession);
        setUser(nextSession.user);
      } else if (!authReadyRef.current) {
        setSession(null);
        setUser(null);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;

      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      authReadyRef.current = true;
      setAuthReady(true);

      if (!existingSession?.user) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!authReady) {
      return;
    }

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfile(null);
    setProfileLoading(true);

    void (async () => {
      const profileData = await fetchProfile(user);
      if (!cancelled) {
        setProfile(profileData);
        setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileLoading(false);
  };

  const value = {
    user,
    session,
    profile,
    loading: !authReady || profileLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};