'use client';

import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import React, { Suspense, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
const CommentsBottomSheet = React.lazy(() => import('~/components/CommentsBottomSheet'));

import PostCard from '~/components/PostCard';
import { UserProfileHeader } from '~/components/profile/UserProfileHeader';
import InterestGrid from '~/components/profile/InterestMasonary';
import { useUser } from '~/hooks/useUser';
import { useAuth } from '~/components/providers/AuthProvider';
import { AddUserButton } from '~/components/profile/AddUserButton';
import { useRouter } from 'expo-router';
import { supabase } from '~/utils/supabase';

// Import our feed hook and friendship functions
import { useFeed, type FeedItem } from '~/hooks/useFeed';
import {
  sendFriendRequest,
  cancelFriendRequest,
  removeFriend,
  updateFriendshipStatus
} from '~/utils/data';

// Define a header item type to combine with our feed
type HeaderItem = { id: string; type: 'header' };
type ProfileFeedItem = HeaderItem | FeedItem;

function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPendingFromMe, setIsPendingFromMe] = useState(true);

  // Get current auth user's data for friendship functionality
  const { user: currentUser, isFriendsWith, refreshUser } = useUser(
    isRedirecting ? null : (authUser?.id || null)
  );

  // Get profile user's data
  const { user: profileUser } = useUser(
    isRedirecting ? null : (id || null)
  );

  // Determine friendship status
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked'>('none');

  // Redirect if viewing own profile
  useEffect(() => {
    if (id === authUser?.id) {
      setIsRedirecting(true);
      router.replace('/(tabs)/profile');
    }
  }, [id, authUser?.id, router]);

  // Determine friendship status from user data
  useEffect(() => {
    if (isRedirecting || currentUser.isLoading || profileUser.isLoading || !id || !authUser?.id) {
      return;
    }

    // Check if users are friends
    if (isFriendsWith(id)) {
      setFriendStatus('accepted');
      return;
    }

    // Check for pending friendship
    const pendingRequest = currentUser.friendships.find(
      friendship =>
        friendship.status === 'pending' &&
        ((friendship.user_id === authUser.id && friendship.friend_id === id) ||
         (friendship.user_id === id && friendship.friend_id === authUser.id))
    );

    if (pendingRequest) {
      setFriendStatus('pending');
      // Determine who sent the request
      setIsPendingFromMe(pendingRequest.user_id === authUser.id);
      return;
    }

    // Default is no relationship
    setFriendStatus('none');

  }, [currentUser, profileUser, id, authUser?.id, isFriendsWith, isRedirecting]);

  // Use the feed hook with otherProfile type
  const {
    feed: rawFeed,
    loading,
    refresh,
    handleLikePost,
    commentsSheetRef,
    selectedComments,
    selectedCommentsCount,
    openComments,
    addComment,
  } = useFeed(
    'otherProfile',
    isRedirecting ? null : (authUser?.id || null),
    {
      profileUserId: isRedirecting ? undefined : (id || undefined),
    }
  );

  // Friend action handlers
  const handleAddFriend = async () => {
    if (!authUser?.id || !id) return false;

    try {
      const result = await sendFriendRequest(authUser.id, id);

      if (result) {
        setFriendStatus('pending');
        setIsPendingFromMe(true);
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleCancelRequest = async () => {
    if (!authUser?.id || !id) return false;

    try {
      const result = await cancelFriendRequest(authUser.id, id);

      if (result) {
        setFriendStatus('none');
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleAcceptRequest = async () => {
    if (!authUser?.id || !id) return false;

    try {
      // Find the pending request sent by the other user
      const pendingRequest = currentUser.friendships.find(
        friendship =>
          friendship.status === 'pending' &&
          friendship.user_id === id &&
          friendship.friend_id === authUser.id
      );

      if (!pendingRequest) return false;

      // Update it to accepted
      const result = await updateFriendshipStatus(id, authUser.id, 'accepted');
      await updateFriendshipStatus(authUser.id, id, 'accepted');

      if (result) {
        setFriendStatus('accepted');
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleRemoveFriend = async () => {
    if (!authUser?.id || !id) return false;

    try {
      const result = await removeFriend(authUser.id, id);

      if (result) {
        setFriendStatus('none');
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Show loading screen while redirecting
  if (isRedirecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AF9F" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // Combine header with feed items
  const feed: ProfileFeedItem[] = [{ id: 'header', type: 'header' }, ...rawFeed];

  // Format user interests for the interest grid
  const userInterests = profileUser.interests.map((interest) => ({
    id: interest.interest_id,
    name: interest.interests?.name || 'Interest',
  }));

  const renderItem = ({ item }: { item: ProfileFeedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <View style={styles.buttonContainer}>
            <AddUserButton
              status={friendStatus}
              isPendingFromMe={isPendingFromMe}
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
              onCancelRequest={handleCancelRequest}
              onAcceptRequest={handleAcceptRequest}
            />
          </View>
          <UserProfileHeader
            name={profileUser.name || 'User'}
            profileImage={profileUser.image || 'https://randomuser.me/api/portraits/women/44.jpg'}
            postsCount={feed.length - 1}
            friendsCount={profileUser.friendships?.filter((f) => f.status === 'accepted').length || 0}
          />
          <View style={styles.interestsContainer}>
            <InterestGrid interests={userInterests.length > 0 ? userInterests : []} />
          </View>
        </View>
      );
    } else if ('id' in item) {
      return (
        <PostCard
          {...item}
          userId={authUser?.id || ''}
          postUserId={item.postUserId}
          isLiked={item.isLiked || false}
          onLikePress={() => handleLikePost(item.id)}
          onCommentPress={() => openComments(item.id)}
        />
      );
    }
    return null;
  };

  if (profileUser.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AF9F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <View style={{ flex: 1 }}>
          <FlashList
            data={feed}
            renderItem={renderItem}
            keyExtractor={(item) => ('id' in item ? item.id : 'header')}
            estimatedItemSize={300}
            contentContainerStyle={{
              ...styles.listContent,
              paddingBottom: insets.bottom + 16,
            }}
            refreshing={loading}
            onRefresh={refresh}
            ListEmptyComponent={
              !loading && feed.length <= 1 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubtext}>This user hasn't posted anything yet</Text>
                </View>
              ) : null
            }
          />
          <Suspense fallback={<Text style={{ padding: 20 }}>Loading comments...</Text>}>
            <CommentsBottomSheet
              ref={commentsSheetRef}
              comments={selectedComments}
              commentsCount={selectedCommentsCount}
              onAddComment={addComment}
            />
          </Suspense>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 6,
  },
  headerContainer: {
    paddingTop: 0,
  },
  interestsContainer: {
    paddingTop: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'geistBold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
});

export default Profile;
