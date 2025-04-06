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
      console.log('Validating if user exists in database:', userId);
      // Query your users table to check if the user exists
      const { data, error } = await supabase
        .from('users') // Replace with your actual users table name
        .select('id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user existence:', error);
        return false;
      }

      const userExists = !!data;
      console.log('User exists in database:', userExists);
      return userExists;
    } catch (error) {
      console.error('Error in validateUserExists:', error);
      return false;
    }
  };

  // Function to handle valid session
  const handleValidSession = async (session: any) => {
    if (!session?.user?.id) {
      console.log('No user in session');
      setSession(null);
      setUser(null);
      return false;
    }

    // Check if user exists in database
    const userExists = await validateUserExists(session.user.id);

    if (!userExists) {
      console.log('User exists in auth but not in database, signing out');
      // User has been deleted from the database, but auth session exists
      // Sign them out to clean up the auth state
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      return false;
    }

    // User is valid
    console.log('User is valid, setting session and user');
    setSession(session as SupabaseSession | null);
    setUser(session?.user as SupabaseUser | null);
    return true;
  };

  // Check for session on mount
  useEffect(() => {
    console.log('=== AuthProvider initialized ===');

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      if (session) {
        console.log('Session user:', session.user);

        const isValid = await handleValidSession(session);
        setLoading(false);

        // If user exists and is valid, get chat token
        if (isValid) {
          console.log('User authenticated, getting chat token');
          getChatToken();
        }
      } else {
        console.log('No session found');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`Auth state changed: ${_event}`);
      console.log('New session:', session ? 'Session exists' : 'No session');

      if (session) {
        console.log('User in new session:', session.user);
        const isValid = await handleValidSession(session);

        // Update chat token on auth change
        if (isValid) {
          console.log('User authenticated after state change, getting chat token');
          getChatToken();
        }
      } else {
        console.log('No authenticated user after state change, clearing chat token');
        setSession(null);
        setUser(null);
        setChatToken(null);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Get Stream Chat token from Edge Function
  async function getChatToken() {
    console.log('getChatToken called');

    if (chatToken) {
      console.log('Chat token already exists, returning existing token');
      return chatToken;
    }

    if (user && session) {
      console.log('User and session available for token request');
      try {
        // Check if access_token is directly on session (based on your logs)
        const token = session.access_token;

        console.log('Access token availability:', token ? 'Token found' : 'No token');

        if (!token) {
          console.error('Access token not available in session');
          return '';
        }

        console.log('Fetching chat token from edge function');
        const response = await fetch(
          'https://your-project-ref.supabase.co/functions/v1/generate-stream-token',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Edge function response status:', response.status);

        if (!response.ok) {
          console.error('Failed to get chat token:', response.statusText);
          throw new Error(`Failed to get chat token: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received chat token successfully');
        setChatToken(data.token);
        return data.token;
      } catch (error) {
        console.error('Error fetching chat token:', error);
        return '';
      }
    } else {
      console.log('No user or session available for token request');
    }

    return '';
  }

  // Sign in with email
  async function signInWithEmail() {
    console.log('Attempting to sign in with email:', email);
    setAuthLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Sign in result:', error ? `Error: ${error.message}` : 'Success');

    if (data?.user) {
      console.log('Signed in user:', data.user);
      // Validate that user exists in database
      const userExists = await validateUserExists(data.user.id);

      if (!userExists) {
        console.log('User exists in auth but not in database, signing out');
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
    console.log('Attempting to sign up with email:', email);
    setAuthLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('Sign up result:', error ? `Error: ${error.message}` : 'Success');
    if (data?.user) {
      console.log('New user created:', data.user);
    }

    setAuthLoading(false);
    return { data, error };
  }

  // Sign out
  async function signOut() {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();

    console.log('Sign out result:', error ? `Error: ${error.message}` : 'Success');
    return { error };
  }

  // Reset password
  async function resetPassword(email: string) {
    console.log('Requesting password reset for:', email);
    setAuthLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
    setAuthLoading(false);
    return { error };
  }

  // Update password
  async function updatePassword(newPassword: string) {
    console.log('Updating password for current user');
    setAuthLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    console.log('Password update result:', error ? `Error: ${error.message}` : 'Success');
    setAuthLoading(false);
    return { error };
  }

  // Debug current state
  useEffect(() => {
    console.log('Auth state updated:');
    console.log('- User:', user ? `ID: ${user.id}` : 'No user');
    console.log('- Session:', session ? 'Available' : 'No session');
    console.log('- Chat token:', chatToken ? 'Available' : 'Not available');
    console.log('- Auth loading:', authLoading);
  }, [user, session, chatToken, authLoading]);

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
