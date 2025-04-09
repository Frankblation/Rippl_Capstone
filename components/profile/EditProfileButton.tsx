import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function EditProfileButton() {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push('/(tabs)/profile/edit')}>
      <Feather
        name="settings"
        size={34}
        color="black"
        style={{ marginRight: 20 }}
      />
    </Pressable>
  );
}
