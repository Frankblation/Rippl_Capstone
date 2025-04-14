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
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import ForgotPasswordModal from '~/components/ForgotPasswordModal';
import { invalidateAllFeedCaches, resetAllFeedLoadingStates } from '~/hooks/useFeed';
import { supabase } from '~/utils/supabase';


export default function LoginScreen() {
  const router = useRouter();
  const { email, setEmail, password, setPassword, authLoading, signInWithEmail } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);

  useEffect(() => {
    // When login screen mounts, ensure we're in a clean state
    const cleanupPreviousSession = async () => {
      invalidateAllFeedCaches();
      resetAllFeedLoadingStates();

      // Check if we have an active session that should be cleared
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('Found active session, signing out');
        await supabase.auth.signOut();
      }
    };

    cleanupPreviousSession();
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const { error } = await signInWithEmail();

    const { notificationAsync, NotificationFeedbackType } = await import('expo-haptics');

    if (error) {
      await notificationAsync(NotificationFeedbackType.Error);
      Alert.alert('Error', error.message);
    } else {
      setEmail('');
      setPassword('');
      await notificationAsync(NotificationFeedbackType.Success);
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
              style={{ textAlignVertical: 'center', minHeight: 50 }}
            />
          </View>

          <View className="gap-y-2">
            <Text className="font-medium text-gray-700">Password</Text>
            <View className="relative flex-row items-center">
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
          onPress={handleLogin}
          className={`mb-6 w-full items-center rounded-xl py-4 ${
            authLoading ? 'bg-teal-300' : 'bg-[#00AF9F]'
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
            <Text className="font-medium text-[#00AF9F]">Create an account</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-2 flex-row justify-center">
          <Text className="text-gray-600">Forgot password? </Text>
          <TouchableOpacity onPress={() => setForgotPasswordModalVisible(true)}>
            <Text className="font-medium text-[#00AF9F]">Reset password</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ForgotPasswordModal
        visible={forgotPasswordModalVisible}
        onClose={() => setForgotPasswordModalVisible(false)}
      />
    </SafeAreaView>
  );
}
