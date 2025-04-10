import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import React, { useRef, useState, useEffect, Suspense } from 'react';
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
import { getRecommendedPostsForUser } from '~/utils/data';
import { PostsTable } from '~/utils/db';
import { useTabsReload } from '~/app/(tabs)/_layout';
import EventCard from '../../components/EventCard';
import PostCard from '../../components/PostCard';
import EventCarousel from '../../components/UpcomingEventsCarousel';
import { CommentsBottomSheetRef } from '../../components/CommentsBottomSheet';

const CommentsBottomSheet = React.lazy(() => import('../../components/CommentsBottomSheet'));

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
  const [page, setPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user, getInterestIds, getFriendIds } = useUser(authUser?.id || null);

  useEffect(() => {
    // Fetch the feed when user logs in or reloadFlag updates
    fetchFeedData();
  }, [reloadFlag, user, user.id, user.isLoading])

  // Fetch feed data when user data is available
  const fetchFeedData = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      if( !user.id ) return;
      
      const currentPage = loadMore ? page + 1 : 1;
      const POSTS_PER_INTEREST = 3; // Posts per interest per page
      const MAX_AGE_DAYS = 30; // Only show posts from the last 30 days
      const RECOMMENDATIONS_PER_PAGE = 5; // Number of recommendations to show per page

      // Initialize posts array
      let supabasePosts: PostsTable[] = [];

      // 1. Get recommended posts for the user (if not loading more)
      const recommendedPosts = await getRecommendedPostsForUser(
        user.id,
        RECOMMENDATIONS_PER_PAGE
      );
      console.log(recommendedPosts)
      supabasePosts = [...supabasePosts, ...recommendedPosts];

      // 2. Get posts for user's interests with age filtering and randomization
      const interestIds = getInterestIds();
      if (interestIds.length > 0) {
        for (const interestId of interestIds) {
          const posts = await getPostsByInterestId(interestId, {
            maxAgeDays: MAX_AGE_DAYS,
            random: true,
            limit: POSTS_PER_INTEREST,
            page: currentPage
          });
          supabasePosts = [...supabasePosts, ...posts];
        }
      }

      // 3. Get posts from friends with age filtering
      const friendIds = getFriendIds('accepted');
      if (friendIds.length > 0) {
        for (const friendId of friendIds) {
          const posts = await getPostsByUserId(friendId, {
            maxAgeDays: MAX_AGE_DAYS,
            limit: 2, // Limit to 2 posts per friend
            page: currentPage
          });
          supabasePosts = [...supabasePosts, ...posts];
        }
      }

      // 4. Remove duplicate posts
      const uniquePosts = Array.from(
        new Map(supabasePosts.map((post) => [post.id, post])).values()
      );
      // 5. Shuffle the posts to make the feed more random and less grouped
      const shuffledPosts = [...uniquePosts].sort(() => Math.random() - 0.5);

      // 6. Handle pagination and format posts
      if (shuffledPosts.length > 0) {
        // Format posts for UI
        const formattedPosts = await formatPostsForUI(shuffledPosts);

        if (loadMore) {
          // Append to existing feed for pagination
          setFeed(prevFeed => {
            // Filter out duplicates from new posts
            const existingIds = new Set(prevFeed
              .filter(item => 'id' in item)
              .map(item => (item as UIPost).id));

            const newPosts = formattedPosts.filter(post => !existingIds.has(post.id));

            if (newPosts.length === 0) {
              setHasMoreContent(false);
            }

            return [...prevFeed, ...newPosts];
          });

          setPage(currentPage);
        } else {
          // First page load - include carousel at the top
          setFeed([{ type: 'carousel' }, ...formattedPosts]);
          setPage(1);
          setHasMoreContent(true);
        }
      } else {
        if (!loadMore) {
          // No posts to show on first load
          setFeed([{ type: 'carousel' }]);
        }
        setHasMoreContent(false);
      }
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

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
                if (user?.id) {
                  // Reset and fetch fresh data
                  setPage(1);
                  setHasMoreContent(true);
                  fetchFeedData(false);
                }
              }}
              onEndReached={() => {
                // Load more when reaching the end
                if (hasMoreContent && !isLoadingMore && !loading) {
                  fetchFeedData(true);
                }
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#00AF9F" />
                    <Text style={styles.loadingMoreText}>Loading more posts...</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts to show</Text>
                    <Text style={styles.emptySubtext}>
                      Follow interests or connect with friends to see posts
                    </Text>
                  </View>
                ) : null
              }
              ListHeaderComponent={
                <View style={styles.carouselHeaderContainer}>
                  <Text style={styles.carouselHeader}>Next on Your Calendar</Text>
                </View>
              }
            />
          )}
          <Suspense fallback={<Text>Loading comments...</Text>}>
            <CommentsBottomSheet
              ref={commentsSheetRef}
              comments={selectedComments}
              commentsCount={selectedCommentsCount}
              onAddComment={handleAddComment}
              currentUserAvatar={{ uri: user.image }}
            />
          </Suspense>
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
    loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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
  carouselHeaderContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  carouselHeader: {
    fontSize: 20,
    fontFamily: 'geistBold',
    color: '#333',
  },
});

export default HomeScreen;
