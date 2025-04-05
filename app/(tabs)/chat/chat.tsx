import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { ChatApp } from '~/components/chat/Chat';

export default function Chat() {
  return (
    <View style={styles.container}>
      <ChatApp />
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
