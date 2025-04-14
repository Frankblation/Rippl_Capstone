import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import React, { Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '~/components/providers/AuthProvider';
// Import our new hook
import { useFeed, FeedItem } from '~/hooks/useFeed';
import EventCard from '../../components/EventCard';
import PostCard from '../../components/PostCard';
import EventCarousel from '../../components/UpcomingEventsCarousel';

const CommentsBottomSheet = React.lazy(() => import('../../components/CommentsBottomSheet'));

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  console.log('Home screen rendering')
  // Use our new hook for all feed functionality
  const {
    feed,
    loading,
    isLoadingMore,

    // Like functionality
    handleLikePost,

    // Comments functionality
    commentsSheetRef,
    selectedComments,
    selectedCommentsCount,
    openComments,
    addComment,

    // Feed operations
    loadMore,
    refresh
  } = useFeed('home', authUser?.id || null, {
    includeCarousel: true,
    postsPerPage: 10,  // Adjust based load times
    maxAgeDays: 30     // Show posts from last 30 days
  });


  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'post') {
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
    } else if (item.type === 'event') {
      return (
        <EventCard
          {...item}
          isLiked={item.isLiked || false}
          onLikePress={() => handleLikePost(item.id)}
          onCommentPress={() => openComments(item.id)}
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
          {loading && feed.length === 0 ? (
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
              onRefresh={refresh}
              onEndReached={loadMore}
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
              onAddComment={addComment}
            />
          </Suspense>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Keep existing styles
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
