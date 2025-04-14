import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { StreamChat } from 'stream-chat';
import { useAuth } from '~/components/providers/AuthProvider'; // Update path if needed
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Define the Stream Chat client type
type StreamChatType = StreamChat;

export default function ChatLayout() {
  // Get authentication data from your context
  const { user, chatToken, getChatToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  // Stream Chat configuration
  const chatApiKey = '9wbpcdvydjaw'; // Your Stream publishable key

  // Initialize the chat client manually instead of using useCreateChatClient
  const initializeClient = useCallback(async () => {
    try {
      // If client already exists and is connected, don't reconnect
      if (chatClient && chatClient.userID === user?.id) {
        setIsLoading(false);
        return;
      }

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

      // If a different user was already connected, disconnect them first
      if (client.userID && client.userID !== user.id) {
        await client.disconnectUser();
      }

      // Only connect if not already connected
      if (!client.userID) {
        await client.connectUser(
          {
            id: user.id,
            name: user.email || 'Anonymous User',
            image: user.user_metadata?.avatar_url,
            role: 'user',
          },
          token
        );
      }

      setChatClient(client);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize chat client:', error);
      setIsLoading(false);
    }
  }, [user, chatToken, getChatToken, chatClient]);

  // Initialize chat when component mounts or when initializeClient changes
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
  }, [initializeClient]);

  // Show loading state when initializing
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00AF9F" />
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
    <SafeAreaProvider style={{ flex: 1 }}>
      <OverlayProvider bottomInset={bottom}>
        <Chat client={chatClient}>
          <Stack>
            <Stack.Screen
              name="chat-list"
              options={({ navigation }) => ({
                title: 'Chat List',
                headerShown: true,
                headerBackVisible: false,
                headerLeft: () => (
                  <TouchableOpacity onPress={() => router.push('/(tabs)/matching')}>
                    <Text style={{ fontSize: 18, paddingHorizontal: 10, color: '#007AFF' }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                ),
              })}
            />

            <Stack.Screen
              name="[id]"
              options={({ route }) => ({
                title: '', // Keep the title empty as you had it
                headerShown: true,
                headerBackVisible: true,
                headerBackTitle: 'Chat List', // This sets the back button text to "Chat List" when on the [id] screen
              })}
            />
          </Stack>
        </Chat>
      </OverlayProvider>
    </SafeAreaProvider>
  );
}
