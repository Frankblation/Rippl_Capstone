import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '~/components/providers/AuthProvider';
import { useUser } from '~/hooks/useUser';
// DB stuff
import {
  getUserById,
  getPostsByUserId,
  getUserInterests,
  getUserFriendships,
  getPostsByInterestId,
  getInterestById,
} from '~/utils/data';

// Import the formatter
import { formatPostsForUI, UIPost, PostComment } from '~/utils/formatPosts';

import { PostsTable } from '~/utils/db';
import { useTabsReload } from '~/app/(tabs)/_layout';
import EventCard from '../../components/EventCard';
import PostCard from '../../components/PostCard';
import EventCarousel from '../../components/UpcomingEventsCarousel';
import CommentsBottomSheet, { CommentsBottomSheetRef } from '../../components/CommentsBottomSheet';

// Define FeedItem type for items that can be in the feed
type FeedItem = UIPost | { type: 'carousel' };

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([{ type: 'carousel' }]);
  const [loading, setLoading] = useState(true);
  const { reloadFlag } = useTabsReload();

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user, getInterestIds, getFriendIds } = useUser(authUser?.id || null);

  // Fetch feed data when user data is available
  useEffect(() => {
    // Skip if we're still loading user data or no user ID
    if (user.isLoading || !user.id) return;

    const fetchFeedData = async () => {
      try {
        setLoading(true);

        // Initialize posts array
        let supabasePosts: PostsTable[] = [];

        // 1. Get posts for user's interests
        const interestIds = getInterestIds();

        if (interestIds.length > 0) {
          for (const interestId of interestIds) {
            const posts = await getPostsByInterestId(interestId);
            supabasePosts = [...supabasePosts, ...posts];
          }
        }

        // 2. Get posts from friends
        const friendIds = getFriendIds('accepted');

        if (friendIds.length > 0) {
          for (const friendId of friendIds) {
            const posts = await getPostsByUserId(friendId);
            supabasePosts = [...supabasePosts, ...posts];
          }
        }

        // 3. Remove duplicate posts
        const uniquePosts = Array.from(
          new Map(supabasePosts.map((post) => [post.id, post])).values()
        );

        // 4. Format posts for UI
        if (uniquePosts.length > 0) {
          const formattedPosts = await formatPostsForUI(uniquePosts);
          setFeed([{ type: 'carousel' }, ...formattedPosts]);
        } else {
          setFeed([{ type: 'carousel' }]);
        }
      } catch (error) {
        console.error('Error fetching feed data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [user.id, user.interests, user.isLoading, reloadFlag]);

  const handleOpenComments = (post: UIPost) => {
    // Use the comments from the formatted post
    setSelectedComments(post.comments || []);
    setSelectedCommentsCount(post.commentsCount);
    commentsSheetRef.current?.open();
  };

  const handleAddComment = (text: string) => {
    const newComment: PostComment = {
      id: Date.now().toString(),
      username: user?.name || 'current_user',
      userAvatar: { uri: user?.image || 'https://randomuser.me/api/portraits/women/68.jpg' },
      text,
      timePosted: 'Just now',
    };
    setSelectedComments((prev) => [...prev, newComment]);
    setSelectedCommentsCount((prev) => prev + 1);

    // Add logic to save the comment to database
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'post') {
      return (
        <PostCard
          {...item}
          userId={item.postUserId}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(item)}
        />
      );
    } else if (item.type === 'event') {
      return (
        <EventCard
          {...item}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(item)}
        />
      );
    } else if (item.type === 'carousel') {
      return <EventCarousel />;
    }
    return null;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00AF9F" />
              <Text style={styles.loadingText}>Loading your feed...</Text>
            </View>
          ) : (
            <FlashList
              data={feed}
              renderItem={renderItem}
              keyExtractor={(item, index) => ('id' in item ? item.id : `carousel-${index}`)}
              estimatedItemSize={300}
              contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
              refreshing={loading}
              onRefresh={() => {
                if (user) {
                  setLoading(true);
                  // This will trigger the useEffect again
                  setFeed([{ type: 'carousel' }]);
                }
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts to show</Text>
                  <Text style={styles.emptySubtext}>
                    Follow interests or connect with friends to see posts
                  </Text>
                </View>
              }
            />
          )}
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
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

export default HomeScreen;
