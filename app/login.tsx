import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 py-12">
        <View className="mb-8">
          <Text className="mb-2 text-3xl font-bold">Welcome back!</Text>
          <Text className="text-gray-600">Login to start making waves</Text>
        </View>

        <View className="mb-8 gap-y-4">
          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Email</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Password</Text>

            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={handleLogin}
          className={`mb-6 w-full items-center rounded-xl py-4 ${
            authLoading ? 'bg-teal-300' : 'bg-teal-500'
          }`}>
          {authLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-semibold text-white">Login</Text>
          )}
        </TouchableOpacity>
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text className="font-medium text-teal-500">Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
