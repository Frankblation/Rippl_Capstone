import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export function ChatButton() {
  const router = useRouter();

  async function chat() {
    router.push('/(tabs)/chat/chat-list');
  }

  return (
    <Pressable onPress={chat}>
      <Feather name="message-square" size={24} color="black" />
    </Pressable>
  );
}
