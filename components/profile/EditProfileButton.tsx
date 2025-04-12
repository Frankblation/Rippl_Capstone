'use client';

import { Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function EditProfileButton() {
  const router = useRouter();

  function edit() {
    router.push('/(tabs)/profile/edit');
  }

  return (
    <Pressable
      onPress={edit}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Edit profile">
      <Feather name="settings" size={24} color="black" />
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
        // android styles to improve touch feedback
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
