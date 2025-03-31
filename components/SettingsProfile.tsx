import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function SettingsProfile() {
  const router = useRouter();

  async function settings() {
    //   router.replace('/(tabs)/profile/edit');
  }

  return (
    <Pressable onPress={settings}>
      <Feather name="settings" size={24} color="black" style={{ marginRight: 16 }} />
    </Pressable>
  );
}
