import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from '../../components/Masonary';

export default function App() {
  return (
    <SafeAreaProvider>
      <WelcomeScreen />
    </SafeAreaProvider>
  );
}
