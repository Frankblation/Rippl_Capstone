/**
 * SIMPLIFIED FEED MANAGEMENT
 *
 * Uses just three global states:
 * 1. Home feed
 * 2. Current user profile feed
 * 3. Other user profile feed (reused for different profiles)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '~/utils/supabase';
import {
  getPostsByUserId,
  getPostsByInterestId,
  getRecommendedPostsForUser,
  createComment,
  likePost,
  unlikePost,
  getCommentsByPost
} from '~/utils/data';
import { formatPostsForUI, UIPost, PostComment } from '~/utils/formatPosts';
import { useUser } from './useUser';
import { PostsTable } from '~/utils/db';

// This will help us track update cycles for debugging
let debugCounter = 0;

// Types
export type FeedItem = UIPost | { type: 'carousel' };
export type FeedType = 'home' | 'profile' | 'otherProfile';

// Interface for the comments bottom sheet ref
export interface CommentSheetRef {
  open: () => void;
  close: () => void;
}

// Define feed state type to fix typing issues
interface FeedState {
  items: FeedItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  timestamp: number;
  userId?: string | null; // Optional for otherUserFeed
}

// Simple global state with just three feeds
const globalState = {
  // The three main feeds
  homeFeed: {
    items: [] as FeedItem[],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    error: null as string | null,
    page: 1,
    timestamp: 0
  } as FeedState,

  currentUserFeed: {
    items: [] as FeedItem[],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    error: null as string | null,
    page: 1,
    timestamp: 0
  } as FeedState,

  otherUserFeed: {
    items: [] as FeedItem[],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    error: null as string | null,
    page: 1,
    timestamp: 0,
    userId: null as string | null // Track whose feed this is
  } as FeedState,

  // Shared data across components
  likedPosts: new Set<string>(),

  // Subscribers for data changes
  subscribers: {
    home: new Set<() => void>(),
    currentUser: new Set<() => void>(),
    otherUser: new Set<() => void>()
  },

  // Helper to notify subscribers of changes
  notifySubscribers(feedType: FeedType) {
    debugCounter++;
    console.log(`[${debugCounter}] Notifying ${feedType} subscribers`);

    // Create a copy to avoid issues with subscribers removing themselves during iteration
    const subscribers = feedType === 'home' ? [...this.subscribers.home] :
                        feedType === 'profile' ? [...this.subscribers.currentUser] :
                        [...this.subscribers.otherUser];

    subscribers.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('Error in subscriber callback:', err);
      }
    });
  }
};

// For forcefully resetting stuck loading state
export function resetAllFeedLoadingStates() {
  console.log('Manually resetting all feed loading states');

  // Reset all feeds to not loading
  globalState.homeFeed.isLoading = false;
  globalState.currentUserFeed.isLoading = false;
  globalState.otherUserFeed.isLoading = false;

  // Notify all subscribers
  globalState.notifySubscribers('home');
  globalState.notifySubscribers('profile');
  globalState.notifySubscribers('otherProfile');
}

// Options for feed configuration
interface UseFeedOptions {
  includeCarousel?: boolean;
  postsPerPage?: number;
  maxAgeDays?: number;
  profileUserId?: string; // For profile feed
}

/**
 * Main hook for feed management
 * @param feedType Type of feed to use
 * @param authUserId Current authenticated user's ID
 * @param options Configuration options
 */
export function useFeed(
  feedType: FeedType,
  authUserId: string | null,
  options: UseFeedOptions = {}
) {
  const {
    includeCarousel = feedType === 'home',
    postsPerPage = 5,
    maxAgeDays = 30,
    profileUserId
  } = options;

  // Determine which feed to use - memoize to prevent unnecessary rerenders
  const getFeedState = useCallback((): FeedState => {
    switch (feedType) {
      case 'home':
        return globalState.homeFeed;
      case 'profile':
        return globalState.currentUserFeed;
      case 'otherProfile':
        return globalState.otherUserFeed;
      default:
        // TypeScript needs this for exhaustiveness check
        return globalState.homeFeed;
    }
  }, [feedType]);

  // Local state that reflects the global state
  const [feedData, setFeedData] = useState<FeedState>(getFeedState());
  const [likedPosts, setLikedPosts] = useState(globalState.likedPosts);

  // Comment state
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Create ref for bottom sheet
  const commentsSheetRef = useRef<CommentSheetRef>(null);

  // Get user data from the user hook
  const { user, getInterestIds, getFriendIds } = useUser(authUserId);

  // Subscribe to global state changes
  useEffect(() => {
    const handleStateChange = () => {
      setFeedData({ ...getFeedState() });
      setLikedPosts(new Set(globalState.likedPosts));
    };

    // Add to the appropriate subscriber list
    if (feedType === 'home') {
      globalState.subscribers.home.add(handleStateChange);
    } else if (feedType === 'profile') {
      globalState.subscribers.currentUser.add(handleStateChange);
    } else if (feedType === 'otherProfile') {
      globalState.subscribers.otherUser.add(handleStateChange);
    }

    return () => {
      // Remove from the subscriber list when unmounting
      if (feedType === 'home') {
        globalState.subscribers.home.delete(handleStateChange);
      } else if (feedType === 'profile') {
        globalState.subscribers.currentUser.delete(handleStateChange);
      } else if (feedType === 'otherProfile') {
        globalState.subscribers.otherUser.delete(handleStateChange);
      }
    };
  }, [feedType, getFeedState]);

  // For other user profiles, update the feed when profileUserId changes
  useEffect(() => {
    if (feedType !== 'otherProfile' || !profileUserId) return;

    // Skip if user ID hasn't actually changed
    if (globalState.otherUserFeed.userId === profileUserId) return;

    console.log(`Switching otherProfile feed to user: ${profileUserId}`);

    // Reset the other user feed when viewing a different user
    globalState.otherUserFeed = {
      ...globalState.otherUserFeed,
      items: [],
      isLoading: true,
      page: 1,
      timestamp: 0,
      userId: profileUserId
    };

    // Notify subscribers
    globalState.notifySubscribers('otherProfile');

    // Don't call fetchFeedData directly here - let the normal feed loading effect handle it
  }, [feedType, profileUserId]);  // Only depend on these two props

  // Function to update feed state and notify subscribers
  const updateFeedData = useCallback((updater: (data: FeedState) => FeedState) => {
    const currentData = getFeedState();
    const newData = updater(currentData);

    // Skip update if nothing changes (deep compare important keys)
    const hasChanged = JSON.stringify({
      items: newData.items.map(item => 'id' in item ? item.id : 'carousel'),
      isLoading: newData.isLoading,
      isLoadingMore: newData.isLoadingMore,
      error: newData.error,
      page: newData.page
    }) !== JSON.stringify({
      items: currentData.items.map(item => 'id' in item ? item.id : 'carousel'),
      isLoading: currentData.isLoading,
      isLoadingMore: currentData.isLoadingMore,
      error: currentData.error,
      page: currentData.page
    });

    if (!hasChanged) {
      console.log(`${feedType} feed update skipped - no changes`);
      return;
    }

    // Update the global state
    if (feedType === 'home') {
      globalState.homeFeed = newData;
    } else if (feedType === 'profile') {
      globalState.currentUserFeed = newData;
    } else if (feedType === 'otherProfile') {
      globalState.otherUserFeed = {
        ...newData,
        userId: globalState.otherUserFeed.userId
      };
    }

    // Notify subscribers
    console.log(`${feedType} feed updated, notifying subscribers`);
    globalState.notifySubscribers(feedType);
  }, [feedType, getFeedState]);

  // Load user's liked posts if not already loaded
  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!authUserId || globalState.likedPosts.size > 0) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_post_engagement')
          .select('post_id')
          .eq('user_id', authUserId)
          .eq('has_liked', true);

        if (error) throw error;

        if (data) {
          data.forEach(item => globalState.likedPosts.add(item.post_id));
          setLikedPosts(new Set(globalState.likedPosts));
        }
      } catch (error) {
        console.error('Error loading liked posts:', error);
      }
    };

    if (authUserId) {
      loadLikedPosts();
    }
  }, [authUserId]);

  // Main function to fetch feed data
  const fetchFeedData = useCallback(async (loadMore = false, force = false) => {
    // Skip validation checks if force=true is passed
    if (!force) {
      // For home feed, require auth user
      if (feedType === 'home' && !authUserId) return;

      // For profile feed, check if we're logged in
      if (feedType === 'profile' && !authUserId) return;

      // For home feed, require interests
      if (feedType === 'home' && (!user?.id || getInterestIds().length === 0)) {
        updateFeedData(data => ({ ...data, isLoading: false }));
        return;
      }
    }

    // Update loading state
    updateFeedData(data => ({
      ...data,
      isLoading: !loadMore,
      isLoadingMore: loadMore,
      error: null
    }));

    try {
      console.log(`${feedType} feed: Starting data fetch...`);
      const currentData = getFeedState();
      const currentPage = loadMore ? currentData.page + 1 : 1;
      let posts: PostsTable[] = [];

      // Determine which user ID to use for fetching
      let targetUserId: string | null = null;

      if (feedType === 'home') {
        // HOME FEED LOGIC
        if (user?.id) {
          console.log('Fetching home feed data');

          // 1. Get recommended posts
          const recommendedPosts = await getRecommendedPostsForUser(user.id, Math.floor(postsPerPage / 2));
          posts = [...posts, ...recommendedPosts];

          // 2. Get posts from user's interests
          const interestIds = getInterestIds();
          if (interestIds.length > 0) {
            for (const interestId of interestIds) {
              const interestPosts = await getPostsByInterestId(interestId, {
                maxAgeDays,
                random: true,
                limit: Math.max(2, Math.floor(postsPerPage / interestIds.length)),
                page: currentPage,
              });
              posts = [...posts, ...interestPosts];
            }
          }

          // 3. Get posts from friends
          const friendIds = getFriendIds('accepted');
          if (friendIds.length > 0) {
            for (const friendId of friendIds) {
              const friendPosts = await getPostsByUserId(friendId, {
                maxAgeDays,
                limit: 2,
                page: currentPage,
              });
              posts = [...posts, ...friendPosts];
            }
          }

          // 4. Shuffle posts for variety
          posts = [...posts].sort(() => Math.random() - 0.5);
        }
      } else if (feedType === 'profile') {
        // CURRENT USER PROFILE FEED
        targetUserId = authUserId;
        if (targetUserId) {
          posts = await getPostsByUserId(targetUserId, {
            limit: postsPerPage,
            page: currentPage
          });
        }
      } else if (feedType === 'otherProfile') {
        // OTHER USER PROFILE FEED
        targetUserId = profileUserId || null;
        if (targetUserId) {
          posts = await getPostsByUserId(targetUserId, {
            limit: postsPerPage,
            page: currentPage
          });
        }
      }

      console.log(`${feedType} feed: Fetched ${posts.length} posts`);

      // Remove duplicates
      const uniquePosts = Array.from(
        new Map(posts.map(post => [post.id, post])).values()
      );

      if (uniquePosts.length > 0) {
        // Format posts for UI
        const formattedPosts = await formatPostsForUI(uniquePosts);

        // Add like status from our cache
        const enhancedPosts = formattedPosts.map(post => ({
          ...post,
          isLiked: globalState.likedPosts.has(post.id)
        }));

        // Update feed data
        updateFeedData(data => {
          if (loadMore) {
            // For pagination: filter out posts we already have
            const existingIds = new Set(
              data.items
                .filter((item): item is UIPost => 'id' in item)
                .map(item => item.id)
            );

            const newPosts = enhancedPosts.filter(post => !existingIds.has(post.id));

            return {
              ...data,
              items: [...data.items, ...newPosts],
              page: currentPage,
              hasMore: newPosts.length >= postsPerPage / 2,
              isLoading: false,
              isLoadingMore: false,
              timestamp: Date.now()
            };
          } else {
            // First page load
            const newItems: FeedItem[] = [];
            if (feedType === 'home' && includeCarousel) {
              newItems.push({ type: 'carousel' });
            }

            const result: FeedState = {
              ...data,
              items: [...newItems, ...enhancedPosts],
              page: 1,
              hasMore: enhancedPosts.length >= postsPerPage,
              isLoading: false,
              isLoadingMore: false,
              timestamp: Date.now()
            };

            // Add userId for otherProfile
            if (feedType === 'otherProfile') {
              result.userId = profileUserId || null;
            }

            return result;
          }
        });
      } else {
        // No posts found
        console.log(`${feedType} feed: No posts found`);
        updateFeedData(data => {
          const result: FeedState = {
            ...data,
            items: feedType === 'home' && !loadMore && includeCarousel ? [{ type: 'carousel' }] : [],
            hasMore: false,
            isLoading: false,
            isLoadingMore: false,
            timestamp: Date.now()
          };

          // Add userId for otherProfile
          if (feedType === 'otherProfile') {
            result.userId = profileUserId || null;
          }

          return result;
        });
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      updateFeedData(data => ({
        ...data,
        error: err instanceof Error ? err.message : 'Failed to load feed',
        isLoading: false,
        isLoadingMore: false
      }));
    }
  }, [
    feedType,
    authUserId,
    profileUserId,
    user?.id,
    includeCarousel,
    postsPerPage,
    maxAgeDays,
    getInterestIds,
    getFriendIds,
    updateFeedData,
    getFeedState
  ]);

  // Load feed data on first render or when user data changes
  useEffect(() => {
    // Add a timeout to force load if stuck in loading state for too long
    let timeout: NodeJS.Timeout | null = null;

    if (getFeedState().isLoading) {
      console.log(`${feedType} feed is already loading, checking for stuck state...`);

      // If the feed has been in loading state for more than 5 seconds, force a refresh
      const loadingTimestamp = getFeedState().timestamp;
      const currentTime = Date.now();
      const loadingDuration = currentTime - loadingTimestamp;

      if (loadingTimestamp === 0 || loadingDuration > 5000) {
        console.log(`${feedType} feed appears stuck in loading state, forcing refresh`);
        timeout = setTimeout(() => fetchFeedData(false, true), 100);
        return () => {
          if (timeout) clearTimeout(timeout);
        };
      }

      return;
    }

    const userDataAvailable = !!user && !!user.id && !user.isLoading;
    const hasInterests = getInterestIds().length > 0;

    // Different requirements for different feed types
    let dataComplete = false;

    if (feedType === 'home') {
      dataComplete = userDataAvailable && hasInterests;
    } else if (feedType === 'profile') {
      dataComplete = userDataAvailable;
    } else if (feedType === 'otherProfile') {
      dataComplete = !!profileUserId;
    }

    if (dataComplete) {
      const currentData = getFeedState();
      const isCacheStale =
        Date.now() - currentData.timestamp > 5 * 60 * 1000 ||
        currentData.items.length === 0;

      // For otherProfile, check if the userId changed
      const userChanged = feedType === 'otherProfile' &&
        currentData.userId !== profileUserId;

      if (isCacheStale || userChanged) {
        console.log(`${feedType} feed needs refresh, fetching data`);
        timeout = setTimeout(() => fetchFeedData(false), 0);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [user, getInterestIds, feedType, profileUserId, fetchFeedData, getFeedState]);

  // LIKE FUNCTIONALITY
  const handleLikePost = useCallback(async (postId: string) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like posts');
      return;
    }

    // Check if already liked
    const isCurrentlyLiked = globalState.likedPosts.has(postId);
    const newIsLiked = !isCurrentlyLiked;

    // Optimistically update UI
    if (newIsLiked) {
      globalState.likedPosts.add(postId);
    } else {
      globalState.likedPosts.delete(postId);
    }
    setLikedPosts(new Set(globalState.likedPosts));

    // Update post in all feeds
    updatePostInAllFeeds(postId, (post) => ({
      ...post,
      isLiked: newIsLiked,
      likesCount: newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
    }));

    // Persist to database
    try {
      if (newIsLiked) {
        await likePost(user.id, postId);
      } else {
        await unlikePost(user.id, postId);
      }
    } catch (error) {
      console.error('Error updating like status:', error);

      // Revert optimistic update
      if (isCurrentlyLiked) {
        globalState.likedPosts.add(postId);
      } else {
        globalState.likedPosts.delete(postId);
      }
      setLikedPosts(new Set(globalState.likedPosts));

      // Revert updates in all feeds
      updatePostInAllFeeds(postId, (post) => ({
        ...post,
        isLiked: isCurrentlyLiked,
        likesCount: isCurrentlyLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
      }));

      Alert.alert('Error', 'Failed to update like status');
    }
  }, [user?.id]);

  // COMMENTS FUNCTIONALITY

  // Open comments for a post
  const openComments = useCallback(async (postId: string) => {
    // Find post in current feed
    const post = feedData.items.find(
      (item): item is UIPost => 'id' in item && item.id === postId
    );

    if (!post) return;

    setSelectedPostId(postId);
    setSelectedComments(post.comments || []);
    setSelectedCommentsCount(post.commentsCount || 0);
    setIsLoadingComments(true);

    // Open comments sheet
    if (commentsSheetRef.current) {
      commentsSheetRef.current.open();
    }

    // Fetch latest comments
    try {
      const comments = await getCommentsByPost(postId);
      if (comments) {
        const formattedComments = comments.map(comment => ({
          id: comment.id,
          username: comment.user.name,
          userAvatar: { uri: comment.user.image },
          text: comment.content,
          timePosted: comment.sent_at,
        }));

        setSelectedComments(formattedComments);
        setSelectedCommentsCount(formattedComments.length);

        // Update comment count if it changed
        if (formattedComments.length !== (post.commentsCount || 0)) {
          updatePostInAllFeeds(postId, (p) => ({
            ...p,
            commentsCount: formattedComments.length,
            comments: formattedComments
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  }, [feedData.items]);

  // Add a comment to a post
  const addComment = useCallback(async (text: string) => {
    if (!text.trim() || !selectedPostId || !user?.id) {
      if (!user?.id) Alert.alert('Sign in required', 'Please sign in to comment');
      return false;
    }

    // Optimistically update UI
    const newComment: PostComment = {
      id: `temp-${Date.now()}`,
      username: user.name || 'You',
      userAvatar: { uri: user.image || '' } as { uri: string },
      text: text,
      timePosted: new Date().toISOString(),
    };

    setSelectedComments(prev => [newComment, ...prev]);
    setSelectedCommentsCount(prev => prev + 1);

    // Update post in all feeds
    updatePostInAllFeeds(selectedPostId, (post) => ({
      ...post,
      commentsCount: (post.commentsCount || 0) + 1,
      comments: [newComment, ...(post.comments || [])]
    }));

    // Persist to database
    try {
      await createComment({
        post_id: selectedPostId,
        user_id: user.id,
        content: text,
      });
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);

      // Revert optimistic updates
      setSelectedComments(prev => prev.filter(c => c.id !== newComment.id));
      setSelectedCommentsCount(prev => prev - 1);

      // Revert feed updates
      updatePostInAllFeeds(selectedPostId, (post) => ({
        ...post,
        commentsCount: Math.max(0, (post.commentsCount || 0) - 1),
        comments: post.comments?.filter(c => c.id !== newComment.id) || []
      }));

      Alert.alert('Error', 'Failed to add comment');
      return false;
    }
  }, [selectedPostId, user?.id, user?.name, user?.image]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (feedData.hasMore && !feedData.isLoadingMore && !feedData.isLoading) {
      fetchFeedData(true);
    }
  }, [feedData.hasMore, feedData.isLoadingMore, feedData.isLoading, fetchFeedData]);

  // Force refresh feed
  const refresh = useCallback(() => {
    fetchFeedData(false);
  }, [fetchFeedData]);

  // Force refresh that ignores any loading state
  const forceRefresh = useCallback(() => {
    fetchFeedData(false, true);
  }, [fetchFeedData]);

  // Public utility functions
  return {
    // Feed data
    feed: feedData.items,
    loading: feedData.isLoading,
    isLoadingMore: feedData.isLoadingMore,
    hasMoreContent: feedData.hasMore,
    error: feedData.error,

    // Like functionality
    likedPosts,
    handleLikePost,

    // Comments functionality
    commentsSheetRef,
    selectedComments,
    selectedCommentsCount,
    isLoadingComments,
    openComments,
    addComment,

    // Feed manipulation
    loadMore,
    refresh,
    forceRefresh, // Add force refresh function

    // Add these two functions with force option
    invalidateFeed: (force = false) => {
      // Reset just the current feed
      updateFeedData(data => ({
        ...data,
        items: feedType === 'home' && includeCarousel ?
          [{ type: 'carousel' }] : [],
        isLoading: true,
        timestamp: 0
      }));

      // Refetch data with force option
      fetchFeedData(false, force);
    },

    // Helper to add a new post (wrapper for the global function)
    addNewPost: addPostToFeeds
  };
}

/**
 * Adds a newly created post to the top of home feed and current user profile feed
 * @param newPost The new post to add to feeds
 */
// In the addPostToFeeds function
export async function addPostToFeeds(newPost: UIPost) {
  if (!newPost || !newPost.id) {
    console.error('Cannot add post to feeds: Invalid post data', newPost);
    return;
  }

  console.log('Adding new post to feeds:', newPost.id);

  try {
    // No need to format again - post is already formatted
    if (!newPost) {
      console.error('Failed to add post: Invalid post data');
      return;
    }

    // Use a setTimeout to avoid potential batch update issues
    setTimeout(() => {
      try {
        // Add to home feed (after carousel if it exists)
        const homeItems = [...globalState.homeFeed.items];
        const carouselIndex = homeItems.findIndex(item => 'type' in item && item.type === 'carousel');

        if (carouselIndex !== -1) {
          // Insert after carousel
          homeItems.splice(carouselIndex + 1, 0, newPost);
        } else {
          // Insert at top
          homeItems.unshift(newPost);
        }

        globalState.homeFeed = {
          ...globalState.homeFeed,
          items: homeItems,
          timestamp: Date.now()
        };

        // Add to current user profile feed
        globalState.currentUserFeed = {
          ...globalState.currentUserFeed,
          items: [newPost, ...globalState.currentUserFeed.items],
          timestamp: Date.now()
        };

        // Batch notifications
        globalState.notifySubscribers('home');
        globalState.notifySubscribers('profile');

        console.log('New post added successfully to feeds');
      } catch (error) {
        console.error('Error in feed update:', error);
      }
    }, 0);

  } catch (error) {
    console.error('Error adding post to feeds:', error);
  }
}

// Update a post in all three feeds
function updatePostInAllFeeds(postId: string, updater: (post: UIPost) => UIPost) {
  const feeds: FeedState[] = [
    globalState.homeFeed,
    globalState.currentUserFeed,
    globalState.otherUserFeed
  ];

  // Keep track of which feeds were updated
  const feedsUpdated = {
    home: false,
    currentUser: false,
    otherUser: false
  };

  // Update each feed
  feeds.forEach((feed, index) => {
    const updatedItems = feed.items.map(item => {
      if ('id' in item && item.id === postId) {
        return updater(item);
      }
      return item;
    });

    // Check if anything changed
    let changed = false;
    updatedItems.forEach((item, i) => {
      const original = feed.items[i];
      if ('id' in item && 'id' in original &&
          item.id === postId &&
          JSON.stringify(item) !== JSON.stringify(original)) {
        changed = true;
      }
    });

    if (changed) {
      if (index === 0) {
        // Home feed
        globalState.homeFeed = {
          ...feed,
          items: updatedItems,
          timestamp: Date.now()
        };
        feedsUpdated.home = true;
      } else if (index === 1) {
        // Current user feed
        globalState.currentUserFeed = {
          ...feed,
          items: updatedItems,
          timestamp: Date.now()
        };
        feedsUpdated.currentUser = true;
      } else if (index === 2) {
        // Other user feed
        globalState.otherUserFeed = {
          ...feed,
          items: updatedItems,
          timestamp: Date.now(),
          userId: globalState.otherUserFeed.userId // Preserve the user ID
        };
        feedsUpdated.otherUser = true;
      }
    }
  });

  // Notify subscribers of changes
  if (feedsUpdated.home) globalState.notifySubscribers('home');
  if (feedsUpdated.currentUser) globalState.notifySubscribers('profile');
  if (feedsUpdated.otherUser) globalState.notifySubscribers('otherProfile');
}

// Invalidate all feed caches
export function invalidateAllFeedCaches() {
  console.log('Invalidating all feed caches...');

  // Reset home feed
  globalState.homeFeed = {
    ...globalState.homeFeed,
    isLoading: true,
    items: [],
    timestamp: 0
  };

  // Reset current user feed
  globalState.currentUserFeed = {
    ...globalState.currentUserFeed,
    isLoading: true,
    items: [],
    timestamp: 0
  };

  // Reset other user feed
  globalState.otherUserFeed = {
    ...globalState.otherUserFeed,
    isLoading: true,
    items: [],
    timestamp: 0
  };

  // Notify all subscribers
  globalState.notifySubscribers('home');
  globalState.notifySubscribers('profile');
  globalState.notifySubscribers('otherProfile');

  console.log('All feed subscribers notified of invalidation');
}

// Debug helper
export function debugFeedCache() {
  console.log('===== FEED CACHE DEBUG =====');

  console.log('HOME FEED:');
  console.log(`  Items: ${globalState.homeFeed.items.length}`);
  console.log(`  Loading: ${globalState.homeFeed.isLoading}`);
  console.log(`  Updated: ${new Date(globalState.homeFeed.timestamp).toLocaleTimeString()}`);

  console.log('CURRENT USER FEED:');
  console.log(`  Items: ${globalState.currentUserFeed.items.length}`);
  console.log(`  Loading: ${globalState.currentUserFeed.isLoading}`);
  console.log(`  Updated: ${new Date(globalState.currentUserFeed.timestamp).toLocaleTimeString()}`);

  console.log('OTHER USER FEED:');
  console.log(`  User ID: ${globalState.otherUserFeed.userId}`);
  console.log(`  Items: ${globalState.otherUserFeed.items.length}`);
  console.log(`  Loading: ${globalState.otherUserFeed.isLoading}`);
  console.log(`  Updated: ${new Date(globalState.otherUserFeed.timestamp).toLocaleTimeString()}`);

  console.log('===========================');
}
