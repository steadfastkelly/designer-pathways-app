import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/api';
import type { Profile, UserRole } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  effectiveRole: UserRole | null;
  effectiveUser: Profile | null;
  previewMode: boolean;
  previewDesigner: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  previewAs: (designer: Profile) => void;
  exitPreview: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveRole(email: string): UserRole {
  if (email === 'kelly@steadfast.design') return 'admin';
  if (email === 'tori@steadfast.design') return 'supervisor';
  return 'designer';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewDesigner, setPreviewDesigner] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string, email: string) => {
    const p = await getProfile(userId);
    if (p) {
      setProfile(p);
    } else {
      // Fallback: derive role from email
      setProfile({
        id: userId,
        email,
        name: email.split('@')[0],
        role: deriveRole(email),
        scheduledHoursPerWeek: 36,
        scheduleType: 'standard',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '').finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '');
      } else {
        setProfile(null);
        setPreviewDesigner(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPreviewDesigner(null);
  };

  const previewAs = useCallback((designer: Profile) => {
    setPreviewDesigner(designer);
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewDesigner(null);
  }, []);

  const role = profile ? (profile.role ?? deriveRole(profile.email)) : null;
  const effectiveRole: UserRole | null = previewDesigner ? 'designer' : role;
  const effectiveUser: Profile | null = previewDesigner ?? profile;

  return (
    <AuthContext.Provider value={{
      session, user, profile, role, effectiveRole, effectiveUser,
      previewMode: !!previewDesigner, previewDesigner,
      loading, signIn, signOut, previewAs, exitPreview,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
