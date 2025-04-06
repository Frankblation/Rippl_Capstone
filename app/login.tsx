import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { email, setEmail, password, setPassword, authLoading, signInWithEmail } = useAuth();

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const { error } = await signInWithEmail();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Will automatically redirect based on auth state in layout
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Screen</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {authLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button title="Log In" onPress={handleLogin} />
      )}

      <Button title="Don't have an account? Sign Up" onPress={() => router.push('/signup')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  loader: {
    marginVertical: 20,
  },
});
