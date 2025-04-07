import React from 'react';
import { SafeAreaView, View, Button, Text } from 'react-native';
import { ChannelList, useChatContext } from 'stream-chat-expo';
import { router } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider'; // Update path if needed

export default function ChatListScreen() {
  const { user } = useAuth();
  const { client: chatClient } = useChatContext();

  // If no user is logged in, show a message
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in to access chat</Text>
      </SafeAreaView>
    );
  }

  const createNewChannel = async () => {
    if (chatClient) {
      try {
        const channelId = `random-${Math.random().toString(36).substring(7)}`;
        const channel = chatClient.channel('messaging', channelId, {
          name: 'New Chat Channel',
          members: [user.id],
        });
        await channel.create();
        console.log('Channel created successfully:', channelId);
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 10 }}>
        <Button title="Create New Chat" onPress={createNewChannel} />
      </View>
      <ChannelList
        filters={{
          members: { $in: [user.id] },
        }}
        sort={{ last_message_at: -1 }}
        onSelect={(channel) => {
          // Navigate to a chat screen with the selected channel
          router.push(`/(chat)/${channel.id}`);
        }}
      />
    </SafeAreaView>
  );
}
