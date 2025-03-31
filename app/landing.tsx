import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Landing Screen</Text>
      <Button title="Login" onPress={() => router.push('/login')} />
      <Button title="Sign Up" onPress={() => router.push('/signup')} />
      <Button title="Go to App" onPress={() => router.push('/(tabs)/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
