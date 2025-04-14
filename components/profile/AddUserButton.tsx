import { ActivityIndicator, Alert, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'blocked';

type Props = {
  style?: StyleProp<ViewStyle>;
  status: FriendshipStatus;
  onAddFriend: () => Promise<boolean>;
  onRemoveFriend: () => Promise<boolean>;
  onCancelRequest?: () => Promise<boolean>;
};

export function AddUserButton({
  style,
  status = 'none',
  onAddFriend,
  onRemoveFriend,
  onCancelRequest
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) return;
    console.log('Button Pressed')

    setIsLoading(true);
    try {
      let success = false;

      switch (status) {
        case 'none':
          // Send friend request
          success = await onAddFriend();
          if (!success) {
            Alert.alert('Error', 'Failed to send friend request');
          }
          break;

        case 'pending':
          // Cancel pending request
          if (onCancelRequest) {
            success = await onCancelRequest();
            if (!success) {
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          }
          break;

        case 'accepted':
          // Remove friend
          Alert.alert(
            'Remove Friend',
            'Are you sure you want to remove this friend?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  success = await onRemoveFriend();
                  if (!success) {
                    Alert.alert('Error', 'Failed to remove friend');
                  }
                }
              }
            ]
          );
          break;
      }

    } catch (error) {
      console.error('Friendship action failed:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Return the appropriate icon based on status
  const renderIcon = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color="#00AF9F" />;
    }

    switch (status) {
      case 'none':
        return (
          <Feather
            name="user-plus"
            size={24}
            color="#00AF9F"
            style={{ marginRight: 16 }}
          />
        );
      case 'pending':
        return (
          <Feather
            name="clock"
            size={24}
            color="#F59E0B"
            style={{ marginRight: 16 }}
          />
        );
      case 'accepted':
        return (
          <Feather
            name="user-check"
            size={24}
            color="#00AF9F"
            style={{ marginRight: 16 }}
          />
        );
      case 'blocked':
        return (
          <Feather
            name="user-x"
            size={24}
            color="#EF4444"
            style={{ marginRight: 16 }}
          />
        );
    }
  };

  return (
    <Pressable
      style={[style, { opacity: isLoading ? 0.7 : 1 }]}
      onPress={handlePress}
      disabled={isLoading || status === 'blocked'}
    >
      {renderIcon()}
    </Pressable>
  );
}
