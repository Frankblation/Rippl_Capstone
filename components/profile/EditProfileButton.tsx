import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function EditProfileButton() {
  const router = useRouter();

  function edit() {
    router.push('/(tabs)/profile/edit');
  }

  return (
    <Pressable onPress={edit}>
      <Feather name="settings" size={24} color="black" style={{ marginRight: 16 }} />
    </Pressable>
  );
}
