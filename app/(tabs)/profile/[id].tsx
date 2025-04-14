'use client';

import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import React, { Suspense } from 'react';
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

// Import our feed hook
import { useFeed, type FeedItem } from '~/hooks/useFeed';

// Define a header item type to combine with our feed
type HeaderItem = { id: string; type: 'header' };
type ProfileFeedItem = HeaderItem | FeedItem;

function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const router = useRouter();

  if ( id === authUser?.id ) {
    // If it is current user then route to profile page
    router.push('/(tabs)/profile/index');
  }

  // Fetch the profile user's data
  const { user } = useUser(id || null);

  // Use the feed hook with otherProfile type instead of profile
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
  } = useFeed('otherProfile', authUser?.id || null, {
    profileUserId: id || undefined,
  });

  // Combine header with feed items
  const feed: ProfileFeedItem[] = [{ id: 'header', type: 'header' }, ...rawFeed];

  // Format user interests for the interest grid
  const userInterests = user.interests.map((interest) => ({
    id: interest.interest_id,
    name: interest.interests?.name || 'Interest',
  }));

  const renderItem = ({ item }: { item: ProfileFeedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <View style={styles.buttonContainer}>
            <AddUserButton
              status="none"
              onAddFriend={async () => true}
              onRemoveFriend={async () => true}
            />
          </View>
          <UserProfileHeader
            name={user.name || 'User'}
            profileImage={user.image || 'https://randomuser.me/api/portraits/women/44.jpg'}
            postsCount={feed.length - 1}
            friendsCount={user.friendships?.filter((f) => f.status === 'accepted').length || 0}
          />
          <View style={styles.interestsContainer}>
            <InterestGrid interests={userInterests.length > 0 ? userInterests : []} />
          </View>
        </View>
      );
    } else if ('id' in item) {
      // Check if it's a post/event (both have IDs)
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

  if (user.isLoading) {
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
