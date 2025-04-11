'use client';

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { Suspense, useEffect, useRef } from 'react';
const Swipe = React.lazy(() => import('~/components/Swiping'));
import LottieView from 'lottie-react-native';

export default function MatchingScreen() {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Auto-play the animation when component mounts
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Build Community Around</Text>
        <Text style={styles.sharedTitle}>Shared Interests</Text>
        <Suspense fallback={<Text style={{ padding: 20 }}>Loading match...</Text>}>
          <View style={{ marginTop: -60 }}>
            <Swipe />
          </View>
        </Suspense>
        <View style={styles.animationContainer}>
          <LottieView
            ref={animationRef}
            source={require('~/assets/animations/SwipeGesture.json')}
            style={styles.animation}
            loop={true}
            autoPlay={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },

  title: {
    fontFamily: 'geistBold',
    fontSize: 28,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  sharedTitle: {
    fontFamily: 'bubbles',
    fontSize: 42,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
  },
  animation: {
    width: 60,
    height: 60,
  },
  hintText: {
    fontFamily: 'geist',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});
