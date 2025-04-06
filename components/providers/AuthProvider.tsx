import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { SupabaseUser, SupabaseSession } from '~/utils/db';

interface AuthContextType {
  user: SupabaseUser | null;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  authLoading: boolean;
  signInWithEmail: () => Promise<{ error: any }>;
  signUpWithEmail: () => Promise<{ error: any }>;
  // Stream chat properties
  chatToken: string | null;
  getChatToken: () => Promise<string>;
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
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Stream Chat state
  const [chatToken, setChatToken] = useState<string | null>(null);

  // Function to validate if user exists in database
  const validateUserExists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  };

  // Function to handle valid session
  const handleValidSession = async (session: any) => {
    if (!session?.user?.id) {
      setSession(null);
      setUser(null);
      return false;
    }

    // Check if user exists in database
    const userExists = await validateUserExists(session.user.id);

    if (!userExists) {
      // User has been deleted from the database, but auth session exists
      // Sign them out to clean up the auth state
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      return false;
    }

    // User is valid
    setSession(session as SupabaseSession | null);
    setUser(session?.user as SupabaseUser | null);
    return true;
  };

  // Check for session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && isMounted) {
        const isValid = await handleValidSession(session);

        // If user exists and is valid, get chat token
        if (isValid && isMounted) {
          getChatToken();
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && isMounted) {
        const isValid = await handleValidSession(session);

        // Update chat token on auth change
        if (isValid && isMounted) {
          // Clear previous token on sign in
          if (_event === 'SIGNED_IN') {
            setChatToken(null);
          }
          getChatToken();
        }
      } else if (isMounted) {
        setSession(null);
        setUser(null);
        setChatToken(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log("about to call get chat token");
  // Get Stream Chat token from Edge Function
  const getChatToken = async () => {
    console.log("get chat token called successfully")
    try {
      const session = await supabase.auth.getSession();
      console.log(session);
      const accessToken = session?.data?.session?.access_token;

      if (!accessToken) {
        return '';
      }
      console.log("about to call edge function");
      const res = await fetch('https://fjnqmjdiveffwxhghxek.supabase.co/functions/v1/generate-stream-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.log(`Error response (${res.status}): ${errorText}`);
        return;
      }

      const { token } = await res.json();
      console.log(token);
      setChatToken(token);
      return token;
    } catch (err) {
      return '';
    }
  };

  // Sign in with email
  async function signInWithEmail() {
    setAuthLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user) {
      // Validate that user exists in database
      const userExists = await validateUserExists(data.user.id);

      if (!userExists) {
        await supabase.auth.signOut();
        setAuthLoading(false);
        return { error: { message: 'User account not found' } };
      }
    }

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
  async function resetPassword(email: string) {
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setAuthLoading(false);
    return { error };
  }

  // Update password
  async function updatePassword(newPassword: string) {
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
    chatToken,
    getChatToken,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
