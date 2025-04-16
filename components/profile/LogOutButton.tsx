'use client';

import { Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { invalidateAllFeedCaches, resetAllFeedLoadingStates } from '~/hooks/useFeed';
import { supabase } from '~/utils/supabase';


export function LogOutButton() {
  const router = useRouter();

  async function logout() {
    try {
      // First, clear all feed caches
      invalidateAllFeedCaches();
      resetAllFeedLoadingStates();

      // Sign out the user from Supabase
      await supabase.auth.signOut();

      // Then navigate to login screen
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate to login even if there's an error
      router.push('/login');
    }
  }

  return (
    <Pressable
      onPress={logout}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Log out">
      <Feather name="log-out" size={24} color="black" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
    borderRadius: 4,
    ...Platform.select({
      android: {
        // Android styles to improve touch feedback
        elevation: 0,
        backgroundColor: 'transparent',
      },
    }),
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.1)' : 'transparent',
  },
});
