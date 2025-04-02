'use client';

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    router.replace('/customize-profile');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-12">
        <View className="mb-8">
          <Text className="mb-2 text-3xl font-bold">Create Account</Text>
          <Text className="text-gray-600">Sign up to get started with our app</Text>
        </View>

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
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          className="mb-6 w-full items-center rounded-xl bg-teal-500 py-4">
          <Text className="text-lg font-semibold text-white">Sign Up</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text className="font-medium text-teal-500">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
