'use client';

import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function EditProfileButton({ style }: Props) {
  const router = useRouter();

  function edit() {
    router.push('/(tabs)/profile/edit');
  }

  return (
    <Pressable onPress={edit} style={[style]}>
      <Feather name="settings" size={24} color="#00AF9F" style={{ marginRight: 16 }} />
    </Pressable>
  );
}
