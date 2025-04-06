import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import LottieView from 'lottie-react-native';
import { useRef } from 'react';

export function ChatButton() {
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);

  async function chat() {
    animationRef.current?.play(); // Play the animation
    // Wait a bit if you want the animation to be seen before navigating
    setTimeout(() => {
      router.push('/(chat)/chat-list');
    }, 1000); // Adjust delay as needed (depends on animation duration)
  }

  return (
    <Pressable onPress={chat}>
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/chat.json')}
        loop={false}
        autoPlay={false}
        style={{ width: 70, height: 70 }}
      />
    </Pressable>
  );
}
