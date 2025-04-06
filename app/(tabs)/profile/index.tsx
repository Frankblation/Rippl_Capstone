'use client';

import { FlashList } from '@shopify/flash-list';
import type React from 'react';
import { useRef, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Alert, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CommentsBottomSheet, {
  type CommentsBottomSheetRef,
  type PostComment,
} from '~/components/CommentsBottomSheet';
import PostCard from '~/components/PostCard';
import { UserProfileHeader } from '~/components/UserProfileHeader';
import InterestGrid from '~/components/profile/InterestMasonary';
import { useUser } from '~/hooks/useUser';
import { useAuth } from '~/components/providers/AuthProvider';
import { getPostsByUserId } from '~/utils/data';
import { formatPostsForUI, UIPost } from '~/utils/formatPosts';

// Define feed item types
type FeedItem = { id: string; type: 'header' } | UIPost;

const CurrentUser: React.FC = () => {
  const insets = useSafeAreaInsets();
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([{ id: 'header', type: 'header' }]);
  const [loading, setLoading] = useState(true);

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user } = useUser(authUser?.id || null);

  // Fetch user posts for profile
  useEffect(() => {
    if (user.isLoading || !user.id) return;

    const fetchUserPosts = async () => {
      try {
        setLoading(true);

        // Get posts created by the user
        const userPosts = await getPostsByUserId(user.id);

        // Format posts for UI display
        if (userPosts.length > 0) {
          const formattedPosts = await formatPostsForUI(userPosts);

          // Set the feed with header at the top followed by posts
          setFeed([{ id: 'header', type: 'header' }, ...formattedPosts]);
        } else {
          setFeed([{ id: 'header', type: 'header' }]);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user.id, user.isLoading]);

  // Handle comments
  const handleOpenComments = (post: UIPost) => {
    setSelectedComments(post.comments || []);
    setSelectedCommentsCount(post.commentsCount);
    commentsSheetRef.current?.open();
  };

  const handleAddComment = (text: string) => {
    const newComment: PostComment = {
      id: Date.now().toString(),
      username: user.name || 'current_user',
      userAvatar: { uri: user.image || 'https://randomuser.me/api/portraits/women/68.jpg' },
      text,
      timePosted: 'Just now',
    };
    setSelectedComments((prev) => [...prev, newComment]);
    setSelectedCommentsCount((prev) => prev + 1);
  };

  // Format user interests for the interest grid
  const userInterests = user.interests.map(interest => ({
    id: interest.interest_id,
    name: interest.interests?.name || 'Interest'
  }));

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <UserProfileHeader
            name={user.name || 'User'}
            profileImage={user.image || 'https://randomuser.me/api/portraits/women/44.jpg'}
            postsCount={feed.length - 1}
            friendsCount={user.friendships?.filter(f => f.status === 'accepted').length || 0}
          />
          <View style={styles.interestsContainer}>
            <InterestGrid interests={userInterests.length > 0 ? userInterests : []} />
          </View>
        </View>
      );
    } else if (item.type === 'post' || item.type === 'event') {
      return (
        <PostCard
          {...item}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => console.log('Profile pressed')}
          onCommentPress={() => handleOpenComments(item)}
        />
      );
    }
    return null;
  };

  if (user.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <FlashList
            data={feed}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={300}
            contentContainerStyle={{
              ...styles.listContent,
              paddingBottom: insets.bottom + 16,
            }}
            refreshing={loading}
            onRefresh={() => {
              if (user.id) {
                setLoading(true);
                // This will trigger the useEffect again
                setFeed([{ id: 'header', type: 'header' }]);
              }
            }}
            ListEmptyComponent={
              !loading && feed.length <= 1 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubtext}>Your posts will appear here</Text>
                </View>
              ) : null
            }
          />

          <CommentsBottomSheet
            ref={commentsSheetRef}
            comments={selectedComments}
            commentsCount={selectedCommentsCount}
            onAddComment={handleAddComment}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 6,
  },
  headerContainer: {
    paddingTop: 20,
  },
  interestsContainer: {
    paddingTop: 20,
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CurrentUser;
