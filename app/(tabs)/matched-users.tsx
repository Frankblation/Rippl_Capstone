'use client';
import React, { Suspense } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
const MatchedScreen = React.lazy(() => import('~/components/MatchedScreen'));

type User = {
  name: string;
  interests: string[];
  bio?: string;
  picture?: string;
};

const MatchScreen = () => {
  const router = useRouter();
  const { matchedUser, currentUser } = useLocalSearchParams();

  if (!matchedUser || !currentUser) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>Error: Missing match data.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const parsedMatchedUser = JSON.parse(matchedUser as string) as User;
  const parsedCurrentUser = JSON.parse(currentUser as string) as User;

  return (
    <Suspense fallback={<Text style={{ padding: 20 }}>Loading match...</Text>}>
      <MatchedScreen
        matchedUser={parsedMatchedUser}
        currentUser={parsedCurrentUser}
        onClose={() => router.back()}
        onStartChat={() => {
          console.log('Start chat with', parsedMatchedUser.name);
          router.push({
            pathname: '/(chat)/chat-list',
          });
        }}
      />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4B4B',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default MatchScreen;
