/**
 * FEED MANAGEMENT HOOK
 *
 * This file provides the useFeed hook, a comprehensive solution for managing content feeds
 * in Rippl. It handles fetching, caching, pagination, and interactions with posts across
 * the application.
 *
 * KEY FEATURES:
 * - Smart caching: Maintains separate caches for different feed types
 * - Intelligent data loading: Only loads feed data when user data (including interests) is available
 * - Pagination support: Handles "load more" with proper deduplication
 * - Post interactions: Like/unlike with optimistic UI updates
 * - Comments functionality: View and add comments with real-time UI updates
 * - Cross-feed state management: Updates post status across different feed instances
 *
 * FEED TYPES:
 * - 'home': Main feed with personalized content from interests, friends, and recommendations
 * - 'profile': User-specific feed showing only posts from a particular user
 *
 * USAGE:
 * ```tsx
 * const {
 *   feed,                  // Array of feed items (posts, events, carousel)
 *   loading,               // Boolean indicating initial load state
 *   isLoadingMore,         // Boolean indicating "load more" operation in progress
 *   hasMoreContent,        // Boolean indicating if more content is available
 *   error,                 // Error message if feed load failed
 *   handleLikePost,        // Function to handle post liking
 *   commentsSheetRef,      // Ref to control comments bottom sheet
 *   openComments,          // Function to open comments for a post
 *   addComment,            // Function to add a comment to current post
 *   loadMore,              // Function to load more items when scrolling
 *   refresh,               // Function to refresh current feed
 *   invalidateCache        // Function to invalidate cache and force fresh data
 * } = useFeed(
 *   'home',                // Feed type: 'home' or 'profile'
 *   userId,                // User ID of current authenticated user
 *   {                      // Optional config object
 *     includeCarousel,     // Include events carousel in feed
 *     postsPerPage,        // Number of posts to fetch per page
 *     maxAgeDays,          // Max age of posts in days
 *     profileUserId        // User ID for profile feed (if different from auth user)
 *   }
 * );
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { PostsTable } from '~/utils/db';
import { useUser } from './useUser';
import { CommentsBottomSheetRef } from '../components/CommentsBottomSheet';

export type FeedItem = UIPost | { type: 'carousel' };
export type FeedType = 'home' | 'profile';

// Define cache structure for each feed type
interface FeedCache {
  home: Map<string, FeedState>; // key is authUserId
  profile: Map<string, FeedState>; // key is profileUserId-authUserId
}

interface FeedState {
  items: FeedItem[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  timestamp: number;
}

// Create persistent cache between renders
const CACHE: FeedCache = {
  home: new Map(),
  profile: new Map()
};

const feedSubscribers = new Set<() => void>();

// Function to notify subscribers of cache changes
function notifyFeedSubscribers() {
  feedSubscribers.forEach(callback => callback());
}

// Shared liked posts cache across components
const LIKED_POSTS = new Set<string>();

// Comments related state stored globally
interface CommentsState {
  postId: string;
  comments: PostComment[];
  count: number;
}

let ACTIVE_COMMENTS: CommentsState = {
  postId: '',
  comments: [],
  count: 0
};

interface UseFeedOptions {
  includeCarousel?: boolean;
  postsPerPage?: number;
  maxAgeDays?: number;
  profileUserId?: string; // For profile feed
}

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

  // Create a unique cache key based on feed type and user IDs
  const cacheKey = useMemo(() => {
    if (feedType === 'home') return authUserId || 'anonymous';
    if (feedType === 'profile') {
      const targetProfileId = profileUserId || authUserId;
      return `${targetProfileId}-${authUserId || 'anonymous'}`;
    }
    return 'default';
  }, [feedType, authUserId, profileUserId]);

  // Initialize state from cache or create new
  const [state, setState] = useState<FeedState>(() => {
    const cachedState = CACHE[feedType].get(cacheKey);
    if (cachedState) return cachedState;

    return {
      items: [],
      page: 1,
      hasMore: true,
      isLoading: true,
      isLoadingMore: false,
      error: null,
      timestamp: 0
    };
  });

  // For accessing user data (interests, friends)
  const { user, getInterestIds, getFriendIds } = useUser(authUserId);

  // Add this ref to track when user data is first loaded
  const userDataLoadedRef = useRef(false);

  // Track liked posts with state that references the global cache
  const [likedPosts, setLikedPosts] = useState<Set<string>>(LIKED_POSTS);

  // Comments related state
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>(ACTIVE_COMMENTS.comments);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState<number>(ACTIVE_COMMENTS.count);
  const [selectedPostId, setSelectedPostId] = useState<string>(ACTIVE_COMMENTS.postId);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Update the cache whenever our state changes
  useEffect(() => {
    CACHE[feedType].set(cacheKey, state);
  }, [feedType, cacheKey, state]);

  // Load user's liked posts if not already loaded
  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!authUserId || LIKED_POSTS.size > 0) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_post_engagement')
          .select('post_id')
          .eq('user_id', authUserId)
          .eq('has_liked', true);

        if (error) throw error;

        data.forEach(item => LIKED_POSTS.add(item.post_id));
        setLikedPosts(new Set(LIKED_POSTS));
      } catch (error) {
        console.error('Error loading liked posts:', error);
      }
    };

    if (authUserId) {
      loadLikedPosts();
    }
  }, [authUserId]);

  // Main function to fetch feed data
  const fetchFeedData = useCallback(async (loadMore = false) => {
    if (!authUserId && feedType === 'home') {
      return;
    }

    // Check if we have user data with interests
    if (feedType === 'home' && (!user?.id || getInterestIds().length === 0)) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: !loadMore,
      isLoadingMore: loadMore,
      error: null
    }));

    try {
      const currentPage = loadMore ? state.page + 1 : 1;
      let posts: PostsTable[] = [];

      if (feedType === 'home') {
        // HOME FEED LOGIC
        if (user?.id) {
          // 1. Get recommended posts
          const recommendedPosts = await getRecommendedPostsForUser(user.id, postsPerPage / 2);
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
        // PROFILE FEED LOGIC
        const targetUserId = profileUserId || authUserId;
        if (targetUserId) {
          posts = await getPostsByUserId(targetUserId, {
            limit: postsPerPage,
            page: currentPage
          });
        }
      }

      // Remove duplicates
      const uniquePosts = Array.from(
        new Map(posts.map(post => [post.id, post])).values()
      );

      if (uniquePosts.length > 0) {
        // Format posts for UI
        const formattedPosts = await formatPostsForUI(uniquePosts);

        // Add like status from our cache
        const enhancedPosts = formattedPosts.map(post => {
          const isLiked = LIKED_POSTS.has(post.id);
          return {
            ...post,
            isLiked
          };
        });

        setState(prev => {
          if (loadMore) {
            // For pagination: filter out posts we already have
            const existingIds = new Set(
              prev.items
                .filter((item): item is UIPost => 'id' in item)
                .map(item => item.id)
            );

            const newPosts = enhancedPosts.filter(post => !existingIds.has(post.id));

            return {
              ...prev,
              items: [...prev.items, ...newPosts],
              page: currentPage,
              hasMore: newPosts.length >= postsPerPage / 2,
              isLoading: false,
              isLoadingMore: false,
              timestamp: Date.now()
            };
          } else {
            // First page load
            const newItems: FeedItem[] = [];
            if (includeCarousel) {
              newItems.push({ type: 'carousel' });
            }

            return {
              ...prev,
              items: [...newItems, ...enhancedPosts],
              page: 1,
              hasMore: enhancedPosts.length >= postsPerPage,
              isLoading: false,
              isLoadingMore: false,
              timestamp: Date.now()
            };
          }
        });
      } else {
        // No posts found
        setState(prev => ({
          ...prev,
          items: !loadMore && includeCarousel ? [{ type: 'carousel' }] : [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load feed',
        isLoading: false,
        isLoadingMore: false
      }));
    }
  }, [
    feedType,
    authUserId,
    profileUserId,
    state.page,
    user?.id,
    includeCarousel,
    postsPerPage,
    maxAgeDays,
    getInterestIds,
    getFriendIds
  ]);

  // Load feed data when user data is fully loaded
  useEffect(() => {
    // Track if user data is available and has interests
    const userDataAvailable = !!user && !!user.id && !user.isLoading;
    const hasInterests = getInterestIds().length > 0;

    // For profile feed, we don't need interests
    const dataComplete = feedType === 'profile' ? userDataAvailable : (userDataAvailable && hasInterests);

    if (dataComplete && !userDataLoadedRef.current) {
      userDataLoadedRef.current = true;

      // Get cache state
      const cachedState = CACHE[feedType].get(cacheKey);
      const isCacheStale = !cachedState ||
                          Date.now() - cachedState.timestamp > 5 * 60 * 1000 ||
                          cachedState.items.length === 0;

      if (isCacheStale) {
        fetchFeedData(false);
      }
    }

    // Reset ref when user changes
    if (!user?.id) {
      userDataLoadedRef.current = false;
    }
  }, [user, getInterestIds, feedType, cacheKey, fetchFeedData]);

  useEffect(() => {
  // Create a random ID for this component instance
  const componentId = Math.random().toString(36).substring(2, 15);

  // Subscribe to feed updates
  const subscribeToFeedUpdates = () => {
    // Look up fresh state from the cache
    const cachedState = CACHE[feedType].get(cacheKey);
    if (cachedState) {
      setState(cachedState);
    }
  };

  // Add our subscriber
  feedSubscribers.add(subscribeToFeedUpdates);

  // Cleanup when unmounting
  return () => {
    feedSubscribers.delete(subscribeToFeedUpdates);
  };
}, [feedType, cacheKey]);

// LIKE FUNCTIONALITY
// Handle like status changes - updates all feeds with the post
const handleLikePost = useCallback(async (postId: string) => {
  if (!user?.id) {
    Alert.alert('Sign in required', 'Please sign in to like posts');
    return;
  }

  // Check if already liked
  const isCurrentlyLiked = LIKED_POSTS.has(postId);
  const newIsLiked = !isCurrentlyLiked;

  // Optimistically update UI across all feeds
  if (newIsLiked) {
    LIKED_POSTS.add(postId);
  } else {
    LIKED_POSTS.delete(postId);
  }
  setLikedPosts(new Set(LIKED_POSTS));

  // Update post across all feeds using our helper function
  updatePostAcrossFeeds(postId, (post) => ({
    ...post,
    isLiked: newIsLiked,
    likesCount: newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
  }));

  // Call API to persist change
  try {
    if (newIsLiked) {
      await likePost(user.id, postId);
    } else {
      await unlikePost(user.id, postId);
    }
  } catch (error) {
    console.error('Error updating like status:', error);

    // Revert UI changes on error
    if (isCurrentlyLiked) {
      LIKED_POSTS.add(postId);
    } else {
      LIKED_POSTS.delete(postId);
    }
    setLikedPosts(new Set(LIKED_POSTS));

    // Revert changes across all feeds
    updatePostAcrossFeeds(postId, (post) => ({
      ...post,
      isLiked: isCurrentlyLiked,
      likesCount: isCurrentlyLiked ? post.likesCount : post.likesCount - 1
    }));

    Alert.alert('Error', 'Failed to update like status. Please try again.');
  }
}, [user?.id]);

  // COMMENTS FUNCTIONALITY
  // Open comments for a post
  const openComments = useCallback(async (postId: string) => {
    // Find the post in this feed
    const post = state.items.find(
      (item): item is UIPost => 'id' in item && item.id === postId
    );

    if (!post) return;

    // Update the global active comments
    ACTIVE_COMMENTS = {
      postId,
      comments: post.comments || [],
      count: post.commentsCount || 0
    };

    // Update local state
    setSelectedPostId(postId);
    setSelectedComments(post.comments || []);
    setSelectedCommentsCount(post.commentsCount || 0);

    // Try to load the latest comments from the server
    setIsLoadingComments(true);
    try {
      const latestComments = await getCommentsByPost(postId);
      if (latestComments) {
        ACTIVE_COMMENTS.comments = latestComments.map(comment => ({
          id: comment.id,
          username: comment.user.name,
          userAvatar: { uri: comment.user.image },
          text: comment.content,
          timePosted: comment.sent_at,
        }));
        ACTIVE_COMMENTS.count = latestComments.length;
        setSelectedComments(latestComments.map(comment => ({
          id: comment.id,
          username: comment.user.name,
          userAvatar: { uri: comment.user.image },
          text: comment.content,
          timePosted: comment.sent_at,
        })));
        setSelectedCommentsCount(latestComments.length);

        // Update all feeds with the latest comment count
        updateCommentCountInFeeds(postId, latestComments.length - (post.commentsCount || 0));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }

    // Open the comments sheet
    commentsSheetRef.current?.open();
  }, [state.items]);

  // Add a comment to a post
  const addComment = useCallback(async (text: string) => {
    if (!text.trim() || !selectedPostId || !user?.id) {
      if (!user?.id) Alert.alert('Sign in required', 'Please sign in to comment');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newComment: PostComment = {
      id: tempId,
      username: user.name || 'User',
      userAvatar: { uri: user.image || '' },
      text,
      timePosted: 'Just now',
    };

    // Optimistically update UI
    setSelectedComments(prev => [...prev, newComment]);
    setSelectedCommentsCount(prev => prev + 1);

    // Update the global state
    ACTIVE_COMMENTS.comments = [...ACTIVE_COMMENTS.comments, newComment];
    ACTIVE_COMMENTS.count++;

    // Update comment count across all feeds
    updateCommentCountInFeeds(selectedPostId, 1);

    try {
      // Persist to database
      await createComment({
        post_id: selectedPostId,
        user_id: user.id,
        content: text,
      });
    } catch (error) {
      console.error('Error adding comment:', error);

      // Revert optimistic update on error
      setSelectedComments(prev => prev.filter(c => c.id !== tempId));
      setSelectedCommentsCount(prev => prev - 1);

      ACTIVE_COMMENTS.comments = ACTIVE_COMMENTS.comments.filter(c => c.id !== tempId);
      ACTIVE_COMMENTS.count--;

      // Revert the comment count update
      updateCommentCountInFeeds(selectedPostId, -1);

      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  }, [selectedPostId, user]);

    // Helper to update comment count across all feeds
    const updateCommentCountInFeeds = useCallback((postId: string, increment: number) => {
      // Use our helper function to update all feeds
      updatePostAcrossFeeds(postId, (post) => ({
        ...post,
        commentsCount: Math.max(0, (post.commentsCount || 0) + increment)
      }));
    }, []);

  // Load more posts for pagination
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoadingMore && !state.isLoading) {
      fetchFeedData(true);
    }
  }, [state.hasMore, state.isLoadingMore, state.isLoading, fetchFeedData]);

  // Force refresh feed data
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchFeedData(false);
  }, [fetchFeedData]);

  // Invalidate cache and force refresh
  const invalidateCache = useCallback(() => {
    // Remove this specific feed from cache
    CACHE[feedType].delete(cacheKey);

    // Reset state to initial values
    setState({
      items: [],
      page: 1,
      hasMore: true,
      isLoading: true,
      isLoadingMore: false,
      error: null,
      timestamp: 0
    });

    // Reset user data loaded flag so we recheck
    userDataLoadedRef.current = false;

    // Fetch fresh data
    fetchFeedData(false);
  }, [feedType, cacheKey, fetchFeedData]);

  // Return what components need
  return {
    feed: state.items,
    loading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasMoreContent: state.hasMore,
    error: state.error,

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
    invalidateCache,

    // Cross-feed update helpers
    updatePostAcrossFeeds,
    replacePostAcrossFeeds,
    invalidateAllFeedCaches
  };
}

// Helper functions
// Helper to update a post in all feed caches
export function updatePostAcrossFeeds(postId: string, updater: (post: UIPost) => UIPost) {
  let cacheUpdated = false;

  // Update the post in all feed caches
  Object.keys(CACHE).forEach(type => {
    CACHE[type as FeedType].forEach((feedState, key) => {
      const updatedItems = feedState.items.map(item => {
        if ('id' in item && item.id === postId) {
          return updater(item);
        }
        return item;
      });

      // Check if a post was actually modified
      const postWasUpdated = updatedItems.some((item, index) => {
        const originalItem = feedState.items[index];
        return 'id' in item && 'id' in originalItem &&
               item.id === originalItem.id &&
               JSON.stringify(item) !== JSON.stringify(originalItem);
      });

      if (postWasUpdated) {
        CACHE[type as FeedType].set(key, {
          ...feedState,
          items: updatedItems,
          timestamp: Date.now() // Update timestamp to indicate change
        });
        cacheUpdated = true;
      }
    });
  });

  // Notify subscribers if cache was updated
  if (cacheUpdated) {
    notifyFeedSubscribers();
  }
}

// Helper to replace a post in all feed caches
export function replacePostAcrossFeeds(updatedPost: UIPost) {
  updatePostAcrossFeeds(updatedPost.id, (existingPost) => {
    // Preserve like status from existing post
    return {
      ...updatedPost,
      isLiked: existingPost.isLiked
    };
  });
}

// Helper to invalidate all feed caches
export function invalidateAllFeedCaches() {
  Object.keys(CACHE).forEach(type => {
    CACHE[type as FeedType].clear();
  });

  // Always notify subscribers when clearing all caches
  notifyFeedSubscribers();
}

/**
 * Add a new post to the top of all relevant feeds
 * @param post The formatted UI post to add
 * @param feedTypes Array of feed types to add the post to (defaults to all feeds)
 */
export function addPostToFeeds(post: UIPost, feedTypes: FeedType[] = ['home', 'profile']) {
  let cacheUpdated = false;

  // For each specified feed type
  feedTypes.forEach(feedType => {
    // For each cache entry of this feed type
    CACHE[feedType].forEach((feedState, cacheKey) => {
      // For profile feeds, only add to the relevant profile
      if (feedType === 'profile') {
        // Extract the profile user ID from the cache key
        const profileUserId = cacheKey.split('-')[0];

        // Only add to this profile if it matches the post's user
        if (profileUserId !== post.postUserId) {
          return;
        }
      }

      // Check if the post already exists in this feed
      const postExists = feedState.items.some(item =>
        'id' in item && item.id === post.id
      );

      if (!postExists) {
        // Create a new array with the post at the beginning (after any special items like carousel)
        const newItems = [...feedState.items];

        // Find the index to insert - after carousel if it exists
        const insertIndex = newItems.findIndex(item =>
          !('type' in item) || item.type !== 'carousel'
        );

        // Add the post at the appropriate position
        if (insertIndex >= 0) {
          newItems.splice(insertIndex, 0, post);
        } else {
          newItems.unshift(post);
        }

        // Update the cache with the new array
        CACHE[feedType].set(cacheKey, {
          ...feedState,
          items: newItems,
          timestamp: Date.now()
        });
        cacheUpdated = true;
      }
    });
  });

  // Notify subscribers if cache was updated
  if (cacheUpdated) {
    notifyFeedSubscribers();
  }
}

// Add this function for debugging
export function debugFeedCache() {
  console.log('===== FEED CACHE DEBUG =====');
  console.log(`Subscribers: ${feedSubscribers.size}`);

  Object.keys(CACHE).forEach(type => {
    console.log(`FEED TYPE: ${type}`);
    CACHE[type as FeedType].forEach((state, key) => {
      console.log(`  Key: ${key}`);
      console.log(`  Items: ${state.items.length}`);
      console.log(`  Updated: ${new Date(state.timestamp).toLocaleTimeString()}`);

      // Log the first few items
      state.items.slice(0, 2).forEach((item, idx) => {
        if ('id' in item) {
          console.log(`    ${idx}: Post ${item.id.substring(0, 5)}... | Liked: ${item.isLiked} | Comments: ${item.commentsCount || 0}`);
        } else {
          console.log(`    ${idx}: ${item.type}`);
        }
      });
    });
  });
  console.log('===========================');
}
