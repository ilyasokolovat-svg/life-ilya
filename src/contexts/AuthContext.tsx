
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

    supabase.auth.getSession().then(({ data: { session: initial } }) => applySession(initial));

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
