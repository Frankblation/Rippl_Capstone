import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '~/utils/supabase';

interface AuthContextType {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  authLoading: boolean;
  signInWithEmail: () => Promise<{error: any}>;
  signUpWithEmail: () => Promise<{error: any}>;
  // other properties and methods
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check for session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email
  async function signInWithEmail() {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setAuthLoading(false);
    return { error };
  }

  // Sign up with email
  async function signUpWithEmail() {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setAuthLoading(false);
    return { data, error };
  }

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Reset password
  async function resetPassword(email) {
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setAuthLoading(false);
    return { error };
  }

  // Update password
  async function updatePassword(newPassword) {
    setAuthLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setAuthLoading(false);
    return { error };
  }

  const value = {
    user,
    session,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    authLoading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
