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
import { useAuth } from '~/components/providers/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { email, setEmail, password, setPassword, signUpWithEmail, signInWithEmail, authLoading } =
    useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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

  const handleVerifiedEmail = async () => {
    // Force sign in with email after verification
    const { data, error } = await signInWithEmail();

    if (error) {
      setErrorMessage(`Error signing in: ${error.message}`);
      return;
    }

    // Proceed to profile creation
    router.replace('/create-profile');
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
        [{ text: 'I Verified My Email', onPress: handleVerifiedEmail }]
      );
    } else {
      // Email confirmation not required, go to onboarding
      router.replace('/create-profile');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center px-6 py-12">
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
              style={{ textAlignVertical: 'center', minHeight: 50 }}
            />
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                editable={!authLoading}
                style={{ textAlignVertical: 'center', minHeight: 50 }}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 12,
                  height: 50,
                  justifyContent: 'center',
                }}>
                {showPassword ? (
                  <Feather name="eye-off" size={20} color="#6B7280" />
                ) : (
                  <Feather name="eye" size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Confirm Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showPassword}
                editable={!authLoading}
                style={{ textAlignVertical: 'center', minHeight: 50 }}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 12,
                  height: 50,
                  justifyContent: 'center',
                }}>
                {showPassword ? (
                  <Feather name="eye-off" size={20} color="#6B7280" />
                ) : (
                  <Feather name="eye" size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
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
            <Text className="font-medium text-[#00AF9F]">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
