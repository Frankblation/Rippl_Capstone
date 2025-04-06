import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ChatButton() {
  const router = useRouter();

  function chat() {
    router.push('/(chat)/chat-list');
  }

  return (
    <Pressable onPress={chat}>
      <Ionicons name="chatbubbles-outline" size={30} color="#00AF9F" style={styles.chat} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chat: {
    marginRight: 10,
  },
});
