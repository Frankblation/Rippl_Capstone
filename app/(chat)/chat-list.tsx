import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { 
  ChannelList, 
  useChatContext, 
  ChannelPreviewMessengerProps,
  DefaultStreamChatGenerics 
} from 'stream-chat-expo';
import { router } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider';
import { Channel } from 'stream-chat';

import { getUserById } from '~/utils/data';

export default function ChatListScreen() {
  const { user } = useAuth();
  const { client: chatClient } = useChatContext();

  // State for creating new chats
  const [newChatId, setNewChatId] = useState('');
  const [channelName, setChannelName] = useState('');

  // State for adding users to existing channels
  const [activeChannel, setActiveChannel] = useState<Channel<DefaultStreamChatGenerics> | null>(null);
  const [userIdToAdd, setUserIdToAdd] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  // Load user profiles when component mounts
  useEffect(() => {
    if (!user) return;
    
    // Add current user to profiles
    setUserProfiles(prev => ({
      ...prev,
      [user.id]: user.id // Initialize with ID, will be updated when we get profile data
    }));
  }, [user]);

  // Function to fetch user name and update profiles state
  const fetchUserName = async (userId: string) => {
    try {
      const userData = await getUserById(userId);
      if (userData) {
        // Use the name field that makes most sense for your app
        const displayName = userData.name || userId;
        
        setUserProfiles(prev => ({
          ...prev,
          [userId]: displayName
        }));
        
        return displayName;
      }
      return userId; // Fallback to ID if user not found
    } catch (error) {
      console.error('Error fetching user data:', error);
      return userId; // Fallback to ID on error
    }
  };

  // If no user is logged in, show a message
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in to access chat</Text>
      </SafeAreaView>
    );
  }

  // Function to create a new channel with a single user
  const createNewChannel = async () => {
    if (!chatClient || !newChatId.trim()) {
      Alert.alert('Error', 'Please enter a valid user ID');
      return;
    }

    try {
      // Fetch the other user's name
      const otherUserName = await fetchUserName(newChatId.trim());
      
      // Use provided channel name or generate a default one
      const channelNameToUse = channelName.trim() || `Chat ${new Date().toLocaleDateString()}`;
      const channelId = `messaging-${Math.random().toString(36).substring(7)}`;

      // Create channel with current user and the specified user
      const channel = chatClient.channel('messaging', channelId, {
        name: channelNameToUse,
        members: [user.id, newChatId.trim()],
        created_by_id: user.id,
        // Add custom data for displaying user names
        customData: {
          memberNames: {
            [user.id]: userProfiles[user.id] || user.id,
            [newChatId.trim()]: otherUserName
          }
        }
      });

      await channel.create();
      console.log('Channel created successfully:', channelId);

      // Reset form
      setChannelName('');
      setNewChatId('');

      // Navigate to the new channel
      router.push(`/(chat)/${channel.id}`);
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert('Error', 'Failed to create chat. Make sure the user ID exists.');
    }
  };

  // Function to add a user to a channel
  const addUserToChannel = async () => {
    if (!activeChannel || !userIdToAdd.trim()) {
      Alert.alert('Error', 'Please enter a valid user ID');
      return;
    }

    try {
      // Fetch the new user's name first
      const newUserName = await fetchUserName(userIdToAdd.trim());
      
      // Add member to channel
      await activeChannel.addMembers([userIdToAdd.trim()]);
      
      // Update custom data with the new user's name
      const customData = activeChannel.data?.customData as { memberNames?: Record<string, string> } | undefined;
      const updatedMemberNames = {
        ...(customData?.memberNames || {}),
        [userIdToAdd.trim()]: newUserName
      };
      
      // Update the channel's custom data
      await activeChannel.updatePartial({
        set: {
          customData: {
            memberNames: updatedMemberNames
          }
        }
      });
      
      console.log('User added to channel successfully');
      Alert.alert('Success', 'User added to the chat');
      setUserIdToAdd('');
      setActiveChannel(null);
    } catch (error) {
      console.error('Error adding user to channel:', error);
      Alert.alert('Error', 'Failed to add user. Make sure the user ID exists.');
    }
  };

  // Function to handle channel selection
  const handleChannelSelect = (channel: Channel<DefaultStreamChatGenerics>) => {
    router.push(`/(chat)/${channel.id}`);
  };

  // Function to toggle user adding interface for a channel
  const toggleAddUserInterface = (channel: Channel<DefaultStreamChatGenerics>) => {
    if (activeChannel && activeChannel.cid === channel.cid) {
      // If clicking on the same channel, collapse the interface
      setActiveChannel(null);
      setUserIdToAdd('');
    } else {
      // Otherwise, expand the interface for this channel
      setActiveChannel(channel);
      setUserIdToAdd('');
    }
  };

  // Function to get display name for the channel (shows other user's name)
  const getChannelDisplayName = (channel: Channel<DefaultStreamChatGenerics>) => {
    // If there's a custom channel name set by the user, use that
    if (channel.data?.name && 
        typeof channel.data.created_at === 'string' && 
        channel.data.name !== `Chat ${new Date(channel.data.created_at).toLocaleDateString()}`) {
      return channel.data.name;
    }
    
    // Get all members of the channel
    const members = Object.keys(channel.state.members || {});
    
    // If custom data with member names exists, use it
    const customData = channel.data?.customData as { memberNames?: Record<string, string> } | undefined;
    if (customData?.memberNames) {
      const memberNames = customData.memberNames;
      // Find members that aren't the current user
      const otherMembers = members.filter(memberId => memberId !== user.id);
      
      if (otherMembers.length === 1) {
        // For direct chats, show the other person's name
        const otherUserId = otherMembers[0];
        const displayName = memberNames[otherUserId] || userProfiles[otherUserId] || otherUserId;
        
        // If we only have the ID, try to fetch the name for next time
        if (displayName === otherUserId && !userProfiles[otherUserId]) {
          fetchUserName(otherUserId);
        }
        
        return displayName;
      } else if (otherMembers.length > 1) {
        // For group chats, show multiple names
        const otherMemberNames = otherMembers.map(id => {
          const displayName = memberNames[id] || userProfiles[id] || id;
          
          // If we only have the ID, try to fetch the name for next time
          if (displayName === id && !userProfiles[id]) {
            fetchUserName(id);
          }
          
          return displayName;
        }).slice(0, 3);
        
        return otherMemberNames.join(', ') + (otherMembers.length > 3 ? '...' : '');
      }
    }
    
    // Fallback: filter out current user and show other IDs
    const otherMembers = members.filter(memberId => memberId !== user.id);
    
    // Try to fetch names for these users for next time
    otherMembers.forEach(id => {
      if (!userProfiles[id]) {
        fetchUserName(id);
      }
    });
    
    if (otherMembers.length === 0) return 'Just you';
    if (otherMembers.length === 1) {
      return userProfiles[otherMembers[0]] || otherMembers[0];
    }
    
    const displayNames = otherMembers.map(id => userProfiles[id] || id).slice(0, 2);
    return displayNames.join(', ') + (otherMembers.length > 2 ? '...' : '');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* New Chat Creation */}
      <View style={styles.createSection}>
        <Text style={styles.sectionTitle}>Start a New Chat</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Chat Name (optional)"
            value={channelName}
            onChangeText={setChannelName}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="User ID to chat with"
            value={newChatId}
            onChangeText={setNewChatId}
          />
          <TouchableOpacity
            style={[styles.actionButton, !newChatId.trim() && styles.disabledButton]}
            onPress={createNewChannel}
            disabled={!newChatId.trim()}>
            <Text style={styles.actionButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginLeft: 16, marginTop: 16 }]}>Your Chats</Text>

      {/* Channel list */}
      <ChannelList
        filters={{
          members: { $in: [user.id] },
          type: 'messaging',
        }}
        sort={{ last_message_at: -1 }}
        onSelect={handleChannelSelect}
        Preview={(previewProps: ChannelPreviewMessengerProps<DefaultStreamChatGenerics>) => (
          <View>
            <View style={styles.channelPreview}>
              <TouchableOpacity
                style={styles.channelPreviewContent}
                onPress={() => handleChannelSelect(previewProps.channel)}>
                <Text style={styles.channelName}>
                  {getChannelDisplayName(previewProps.channel)}
                </Text>
                <Text numberOfLines={1} style={styles.lastMessage}>
                  {previewProps.latestMessagePreview?.messageObject?.text || 'No messages yet'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => toggleAddUserInterface(previewProps.channel)}>
                <Text style={styles.inviteButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Expandable Add User Interface */}
            {activeChannel && activeChannel.cid === previewProps.channel.cid && (
              <View style={styles.addUserContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="User ID to add"
                  value={userIdToAdd}
                  onChangeText={setUserIdToAdd}
                />
                <TouchableOpacity
                  style={[styles.actionButton, !userIdToAdd.trim() && styles.disabledButton]}
                  onPress={addUserToChannel}
                  disabled={!userIdToAdd.trim()}>
                  <Text style={styles.actionButtonText}>Add User</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  channelPreview: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  channelPreviewContent: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addUserContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
});