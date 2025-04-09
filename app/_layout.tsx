import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimationProvider } from '~/components/AnimationContext';

import { useColorScheme } from '~/hooks/useColorScheme';
import { AuthProvider, useAuth } from '~/components/providers/AuthProvider';

import { OverlayProvider } from 'stream-chat-expo';

import 'global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// Root layout with auth protection
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();

  // If the auth is still loading, don't render anything yet
  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName={user ? '(tabs)' : 'landing'}>
        {/* Auth screens - no auth required */}
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />

        {/* Onboarding screens - auth required */}
        <Stack.Screen
          name="create-profile"
          options={{
            headerShown: false,
            // Prevent going to these screens if not authenticated
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="create-catagories"
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen
          name="create-interests"
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen name="welcome" options={{ headerShown: false, headerBackVisible: false }} />

        {/* Main app - auth required */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            // Prevent going back to auth screens
            headerBackVisible: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

// Root layout with fonts and auth provider
export default function RootLayout() {
  const [loaded] = useFonts({
    SFProTextRegular: require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    SFProTextBold: require('../assets/fonts/SF-Pro-Text-Bold.otf'),
    SFProTextSemiBold: require('../assets/fonts/SF-Pro-Text-Semibold.otf'),
    SFProTextMedium: require('../assets/fonts/SF-Pro-Text-Medium.otf'),
    SFProDisplayRegular: require('../assets/fonts/SF-Pro-Display-Regular.otf'),
    SFProDisplayBold: require('../assets/fonts/SF-Pro-Display-Bold.otf'),
    rlAqva: require('../assets/fonts/rlAqva.otf'),
    geistBold: require('../assets/fonts/Geist-Bold.otf'),
    geistRegular: require('../assets/fonts/Geist-Regular.otf'),
    geistSemiBold: require('../assets/fonts/Geist-SemiBold.otf'),
    geistMedium: require('../assets/fonts/Geist-Medium.otf'),
    brush: require('../assets/fonts/Astakhov-Brush-Hooliganism.otf'),
    bubbles: require('../assets/fonts/Pearly-Smiles.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnimationProvider>
        <SafeAreaProvider>
          <OverlayProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </OverlayProvider>
        </SafeAreaProvider>
      </AnimationProvider>
    </GestureHandlerRootView>
  );
}
