'use client';
import { SafeAreaView, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Channel, Chat, MessageInput, MessageList, useCreateChatClient } from 'stream-chat-expo';
import Feather from '@expo/vector-icons/Feather';

export default function ChatChannelScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const chatApiKey = '9wbpcdvydjaw';
  const chatUserId = '1';
  const chatUserName = 'testUser';
  const chatUserToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSJ9.GPZsQL4Ugb7by42bOWZ3r6ErURc3Gmh2GU9AgAeYE0M';

  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    userData: { id: chatUserId, name: chatUserName },
    tokenOrProvider: chatUserToken,
  });

  if (!chatClient || !id) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Loading chat channel...</Text>
      </SafeAreaView>
    );
  }

  const channel = chatClient.channel('messaging', id.toString());

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#e1e1e1',
          alignItems: 'center',
        }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
          <Feather name="arrow-right" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{channel.data?.name || 'Chat'}</Text>
      </View>

      <Chat client={chatClient}>
        <Channel channel={channel}>
          <View style={{ flex: 1 }}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
}
