
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep user identity stable across TOKEN_REFRESHED events (same uid ⇒ same object ref)
    // Otherwise every tab-focus token refresh cascades new object refs to consumers,
    // triggering re-fetch effects that flip parents into loading states and unmount modals.
    const applySession = (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null;
      setSession((prev) => (prev?.access_token === nextSession?.access_token ? prev : nextSession));
      setUser((prev) => (prev?.id && nextUser?.id && prev.id === nextUser.id ? prev : nextUser));
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => applySession(nextSession)
    );

    // Open access: automatically sign in to the owner's account (no login screen).
    supabase.auth.getSession().then(async ({ data: { session: initial } }) => {
      if (initial) return applySession(initial);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ilya.sokolov.at@gmail.com',
        password: '123456781',
      });
      if (error) console.error('Auto sign-in failed:', error.message);
      applySession(data?.session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
