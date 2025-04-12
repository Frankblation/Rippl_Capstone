'use client';

import { FlashList } from '@shopify/flash-list';
import React, { Suspense } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CommentsBottomSheetRef } from '~/components/CommentsBottomSheet';
const CommentsBottomSheet = React.lazy(() => import('~/components/CommentsBottomSheet'));

import PostCard from '~/components/PostCard';
import { UserProfileHeader } from '~/components/profile/UserProfileHeader';
import InterestGrid from '~/components/profile/InterestMasonary';
import { useUser } from '~/hooks/useUser';
import { useAuth } from '~/components/providers/AuthProvider';
import { StatusBar } from 'expo-status-bar';

// Import our feed hook
import { useFeed, FeedItem } from '~/hooks/useFeed';

// Define a header item type to combine with our feed
type HeaderItem = { id: string; type: 'header' };
type ProfileFeedItem = HeaderItem | FeedItem;

const CurrentUser: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user } = useUser(authUser?.id || null);

  // Use the feed hook for profile posts
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
    // Keeping invalidateCache for manual refreshes, but we don't need it for auto-refresh
    invalidateCache
  } = useFeed('profile', authUser?.id || null);

  // Combine header with feed items
  const feed: ProfileFeedItem[] = [
    { id: 'header', type: 'header' },
    ...rawFeed
  ];

  // Format user interests for the interest grid
  const userInterests = user.interests.map((interest) => ({
    id: interest.interest_id,
    name: interest.interests?.name || 'Interest',
  }));

  const renderItem = ({ item }: { item: ProfileFeedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
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
    } else if ('id' in item) { // Check if it's a post/event (both have IDs)
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
                  <Text style={styles.emptySubtext}>Your posts will appear here</Text>
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
};

const styles = StyleSheet.create({
  // Styles remain unchanged
  listContent: {
    padding: 6,
  },
  headerContainer: {
    paddingTop: 0,
  },
  interestsContainer: {
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
});

export default CurrentUser;
