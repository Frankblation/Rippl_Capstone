// In chat/chat.tsx or wherever your chat screen is
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, View, Button } from 'react-native';
import { Chat, ChannelList, useCreateChatClient } from 'stream-chat-expo';

export default function ChatScreen() {
  // Stream Chat configuration
  const chatApiKey = '9wbpcdvydjaw'; // Replace with your actual API key
  const chatUserId = '1';
  const chatUserName = 'testUser';
  const chatUserToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSJ9.GPZsQL4Ugb7by42bOWZ3r6ErURc3Gmh2GU9AgAeYE0M';

  // Create chat client
  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    userData: { id: chatUserId, name: chatUserName },
    tokenOrProvider: chatUserToken,
  });

  if (!chatClient) {
    // Return a loading indicator if client is not ready
    return (
      <SafeAreaView>
        <Text>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  const createNewChannel = async () => {
    if (chatClient) {
      try {
        const channelId = `random-${Math.random().toString(36).substring(7)}`;
        const channel = chatClient.channel('messaging', channelId, {
          name: 'New Chat Channel',
          members: [chatUserId],
        });
        await channel.create();
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
      <Chat client={chatClient}>
        <ChannelList
          onSelect={(channel) => {
            // Navigate to a chat screen with the selected channel
            router.push(`/${channel.id}`);
          }}
        />
      </Chat>
    </SafeAreaView>
  );
}
