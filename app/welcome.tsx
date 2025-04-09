import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { styles } from '~/components/HeaderButton';

export default function WelcomeScreen() {
  const router = useRouter();

  const goHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <View className=" max-h-[30%] w-full items-center justify-center">
          <Image
            source={require('../assets/distorted-ripple.png')}
            className="aspect-[.75] w-full" // adjust aspect ratio to match your image
            resizeMode="contain"
          />
        </View>
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
