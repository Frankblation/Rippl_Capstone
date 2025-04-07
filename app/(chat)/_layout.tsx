import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Chat } from 'stream-chat-expo';
import { StreamChat } from 'stream-chat';
import { useAuth } from '~/components/providers/AuthProvider'; // Update path if needed

// Define the Stream Chat client type
type StreamChatType = StreamChat;

export default function ChatLayout() {
  // Get authentication data from your context
  const { user, chatToken, getChatToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  // Stream Chat configuration
  const chatApiKey = '9wbpcdvydjaw'; // Your Stream publishable key
  
  // Initialize the chat client manually instead of using useCreateChatClient
  const initializeClient = useCallback(async () => {
    try {
      // Make sure we have a token
      let token = chatToken;
      if (!token) {
        await getChatToken();
        token = chatToken; // Get updated token after getChatToken
      }
      
      if (!token || !user) {
        console.error('Missing token or user data for chat initialization');
        setIsLoading(false);
        return;
      }
      
      // Create a new StreamChat instance
      const client = StreamChat.getInstance(chatApiKey);
      
      // Connect user to Stream
      await client.connectUser(
        {
          id: user.id,
          name: user.email || 'Anonymous User',
          image: user.user_metadata?.avatar_url,
          role: 'user',
        },
        token
      );
      
      setChatClient(client);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize chat client:', error);
      setIsLoading(false);
    }
  }, [user, chatToken, getChatToken]);

  // Initialize chat when component mounts
  useEffect(() => {
    initializeClient();
    
    // Cleanup function - disconnect when component unmounts
    return () => {
      if (chatClient) {
        chatClient.disconnectUser().then(() => {
          console.log('User disconnected from Stream Chat');
        });
      }
    };
  }, []);

  // Show loading state when initializing
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading chat...</Text>
      </View>
    );
  }
  
  // Show error state if we failed to initialize the client
  if (!chatClient || !user || !chatToken) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 10, textAlign: 'center' }}>
          Unable to connect to chat. Please check your connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <Chat client={chatClient}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Chat>
  );
}
