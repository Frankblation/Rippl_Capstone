import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ChannelList,
  useChatContext,
  ChannelPreviewMessengerProps,
  DefaultStreamChatGenerics,
} from 'stream-chat-expo';
import { router } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider';
import { Channel } from 'stream-chat';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

import { getUserById, searchUsers } from '~/utils/data';

// Define a user type for search results
type UserSearchResult = {
  id: string;
  name: string;
  // Add other properties you might want to display (avatar, etc.)
};

// Type for the pending match chat data
type PendingMatchChat = {
  matchedUserId: string;
  matchedUserName: string;
  currentUserName: string;
  timestamp: string;
  createChat: boolean;
};

export default function ChatListScreen() {
  const { user } = useAuth();
  const { client: chatClient } = useChatContext();

  // State for creating new chats
  const [channelName, setChannelName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // State for adding users to existing channels
  const [activeChannel, setActiveChannel] = useState<Channel<DefaultStreamChatGenerics> | null>(
    null
  );
  const [addUserSearchQuery, setAddUserSearchQuery] = useState('');
  const [addUserSearchResults, setAddUserSearchResults] = useState<UserSearchResult[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  // Load user profiles when component mounts
  useEffect(() => {
    if (!user) return;

    // Add current user to profiles
    setUserProfiles((prev) => ({
      ...prev,
      [user.id]: user.id, // Initialize with ID, will be updated when we get profile data
    }));
  }, [user]);

  // Check for pending match chat on mount
  useEffect(() => {
    const checkPendingMatchChat = async () => {
      if (!user || !chatClient) return;

      try {
        const pendingMatchChatData = await AsyncStorage.getItem('pendingMatchChat');

        if (pendingMatchChatData) {
          const matchData: PendingMatchChat = JSON.parse(pendingMatchChatData);

          // Only proceed if the createChat flag is true
          if (matchData.createChat && matchData.matchedUserId) {
            console.log('Creating chat for recent match with:', matchData.matchedUserName);

            // Clear the stored data first to prevent duplicate creation
            await AsyncStorage.removeItem('pendingMatchChat');

            // Create the chat channel
            await createMatchChat(matchData);
          }
        }
      } catch (error) {
        console.error('Error checking for pending match chat:', error);
      }
    };

    checkPendingMatchChat();
  }, [user, chatClient]);

  // Function to create a chat from match data
  const createMatchChat = async (matchData: PendingMatchChat) => {
    if (!chatClient || !user) {
      Alert.alert('Error', 'Chat service not available. Please try again later.');
      return;
    }

    try {
      // Generate a unique channel ID
      const channelId = `messaging-${Math.random().toString(36).substring(7)}`;

      // Don't set a fixed channel name - we'll use the dynamic display logic instead
      // to ensure each user sees the other person's name

      // Create channel with current user and the matched user
      const channel = chatClient.channel('messaging', channelId, {
        // No fixed name - will be dynamically generated for each user
        members: [user.id, matchData.matchedUserId],
        created_by_id: user.id,
        // Add custom data for displaying user names
        customData: {
          memberNames: {
            [user.id]: matchData.currentUserName,
            [matchData.matchedUserId]: matchData.matchedUserName,
          },
          matchCreated: true,
        },
      });

      // Create the channel on the Stream server
      await channel.create();
      console.log('Match chat created successfully:', channelId);

      // Navigate directly to the chat screen with this specific channel
      router.push(`/(chat)/${channel.id}`);
    } catch (error) {
      console.error('Error creating match chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };

  // Function to fetch user name and update profiles state
  const fetchUserName = async (userId: string) => {
    try {
      const userData = await getUserById(userId);
      if (userData) {
        // Use the name field that makes most sense for your app
        const displayName = userData.name || userId;

        setUserProfiles((prev) => ({
          ...prev,
          [userId]: displayName,
        }));

        return displayName;
      }
      return userId; // Fallback to ID if user not found
    } catch (error) {
      console.error('Error fetching user data:', error);
      return userId; // Fallback to ID on error
    }
  };

  // Function to search users
  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Call the searchUsers function that you'll need to implement in utils/data.js
      const users = await searchUsers(query);

      // Filter out the current user from results
      const filteredUsers = users.filter((u) => u.id !== user?.id);

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Function to search users for adding to a channel
  const handleAddUserSearch = async (query: string) => {
    if (!query.trim()) {
      setAddUserSearchResults([]);
      return;
    }

    try {
      // Call the searchUsers function
      const users = await searchUsers(query);

      // Filter out users that are already in the channel
      if (activeChannel) {
        const currentMemberIds = Object.keys(activeChannel.state.members || {});
        const filteredUsers = users.filter((u) => !currentMemberIds.includes(u.id));
        setAddUserSearchResults(filteredUsers);
      } else {
        setAddUserSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users for adding:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
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

  // Function to create a new channel with a selected user
  const createNewChannel = async () => {
    if (!chatClient || !selectedUser) {
      Alert.alert('Error', 'Please select a user to chat with');
      return;
    }

    try {
      // Skip the channel name to ensure each user sees the other's name
      // We'll only use the provided name if explicitly entered
      const channelId = `messaging-${Math.random().toString(36).substring(7)}`;

      const channelData: any = {
        members: [user.id, selectedUser.id],
        created_by_id: user.id,
        // Add custom data for displaying user names
        customData: {
          memberNames: {
            [user.id]: userProfiles[user.id] || user.id,
            [selectedUser.id]: selectedUser.name,
          },
        },
      };

      // Only set a specific channel name if provided by user
      if (channelName.trim()) {
        channelData.name = channelName.trim();
      }

      // Create channel with current user and the selected user
      const channel = chatClient.channel('messaging', channelId, channelData);

      await channel.create();
      console.log('Channel created successfully:', channelId);

      // Reset form
      setChannelName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);

      // Navigate to the new channel
      router.push(`/(chat)/${channel.id}`);
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };

  // Function to add a user to a channel
  const addUserToChannel = async (userToAdd: UserSearchResult) => {
    if (!activeChannel) {
      Alert.alert('Error', 'No active channel selected');
      return;
    }

    try {
      // Add member to channel
      await activeChannel.addMembers([userToAdd.id]);

      // Update custom data with the new user's name
      const customData = activeChannel.data?.customData as
        | { memberNames?: Record<string, string> }
        | undefined;
      const updatedMemberNames = {
        ...(customData?.memberNames || {}),
        [userToAdd.id]: userToAdd.name,
      };

      // Update the channel's custom data
      await activeChannel.updatePartial({
        set: {
          customData: {
            memberNames: updatedMemberNames,
          },
        },
      });

      console.log('User added to channel successfully');
      Alert.alert('Success', `${userToAdd.name} added to the chat`);

      // Reset the add user interface
      setAddUserSearchQuery('');
      setAddUserSearchResults([]);
      setActiveChannel(null);
    } catch (error) {
      console.error('Error adding user to channel:', error);
      Alert.alert('Error', 'Failed to add user. Please try again.');
    }
  };

  // Function to delete a channel
  const deleteChannel = async (channel: Channel<DefaultStreamChatGenerics>) => {
    try {
      // Show confirmation dialog
      Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Only channel creator or admins should be able to delete
            if (channel.data?.created_by_id === user.id) {
              await channel.delete();
              console.log('Channel deleted successfully');
              // If the active channel for adding users is the deleted one, reset it
              if (activeChannel && activeChannel.cid === channel.cid) {
                setActiveChannel(null);
                setAddUserSearchQuery('');
                setAddUserSearchResults([]);
              }
            } else {
              // For non-creators, just remove themselves from the channel
              await channel.removeMembers([user.id]);
              console.log('Left the channel successfully');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting channel:', error);
      Alert.alert('Error', 'Failed to delete chat. Please try again.');
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
      setAddUserSearchQuery('');
      setAddUserSearchResults([]);
    } else {
      // Otherwise, expand the interface for this channel
      setActiveChannel(channel);
      setAddUserSearchQuery('');
      setAddUserSearchResults([]);
    }
  };

  // Function to get display name for the channel (shows other user's name)
  const getChannelDisplayName = (channel: Channel<DefaultStreamChatGenerics>) => {
    // If there's a custom channel name explicitly set by the user, use that
    if (channel.data?.name) {
      return channel.data.name;
    }

    // Get all members of the channel
    const members = Object.keys(channel.state.members || {});

    // If custom data with member names exists, use it
    const customData = channel.data?.customData as
      | { memberNames?: Record<string, string> }
      | undefined;
    if (customData?.memberNames) {
      const memberNames = customData.memberNames;
      // Find members that aren't the current user
      const otherMembers = members.filter((memberId) => memberId !== user.id);

      if (otherMembers.length === 0) return 'Just you';
      if (otherMembers.length === 1) {
        // For direct chats, show the other person's name
        const otherUserId = otherMembers[0];
        return memberNames[otherUserId] || userProfiles[otherUserId] || otherUserId;
      } else {
        // For group chats, show multiple names
        const otherMemberNames = otherMembers
          .map((id) => memberNames[id] || userProfiles[id] || id)
          .slice(0, 3);

        return otherMemberNames.join(', ') + (otherMembers.length > 3 ? '...' : '');
      }
    }

    // Fallback: filter out current user and show other IDs
    const otherMembers = members.filter((memberId) => memberId !== user.id);

    // Try to fetch names for these users for next time
    otherMembers.forEach((id) => {
      if (!userProfiles[id]) {
        fetchUserName(id);
      }
    });

    if (otherMembers.length === 0) return 'Just you';
    if (otherMembers.length === 1) {
      return userProfiles[otherMembers[0]] || otherMembers[0];
    }

    const displayNames = otherMembers.map((id) => userProfiles[id] || id).slice(0, 2);
    return displayNames.join(', ') + (otherMembers.length > 2 ? '...' : '');
  };

  // Render search result item
  const renderUserSearchItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => {
        setSelectedUser(item);
        setSearchQuery(item.name);
        setSearchResults([]);
      }}>
      <Text style={styles.searchResultName}>{item.name}</Text>
      <Text style={styles.searchResultId}>{item.id}</Text>
    </TouchableOpacity>
  );

  // Render add user search result item
  const renderAddUserSearchItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity style={styles.searchResultItem} onPress={() => addUserToChannel(item)}>
      <Text style={styles.searchResultName}>{item.name}</Text>
      <Text style={styles.searchResultId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
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
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (selectedUser && text !== selectedUser.name) {
                setSelectedUser(null);
              }
              handleUserSearch(text);
            }}
          />
          <TouchableOpacity
            style={[styles.actionButton, !selectedUser && styles.disabledButton]}
            onPress={createNewChannel}
            disabled={!selectedUser}>
            <Text style={styles.actionButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={searchResults}
              renderItem={renderUserSearchItem}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.searchResultsList}
            />
          </View>
        )}

        {/* Selected User Display */}
        {selectedUser && (
          <View style={styles.selectedUserContainer}>
            <Text style={styles.selectedUserText}>
              Chat with: <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
            </Text>
          </View>
        )}

        {isSearching && <Text style={styles.searchingText}>Searching...</Text>}
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

              <View style={styles.buttonContainer}>
                {/* Add User Button */}
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={() => toggleAddUserInterface(previewProps.channel)}>
                  <Text style={styles.actionIconText}>
                    <Feather name="plus" size={18} color="white" />
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={[styles.actionIconButton, styles.deleteButton]}
                  onPress={() => deleteChannel(previewProps.channel)}>
                  <Text style={styles.actionIconText}>
                    <Feather name="trash" size={18} color="white" />
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Expandable Add User Interface */}
            {activeChannel && activeChannel.cid === previewProps.channel.cid && (
              <View style={styles.addUserContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Search users to add..."
                  value={addUserSearchQuery}
                  onChangeText={(text) => {
                    setAddUserSearchQuery(text);
                    handleAddUserSearch(text);
                  }}
                />

                {/* Add User Search Results */}
                {addUserSearchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <FlatList
                      data={addUserSearchResults}
                      renderItem={renderAddUserSearchItem}
                      keyExtractor={(item) => item.id}
                      keyboardShouldPersistTaps="handled"
                      style={styles.searchResultsList}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      />
    </View>
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
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00AF9F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#F39237',
  },
  actionIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addUserContainer: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchResultsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultId: {
    fontSize: 12,
    color: '#666',
  },
  selectedUserContainer: {
    backgroundColor: '#e6f7ff',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedUserText: {
    fontSize: 14,
  },
  selectedUserName: {
    fontWeight: 'bold',
  },
  searchingText: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});
