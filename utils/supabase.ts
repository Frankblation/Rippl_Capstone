import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import AsyncStorage from '@react-native-async-storage/async-storage';

dotenv.config(); // Get variables from .env file

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRoleKey)) {
  throw new Error('Supabase URL or keys are not defined in environment variables.');
}

// Determine the runtime environment and set the appropriate key and storage
let supabaseKey: string;
let storage: any;

// if (typeof window === 'undefined') {
//   // Node.js environment
//   supabaseKey = supabaseServiceRoleKey; // Use service role key in Node.js
//   const { LocalStorage } = require('node-localstorage');
//   storage = new LocalStorage('./scratch');
// } else {
//   // Mobile or browser environment
//   supabaseKey = supabaseAnonKey; // Use anon key in mobile/browser
//   const AsyncStorage = require('@react-native-async-storage/async-storage').default;
//   storage = AsyncStorage;
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
