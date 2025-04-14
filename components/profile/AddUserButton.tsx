import { ActivityIndicator, Alert, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'blocked';

type Props = {
  style?: StyleProp<ViewStyle>;
  status: FriendshipStatus;
  isPendingFromMe?: boolean;
  onAddFriend: () => Promise<boolean>;
  onRemoveFriend: () => Promise<boolean>;
  onCancelRequest?: () => Promise<boolean>;
  onAcceptRequest?: () => Promise<boolean>;
};

export function AddUserButton({
  style,
  status = 'none',
  isPendingFromMe = true,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  onAcceptRequest
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) {
      return;
    }

    // Handle each status case separately with proper loading states
    switch (status) {
      case 'none':
        try {
          setIsLoading(true);
          const success = await onAddFriend();

          if (!success) {
            Alert.alert('Error', 'Failed to send friend request');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to send friend request');
        } finally {
          setIsLoading(false);
        }
        break;

      case 'pending':
        if (isPendingFromMe && onCancelRequest) {
          // If I sent the request, allow cancellation
          try {
            setIsLoading(true);
            const success = await onCancelRequest();

            if (!success) {
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel friend request');
          } finally {
            setIsLoading(false);
          }
        } else if (!isPendingFromMe && onAcceptRequest) {
          // If they sent the request, allow acceptance
          try {
            setIsLoading(true);
            const success = await onAcceptRequest();

            if (!success) {
              Alert.alert('Error', 'Failed to accept friend request');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to accept friend request');
          } finally {
            setIsLoading(false);
          }
        }
        break;

      case 'accepted':
        Alert.alert(
          'Remove Friend',
          'Are you sure you want to remove this friend?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  const success = await onRemoveFriend();

                  if (!success) {
                    Alert.alert('Error', 'Failed to remove friend');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to remove friend');
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
        break;

      case 'blocked':
        // Blocked users can't interact
        break;
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
        if (isPendingFromMe) {
          return (
            <Feather
              name="clock"
              size={24}
              color="#F59E0B"
              style={{ marginRight: 16 }}
            />
          );
        } else {
          return (
            <Feather
              name="user-plus"
              size={24}
              color="#10B981"
              style={{ marginRight: 16 }}
            />
          );
        }
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
