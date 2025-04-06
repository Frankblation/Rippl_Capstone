import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '~/components/providers/AuthProvider'; // Update this path if needed

export default function SignupScreen() {
  const router = useRouter();
  const { email, setEmail, password, setPassword, signUpWithEmail, authLoading } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateInputs = () => {
    // Reset error message
    setErrorMessage('');

    // Validate email
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    // First validate inputs
    if (!validateInputs()) {
      return;
    }

    // Call the signup function from our auth context
    const { data, error } = await signUpWithEmail();

    if (error) {
      // Show error from Supabase
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      // If email confirmation is required
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please check your email to complete signup.',
        [{ text: 'OK', onPress: () => router.replace('/create-profile') }]
      );
    } else {
      // Email confirmation not required, go to onboarding
      router.replace('/create-profile');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-12">
        <View className="mb-8">
          <Text className="mb-2 text-3xl font-bold">Create Account</Text>
          <Text className="text-gray-600">Sign up to get started with our app</Text>
        </View>

        {errorMessage ? (
          <View className="mb-4 rounded-lg bg-red-100 p-3">
            <Text className="text-red-700">{errorMessage}</Text>
          </View>
        ) : null}

        <View className="mb-8 gap-y-4">
          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Email</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!authLoading}
            />
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Password</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              editable={!authLoading}
            />
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Confirm Password</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              editable={!authLoading}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={authLoading}
          className={`mb-6 w-full items-center rounded-xl py-4 ${
            authLoading ? 'bg-teal-300' : 'bg-teal-500'
          }`}>
          {authLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-semibold text-white">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} disabled={authLoading}>
            <Text className="font-medium text-teal-500">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
