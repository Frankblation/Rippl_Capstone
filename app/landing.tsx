import { View, Text, Button, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/rippl2.png')}
        style={{ width: '90%', height: 200, resizeMode: 'contain' }}
      />
      <Pressable
        onPress={() => router.push('/login')}
        className="h-12 w-1/4 items-center justify-center rounded-full bg-teal-500">
        <Text className="text-md text-[20px] text-white">Log In</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/signup')}
        className="h-12 w-1/4 items-center justify-center rounded-full bg-teal-500">
        <Text className="text-md text-[20px] text-white">Sign up</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(tabs)/home')}
        className="h-12 w-1/4 items-center justify-center rounded-full bg-teal-500">
        <Text className="text-md text-[20px] text-white">Go to app</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
