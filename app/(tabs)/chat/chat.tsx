import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Chat() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Messages Yet</Text>
      <Text style={styles.subtitle}>Start a conversation and it will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
