// In chat/chat.tsx or wherever your chat screen is
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { 
  Chat, 
  ChannelList,
  useCreateChatClient
} from 'stream-chat-expo';

export default function ChatScreen() {
  // Stream Chat configuration
  const chatApiKey = "9wbpcdvydjaw"; // Replace with your actual API key
  const chatUserId = "1";
  const chatUserName = "testUser";
  const chatUserToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSJ9.GPZsQL4Ugb7by42bOWZ3r6ErURc3Gmh2GU9AgAeYE0M";
  
  // Create chat client
  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    userData: { id: chatUserId, name: chatUserName },
    tokenOrProvider: chatUserToken,
  });

  if (!chatClient) {
    // Return a loading indicator if client is not ready
    return <SafeAreaView><Text>Loading chat...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Chat client={chatClient}>
        <ChannelList />
      </Chat>
    </SafeAreaView>
  );
}
