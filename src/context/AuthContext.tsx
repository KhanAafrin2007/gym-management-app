import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppUser, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error: Error | null; role?: UserRole }>;
  signUp: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAppUserProfile = useCallback(async (authUserId: string, userEmail?: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching app_user profile:', error.message);
        setAppUser(null);
        setRole('pending');
        return 'pending';
      }

      if (data) {
        setAppUser(data as AppUser);
        const resolvedRole = (data.role as UserRole) || 'pending';
        setRole(resolvedRole);
        return resolvedRole;
      } else {
        const fallback: AppUser = {
          auth_user_id: authUserId,
          email: userEmail || null,
          role: 'pending',
          member_id: null,
          trainer_id: null,
          created_at: new Date().toISOString(),
        };
        setAppUser(fallback);
        setRole('pending');
        return 'pending';
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
      setRole('pending');
      return 'pending';
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchAppUserProfile(session.user.id, session.user.email).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setUser(null);
        setAppUser(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchAppUserProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setAppUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAppUserProfile]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    if (data.user) {
      setUser(data.user);
      const userRole = await fetchAppUserProfile(data.user.id, data.user.email);
      setIsLoading(false);
      return { error: null, role: userRole };
    }

    setIsLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    if (data.user) {
      setUser(data.user);
      await new Promise((r) => setTimeout(r, 600));
      await fetchAppUserProfile(data.user.id, data.user.email);
    }
    setIsLoading(false);
    return { error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setAppUser(null);
      setRole(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchAppUserProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        role,
        isLoading,
        login,
        signUp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
