import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ChatButton } from '~/components/ChatButton';
import React, { Suspense } from 'react';
const Swipe = React.lazy(() => import('~/components/Swiping'));

export default function MatchingScreen() {
  return (
    <SafeAreaView className="flex-1">
      <View style={styles.container}>
        <Text style={styles.title}>Build Community Around</Text>
        <Text style={styles.sharedTitle}>Shared Interests</Text>
        <Suspense fallback={<Text style={{ padding: 20 }}>Loading match...</Text>}>
          <Swipe />
        </Suspense>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  title: {
    fontFamily: 'geistBold',
    fontSize: 28,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  sharedTitle: {
    fontFamily: 'bubbles',
    fontSize: 42,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
});
