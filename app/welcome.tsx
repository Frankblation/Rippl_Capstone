'use client';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  const router = useRouter();

  const goHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-center text-3xl font-bold">Welcome</Text>
        <Text className="mb-8 text-center text-lg text-gray-600">
          Your profile is all set up and ready to go. Explore the app and connect with others who
          share your interests!
        </Text>

        <TouchableOpacity
          onPress={goHome}
          className="w-full items-center rounded-xl bg-teal-500 py-4">
          <Text className="text-lg font-semibold text-white">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
