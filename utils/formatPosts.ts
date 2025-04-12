import { getUserById, getInterestById, getCommentsByPost, getAttendeesByPost } from './data';

import { PostsTable, PostType } from './db';

import { format, parseISO } from 'date-fns';

// Define UI post types that match what the components expect
export interface PostComment {
  id: string;
  username: string;
  userAvatar: { uri: string };
  text: string;
  timePosted: string;
}

export interface NotePost {
  id: string;
  postUserId: string;
  interest: string;
  username: string;
  userAvatar: { uri: string };
  timePosted: string;
  title?: string;
  postText?: string;
  postImage?: { uri: string };
  likesCount: number;
  commentsCount: number;
  comments: PostComment[];
  isLiked?: boolean;
  type: 'post';
}

export interface EventPost {
  id: string;
  postUserId: string;
  interest: string;
  username: string;
  userAvatar: { uri: string };
  timePosted: string;
  title: string;
  description?: string;
  postText?: string;
  postImage?: { uri: string };
  image: { uri: string };
  date: string;
  time: string;
  location: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: PostComment[];
  attendeeAvatars: { uri: string }[];
  totalAttendees: number;
  status?: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  type: 'event';
}

export type UIPost = NotePost | EventPost;

/**
 * Helper function to calculate relative time
 * - Shows minutes for less than an hour
 * - Shows hours for less than a day
 * - Shows days up to 30 days
 * - Shows actual date for anything older than 30 days
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0 || isNaN(diffMs)) {
    return 'less than an hour ago';
  }

  const diffSecs = Math.round(diffMs / 1000);

  const diffMins = Math.floor(diffSecs / 60);

  // Rest of function remains the same
  const diffHours = Math.floor(diffMins / 60);

  // Less than a day - show in hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  // Less than 30 days - show in days
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // More than 30 days - show the actual date
  return format(date, 'MMM d, yyyy');
}

/**
 * Determines event status based on date
 */
function determineEventStatus(
  eventDate: string | null | undefined
): 'upcoming' | 'in-progress' | 'completed' | 'cancelled' {
  if (!eventDate) return 'upcoming';

  const now = new Date();
  const eventTime = new Date(eventDate);

  // Simple implementation - can be enhanced
  if (eventTime < now) {
    // Event is in the past
    return 'completed';
  } else if (Math.abs(now.getTime() - eventTime.getTime()) < 24 * 60 * 60 * 1000) {
    // Event is within 24 hours (could be considered "in-progress")
    return 'in-progress';
  }

  return 'upcoming';
}

/**
 * Format event date and time from database format
 */
function formatEventDateTime(eventDate: string | null | undefined): { date: string; time: string } {
  if (!eventDate) {
    return {
      date: 'Date to be announced',
      time: 'Time to be announced',
    };
  }

  try {
    const date = parseISO(eventDate);

    // Format: "June 15, 2025"
    const formattedDate = format(date, 'MMMM d, yyyy');

    // Format: "12:00 PM - 2:00 PM"
    // Note: This is a placeholder as your data might store start and end times separately
    const formattedTime = format(date, 'h:mm a');

    return {
      date: formattedDate,
      time: formattedTime,
    };
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return {
      date: 'Invalid date',
      time: 'Invalid time',
    };
  }
}

/**
 * Formats a database post into a UI-ready post
 * @param post The raw post from Supabase
 * @param includeComments Whether to fetch and include comments
 * @returns Promise with the formatted post ready for UI
 */
export async function formatPostForUI(
  post: PostsTable,
  includeComments: boolean = true
): Promise<UIPost> {
  try {
    // Get post author details
    const postAuthor = await getUserById(post.user_id);

    // Get interest details
    const interest = post.interest_id ? await getInterestById(post.interest_id) : null;

    // Get comments if requested
    let commentsData: PostComment[] = [];
    let commentsCount = 0;

    if (includeComments) {
      const comments = await getCommentsByPost(post.id);
      commentsCount = comments.length;

      commentsData = comments.map((comment) => ({
        id: comment.id,
        username: comment.user?.name || 'Unknown User',
        userAvatar: {
          uri: comment.user?.image || 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        text: comment.content,
        timePosted: getTimeAgo(new Date(comment.sent_at)),
      }));
    }

    // Calculate time ago
    const timePosted = getTimeAgo(new Date(post.created_at));

    if (post.post_type === 'event') {
      // For event posts - match EventCard requirements
      const attendees = await getAttendeesByPost(post.id);

      // Format the event date and time from the event_date field
      const { date, time } = formatEventDateTime(post.event_date);

      const eventPost: EventPost = {
        id: post.id,
        postUserId: post.user_id,
        interest: interest?.name || 'General',
        username: postAuthor?.name || 'Unknown User',
        userAvatar: {
          uri: postAuthor?.image || 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        timePosted,
        title: post.title || 'Untitled Event',
        description: post.description,
        postText: post.description, // For backward compatibility
        // Make sure image is provided for both properties
        image: {
          uri:
            post.image ||
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=3269&auto=format&fit=crop',
        },
        postImage: post.image ? { uri: post.image } : undefined,
        date,
        time,
        location: post.location || 'Location TBA',
        likesCount: 0, // You'll need to implement likes functionality
        commentsCount,
        comments: commentsData,
        attendeeAvatars: attendees.slice(0, 10).map((a) => ({
          uri: a.image || 'https://randomuser.me/api/portraits/women/44.jpg',
        })),
        totalAttendees: attendees.length,
        status: determineEventStatus(post.event_date),
        type: 'event',
      };

      return eventPost;
    } else {
      // For regular posts (notes) - match PostCard requirements
      const notePost: NotePost = {
        id: post.id,
        postUserId: post.user_id,
        interest: interest?.name || 'General',
        username: postAuthor?.name || 'Unknown User',
        userAvatar: {
          uri: postAuthor?.image || 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        timePosted,
        title: post.title || undefined,
        postText: post.description || undefined,
        postImage: post.image ? { uri: post.image } : undefined,
        likesCount: 0, // You'll need to implement likes functionality
        commentsCount,
        comments: commentsData,
        type: 'post',
      };

      return notePost;
    }
  } catch (error) {
    console.error(`Error formatting post ${post.id}:`, error);
    throw new Error(`Failed to format post: ${error}`);
  }
}

/**
 * Batch formats multiple posts for UI display
 * @param posts Array of posts from Supabase
 * @param includeComments Whether to fetch and include comments
 * @returns Promise with array of formatted posts
 */
export async function formatPostsForUI(
  posts: PostsTable[],
  includeComments: boolean = true
): Promise<UIPost[]> {
  try {
    const formattedPostsPromises = posts.map((post) => formatPostForUI(post, includeComments));

    const formattedPosts = await Promise.all(formattedPostsPromises);

    return formattedPosts.sort((a, b) => {
      // Sort by newest posts first (based on timePosted)
      return b.timePosted.localeCompare(a.timePosted);
    });
  } catch (error) {
    console.error('Error formatting posts batch:', error);
    throw new Error(`Failed to format posts batch: ${error}`);
  }
}
