import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';
import { Channel, MessageList, MessageInput, useChatContext } from 'stream-chat-expo';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import { StatusBar } from 'expo-status-bar';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const { client: chatClient } = useChatContext();
  // Fix the type of channel state
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChannel = async () => {
      if (!chatClient || !id) return;

      try {
        // Get the channel with the given ID
        const channelClient = chatClient.channel('messaging', id.toString());
        await channelClient.watch();
        setChannel(channelClient);
      } catch (error) {
        console.error('Error loading channel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [chatClient, id]);

  if (loading || !channel) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        <Channel channel={channel}>
          <View style={{ flex: 1 }}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      </View>
    </SafeAreaView>
  );
}
