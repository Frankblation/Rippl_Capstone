import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import 'global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack initialRouteName="landing">
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="customize-profile" options={{ title: 'Customize Profile' }} />
        <Stack.Screen name="create-interests" options={{ title: 'Your Interests' }} />
        <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>

  );
}
