import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function LogOutButton() {
  const router = useRouter();

  function logout() {
    router.push('/login');
  }

  return (
    <Pressable onPress={logout}>
      <Feather name="log-out" size={24} color="black" style={styles.chat} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chat: {
    marginRight: 16,
    paddingBottom: 22,
  },
});
