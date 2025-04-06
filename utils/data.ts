import { supabase } from './supabase';

// Data Types
import { PostType, Status } from './db';
import { UsersTable } from './db';
import { PostsTable } from './db';
import { MessagesTable } from './db';
import { ChatsTable } from './db';
import { InterestsTable } from './db';
import { InterestCategoriesTable } from './db';
import { UserInterestsTable } from './db';
import { FriendshipsTable } from './db';
import { UserMatchesTable } from './db';
import { PostInterestsTable } from './db';
import { AttendeesTable } from './db';
import { CommentsTable } from './db';

/* ------ USERS CRUD ------ */

// CREATE
/**
 * Creates a new user in the database
 * @param userData User data to insert (excluding id and created_at)
 * @returns Promise with the created user data
 */
export const createUser = async (
  userData: Omit<UsersTable, 'id' | 'created_at'>
): Promise<UsersTable> => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        image: userData.image,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as UsersTable;
};

// READ
/**
 * Fetches all users from the database
 * @returns Promise with array of users or error
 */
export const getAllUsers = async (): Promise<UsersTable[]> => {
  const { data, error } = await supabase.from('users').select('*');

  if (error) throw error;
  return data as UsersTable[];
};

/**
 * Fetches a single user by ID
 * @param userId The UUID of the user to fetch
 * @returns Promise with user data or null if not found
 */
export const getUserById = async (userId: string): Promise<UsersTable | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    // If the error is because no rows were returned
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as UsersTable;
};

// UPDATE
/**
 * Updates a user in the database
 * @param userData User data to insert (excluding id and created_at)
 * @returns Promise with the created user data
 */
export const updateUser = async (
  userData: Omit<UsersTable, 'id' | 'created_at'>
): Promise<UsersTable> => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        image: userData.image,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as UsersTable;
};

// DELETE
/**
 * Deletes a user from the database
 * @param userId The ID of the user to delete
 * @returns Promise with the deleted user data or null
 */
export const deleteUser = async (userId: string): Promise<UsersTable | null> => {
  const { data, error } = await supabase.from('users').delete().eq('id', userId).select().single();

  if (error) {
    // If the error is because no rows were found
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as UsersTable;
};

/* ------ POSTS CRUD ------ */

// CREATE
/**
 * Creates a new post in the database
 * @param postData The post data to insert (id and created_at will be generated automatically)
 * @returns Promise with the created post data
 */
export const createPost = async (
  postData: Omit<PostsTable, 'id' | 'created_at'>
): Promise<PostsTable> => {
  const { data, error } = await supabase.from('posts').insert([postData]).select().single();

  if (error) throw error;
  return data as PostsTable;
};

// READ
/**
 * Fetches all posts from the database
 * @returns Promise with array of posts
 */
export const getAllPosts = async (): Promise<PostsTable[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false }); // Latest posts first

  if (error) throw error;
  return data as PostsTable[];
};

/**
 * Fetches all posts created by a specific user
 * @param userId The ID of the user whose posts to fetch
 * @returns Promise with array of the user's posts
 */
export const getPostsByUserId = async (userId: string): Promise<PostsTable[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }); // Latest posts first

  if (error) throw error;
  return data as PostsTable[];
};

/**
 * Fetches all posts by a specific Interest
 * @param interestId The ID of the Interest whose posts to fetch
 * @returns Promise with array of the posts with that interest
 */
export const getPostsByInterestId = async (interestId: string): Promise<PostsTable[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('interest_id', interestId)
    .order('created_at', { ascending: false }); // Latest posts first

  if (error) throw error;
  return data as PostsTable[];
};

// UPDATE
/**
 * Updates a post in the database
 * @param postId The ID of the post to update
 * @param postData The fields to update
 * @returns Promise with the updated post data
 */
export const updatePost = async (
  postId: string,
  postData: Partial<Omit<PostsTable, 'id' | 'created_at' | 'user_id'>>
): Promise<PostsTable> => {
  const { data, error } = await supabase
    .from('posts')
    .update(postData)
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as PostsTable;
};

// DELETE
/**
 * Deletes a post from the database
 * @param postId The ID of the post to delete
 * @returns Promise with the deleted post data or null if not found
 */
export const deletePost = async (postId: string): Promise<PostsTable | null> => {
  const { data, error } = await supabase.from('posts').delete().eq('id', postId).select().single();

  if (error) {
    // If the error is because no rows were found
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as PostsTable;
};

/* ------ MESSAGES, CHAT + CHAT PARTICIPANTS CRUD ------ */

// CREATE
/**
 * Creates a new chat
 * @returns Promise with the created chat data
 */
export const createChat = async (): Promise<ChatsTable> => {
  const { data, error } = await supabase.from('chats').insert([{}]).select().single();

  if (error) throw error;
  return data as ChatsTable;
};

/**
 * Adds a user to a chat
 * @param chatId The ID of the chat
 * @param userId The ID of the user to add
 */
export const addUserToChat = async (chatId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_participants')
    .insert([{ chat_id: chatId, user_id: userId }]);

  if (error) throw error;
};

/**
 * Sends a new message in a specific chat
 * @param chatId The ID of the chat
 * @param userId The ID of the sender
 * @param content The message content
 * @returns Promise with the created message
 */
export const sendMessage = async (
  chatId: string,
  userId: string,
  content: string
): Promise<MessagesTable> => {
  const message = {
    chat_id: chatId,
    user_id: userId,
    content: content,
    read_status: false,
  };

  const { data, error } = await supabase.from('messages').insert([message]).select().single();

  if (error) throw error;

  // Update the chat's updated_at timestamp
  await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

  return data as MessagesTable;
};

// READ
/**
 * Gets a specific chat by ID
 * @param chatId The ID of the chat to fetch
 * @returns Promise with the chat data or null if not found
 */
export const getChatById = async (chatId: string): Promise<ChatsTable | null> => {
  const { data, error } = await supabase.from('chats').select('*').eq('id', chatId).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as ChatsTable;
};

/**
 * Gets all messages in a specific chat
 * @param chatId The ID of the chat
 * @returns Promise with an array of messages in chronological order
 */
export const getChatMessages = async (chatId: string): Promise<MessagesTable[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('sent_at', { ascending: true });

  if (error) throw error;
  return data as MessagesTable[];
};

/**
 * Gets all chats a user participates in
 * @param userId The ID of the user
 * @returns Promise with an array of the user's chats
 */
export const getUserChats = async (userId: string): Promise<ChatsTable[]> => {
  // First get all chat IDs for this user
  const { data: participations, error: participationsError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);

  if (participationsError) throw participationsError;
  if (!participations.length) return [];

  // Then get the actual chat data
  const chatIds = participations.map((p) => p.chat_id);
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select('*')
    .in('id', chatIds);

  if (chatsError) throw chatsError;

  return chats as ChatsTable[];
};

// UPDATE
/**
 * Marks a message as read
 * @param messageId The ID of the message to mark as read
 * @returns Promise with the updated message
 */
export const markMessageAsRead = async (messageId: string): Promise<MessagesTable> => {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_status: true })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data as MessagesTable;
};

// DELETE
/**
 * Deletes a specific message
 * @param messageId The ID of the message to delete
 * @returns Promise with the deleted message or null if not found
 */
export const deleteMessage = async (messageId: string): Promise<MessagesTable | null> => {
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as MessagesTable;
};

/**
 * Deletes a chat and all its messages
 * @param chatId The ID of the chat to delete
 * @returns Promise with the deleted chat or null if not found
 */
export const deleteChat = async (chatId: string): Promise<ChatsTable | null> => {
  const chat = await getChatById(chatId);
  if (!chat) return null;
  const { error } = await supabase.from('chats').delete().eq('id', chatId);

  if (error) throw error;
  return chat;
};

/**
 * Removes a user from a chat
 * @param chatId The ID of the chat
 * @param userId The ID of the user to remove
 */
export const removeUserFromChat = async (chatId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) throw error;
};

/* ------ POST INTERESTS CRUD ------ */

// CREATE
/**
 * Associates an interest with a post
 * @param postInterest The post interest data to create
 * @returns Promise with the created post interest
 */
export const createPostInterest = async (
  postInterest: PostInterestsTable
): Promise<PostInterestsTable> => {
  const { error } = await supabase.from('event_interests').insert(postInterest);
  if (error) throw error;

  return postInterest;
};

// READ
/**
 * Gets all posts with a specific interest
 * @param interestId The ID of the interest
 * @returns Promise with an array of post interests with post details
 */
export const getPostsByInterest = async (
  interestId: string
): Promise<(PostInterestsTable & PostsTable)[]> => {
  const { data, error } = await supabase
    .from('post_interests')
    .select('*, posts(*)')
    .eq('interest_id', interestId)
    .eq('posts.post_type', PostType);

  if (error) throw error;
  return data.map((item) => ({
    ...item,
    ...item.posts,
  }));
};

// DELETE
/**
 * Removes an interest from a post
 * @param eventId The ID of the post
 * @param interestId The ID of the interest
 * @returns Promise with the deleted post interest or null if not found
 */
export const deletePostInterest = async (
  postId: string,
  interestId: string
): Promise<PostInterestsTable | null> => {
  const { data, error: selectError } = await supabase
    .from('post_interests')
    .select('*')
    .eq('event_id', postId)
    .eq('interest_id', interestId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!data) return null;

  const { error } = await supabase
    .from('event_interests')
    .delete()
    .eq('event_id', postId)
    .eq('interest_id', interestId);

  if (error) throw error;
  return data;
};

/* ------ INTERESTS + INTEREST CATEGORIES CRUD ------ */

// CREATE
/**
 * Creates a new interest
 * @param interest The interest data to create
 * @returns Promise with the created interest
 */
export const createInterest = async (
  interest: Omit<InterestsTable, 'id'>
): Promise<InterestsTable> => {
  const id = crypto.randomUUID();
  const newInterest: InterestsTable = {
    id,
    name: interest.name,
    category_id: interest.category_id,
  };

  const { error } = await supabase.from('interests').insert(newInterest);
  if (error) throw error;

  return newInterest;
};

/**
 * Creates a new interest category
 * @param category The category data to create
 * @returns Promise with the created category
 */
export const createInterestCategory = async (
  category: Omit<InterestCategoriesTable, 'id'>
): Promise<InterestCategoriesTable> => {
  const id = crypto.randomUUID();
  const newCategory: InterestCategoriesTable = {
    id,
    name: category.name,
  };

  const { error } = await supabase.from('interest_categories').insert(newCategory);
  if (error) throw error;

  return newCategory;
};

// READ
/**
 * Gets all interests
 * @returns Promise with an array of all interests
 */
export const getAllInterests = async (): Promise<InterestsTable[]> => {
  const { data, error } = await supabase.from('interests').select('*');

  if (error) throw error;
  return data;
};

/**
 * Gets interests by category
 * @param categoryId The category ID to filter by
 * @returns Promise with an array of interests in the category
 */
export const getInterestsByCategory = async (categoryId: string): Promise<InterestsTable[]> => {
  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .eq('category_id', categoryId);

  if (error) throw error;
  return data;
};

/**
 * Gets an interest by ID
 * @param id The ID of the interest to retrieve
 * @returns Promise with the interest or null if not found
 */
export const getInterestById = async (id: string): Promise<InterestsTable | null> => {
  const { data, error } = await supabase.from('interests').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }

  return data;
};

/**
 * Gets an interest category by ID
 * @param id The ID of the interest category to retrieve
 * @returns Promise with the interest category or null if not found
 */
export const getInterestCategoryById = async (
  id: string
): Promise<InterestCategoriesTable | null> => {
  const { data, error } = await supabase
    .from('interest_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }

  return data;
};

/**
 * Gets all interest categories
 * @returns Promise with an array of all interest categories
 */
export const getAllInterestCategories = async (): Promise<InterestCategoriesTable[]> => {
  const { data, error } = await supabase.from('interest_categories').select('*');

  if (error) throw error;
  return data;
};

// DELETE
/**
 * Deletes an interest
 * @param id The ID of the interest to delete
 * @returns Promise with the deleted interest or null if not found
 */
export const deleteInterest = async (id: string): Promise<InterestsTable | null> => {
  const interest = await getInterestById(id);
  if (!interest) return null;

  const { error } = await supabase.from('interests').delete().eq('id', id);

  if (error) throw error;
  return interest;
};

/* ------ USER INTERESTS CRUD ------ */

// CREATE
/**
 * Creates a user interest connection
 * @param userInterest The user interest data to create
 * @returns Promise with the created user interest
 */
export const createUserInterest = async (
  userInterest: UserInterestsTable
): Promise<UserInterestsTable> => {
  const { error } = await supabase.from('user_interests').insert(userInterest);
  if (error) throw error;

  return userInterest;
};

// READ
/**
 * Gets all interests for a specific user
 * @param userId The ID of the user
 * @returns Promise with an array of user interests with interest details
 */
export const getUserInterests = async (userId: string): Promise<any[]> => {
  console.log(`Fetching interests for user ID: ${userId}`);

  const { data, error } = await supabase
    .from('user_interests')
    .select(`
      *,
      interests (
        id,
        name,
        category_id
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  console.log('Raw result:', JSON.stringify(data));
  return data || [];
};

/**
 * Gets all users with a specific interest
 * @param interestId The ID of the interest
 * @returns Promise with an array of user interests with user details
 */
export const getUsersByInterest = async (
  interestId: string
): Promise<(UserInterestsTable & UsersTable)[]> => {
  const { data, error } = await supabase
    .from('user_interests')
    .select('*, users(*)')
    .eq('interest_id', interestId);

  if (error) throw error;
  return data.map((item) => ({
    ...item,
    ...item.users,
  }));
};

/**
 * Checks if a user has a specific interest
 * @param userId The ID of the user
 * @param interestId The ID of the interest
 * @returns Promise with a boolean indicating if the user has the interest
 */
export const userHasInterest = async (userId: string, interestId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

// DELETE
/**
 * Deletes a user interest connection
 * @param userId The ID of the user
 * @param interestId The ID of the interest
 * @returns Promise with the deleted user interest or null if not found
 */
export const deleteUserInterest = async (
  userId: string,
  interestId: string
): Promise<UserInterestsTable | null> => {
  const { data, error: selectError } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!data) return null;

  const { error } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId)
    .eq('interest_id', interestId);

  if (error) throw error;
  return data;
};

/* ------ FRIENDSHIP CRUD ------ */

// CREATE
/**
 * Creates a friendship request
 * @param friendship The friendship data to create
 * @returns Promise with the created friendship
 */
export const createFriendship = async (
  friendship: FriendshipsTable & { status: 'pending' | 'accepted' | 'blocked' }
): Promise<FriendshipsTable & { status: string }> => {
  const { error } = await supabase.from('friendships').insert(friendship);
  if (error) throw error;

  return friendship;
};

// READ
/**
 * Gets all friendships for a user
 * @param userId The ID of the user
 * @param status Optional status filter
 * @returns Promise with an array of friendships
 */
export const getUserFriendships = async (
  userId: string,
  status?: 'pending' | 'accepted' | 'blocked'
): Promise<(FriendshipsTable & { status: string })[]> => {
  let query = supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

/**
 * Gets pending friend requests for a user
 * @param userId The ID of the user
 * @returns Promise with an array of pending friend requests
 */
export const getPendingFriendRequests = async (
  userId: string
): Promise<(FriendshipsTable & { status: string })[]> => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('friend_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
};

// UPDATE
/**
 * Updates friendship status
 * @param userId The ID of the user
 * @param friendId The ID of the friend
 * @param status The new status
 * @returns Promise with the updated friendship or null if not found
 */
export const updateFriendshipStatus = async (
  userId: string,
  friendId: string,
  status: 'pending' | 'accepted' | 'blocked'
): Promise<(FriendshipsTable & { status: string }) | null> => {
  const { data: friendship, error: selectError } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    )
    .maybeSingle();

  if (selectError) throw selectError;
  if (!friendship) return null;

  const { data, error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('user_id', friendship.user_id)
    .eq('friend_id', friendship.friend_id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// DELETE
/**
 * Deletes a friendship
 * @param userId The ID of the user
 * @param friendId The ID of the friend
 * @returns Promise with the deleted friendship or null if not found
 */
export const deleteFriendship = async (
  userId: string,
  friendId: string
): Promise<(FriendshipsTable & { status: string }) | null> => {
  const { data: friendship, error: selectError } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    )
    .maybeSingle();

  if (selectError) throw selectError;
  if (!friendship) return null;

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', friendship.user_id)
    .eq('friend_id', friendship.friend_id);

  if (error) throw error;
  return friendship;
};

/* ------ USER MATCHES CRUD ------ */

// CREATE
/**
 * Creates a user match
 * @param match The match data to create
 * @returns Promise with the created match
 */
export const createUserMatch = async (
  match: UserMatchesTable
): Promise<UserMatchesTable & { matched_at: string }> => {
  // Ensure user_id < matched_user_id to enforce the CHECK constraint
  let userId = match.user_id;
  let matchedUserId = match.matched_user_id;

  if (userId > matchedUserId) {
    [userId, matchedUserId] = [matchedUserId, userId];
  }

  const newMatch: UserMatchesTable & { matched_at: string } = {
    user_id: userId,
    matched_user_id: matchedUserId,
    matched_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_matches').insert(newMatch);
  if (error) throw error;

  return newMatch;
};

// READ
/**
 * Gets all matches for a user
 * @param userId The ID of the user
 * @returns Promise with an array of user matches
 */
export const getUserMatches = async (
  userId: string
): Promise<(UserMatchesTable & { matched_at: string })[]> => {
  const { data, error } = await supabase
    .from('user_matches')
    .select('*')
    .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

  if (error) throw error;
  return data;
};

/**
 * Checks if a match exists between two users
 * @param userId1 The ID of the first user
 * @param userId2 The ID of the second user
 * @returns Promise with a boolean indicating if the match exists
 */
export const matchExists = async (userId1: string, userId2: string): Promise<boolean> => {
  // Ensure user_id < matched_user_id to match the stored order
  let userId = userId1;
  let matchedUserId = userId2;

  if (userId > matchedUserId) {
    [userId, matchedUserId] = [matchedUserId, userId];
  }

  const { data, error } = await supabase
    .from('user_matches')
    .select('*')
    .eq('user_id', userId)
    .eq('matched_user_id', matchedUserId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

// DELETE
/**
 * Deletes a user match
 * @param userId The ID of the user
 * @param matchedUserId The ID of the matched user
 * @returns Promise with the deleted match or null if not found
 */
export const deleteUserMatch = async (
  userId: string,
  matchedUserId: string
): Promise<(UserMatchesTable & { matched_at: string }) | null> => {
  // Ensure user_id < matched_user_id to match the stored order
  let userId1 = userId;
  let userId2 = matchedUserId;

  if (userId1 > userId2) {
    [userId1, userId2] = [userId2, userId1];
  }

  const { data, error: selectError } = await supabase
    .from('user_matches')
    .select('*')
    .eq('user_id', userId1)
    .eq('matched_user_id', userId2)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!data) return null;

  const { error } = await supabase
    .from('user_matches')
    .delete()
    .eq('user_id', userId1)
    .eq('matched_user_id', userId2);

  if (error) throw error;
  return data;
};

/* ------ ATTENDEES CRUD ------ */

// CREATE
/**
 * Creates a new attendee record
 * @param attendee The attendee data to create
 * @returns Promise with the created attendee
 */
export const createAttendee = async (attendee: AttendeesTable): Promise<AttendeesTable> => {
  const { error } = await supabase.from('attendees').insert(attendee);
  if (error) throw error;

  return attendee;
};

// READ
/**
 * Gets all attendees for a specific post
 * @param postId The ID of the post
 * @param status Optional status filter
 * @returns Promise with an array of attendees with user details
 */
export const getAttendeesByPost = async (
  postId: string,
  status?: Status
): Promise<(AttendeesTable & UsersTable)[]> => {
  let query = supabase.from('attendees').select('*, users(*)').eq('post_id', postId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data.map((item) => ({
    ...item,
    ...item.users,
  }));
};

/**
 * Gets all posts a user is attending
 * @param userId The ID of the user
 * @param status Optional status filter
 * @returns Promise with an array of attendees with post details
 */
export const getAttendeesByUser = async (
  userId: string,
  status?: Status
): Promise<(AttendeesTable & PostsTable)[]> => {
  let query = supabase.from('attendees').select('*, posts(*)').eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data.map((item) => ({
    ...item,
    ...item.posts,
  }));
};

/**
 * Gets attendee count for a post
 * @param postId The ID of the post
 * @param status Optional status filter
 * @returns Promise with the count of attendees
 */
export const getAttendeeCount = async (postId: string, status?: Status): Promise<number> => {
  let query = supabase
    .from('attendees')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

// UPDATE
/**
 * Updates an attendee's status
 * @param postId The ID of the post
 * @param userId The ID of the user
 * @param status The new status
 * @returns Promise with the updated attendee or null if not found
 */
export const updateAttendeeStatus = async (
  postId: string,
  userId: string,
  status: Status
): Promise<AttendeesTable | null> => {
  const { data: attendee, error: selectError } = await supabase
    .from('attendees')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!attendee) return null;

  const { data, error } = await supabase
    .from('attendees')
    .update({ status })
    .eq('post_id', postId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// DELETE
/**
 * Deletes an attendee record
 * @param postId The ID of the post
 * @param userId The ID of the user
 * @returns Promise with the deleted attendee or null if not found
 */
export const deleteAttendee = async (
  postId: string,
  userId: string
): Promise<AttendeesTable | null> => {
  const { data, error: selectError } = await supabase
    .from('attendees')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!data) return null;

  const { error } = await supabase
    .from('attendees')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

/* ------ COMMENTS CRUD ------ */

//CREATE
/**
 * Creates a new comment
 * @param comment The comment data to create
 * @returns Promise with the created comment
 */
export const createComment = async (
  comment: Omit<CommentsTable, 'id' | 'likes' | 'replies' | 'sent_at'>
): Promise<CommentsTable> => {
  const id = crypto.randomUUID();
  const newComment: CommentsTable = {
    id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    content: comment.content,
    likes: 0,
    replies: 0,
    sent_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('comments').insert(newComment);
  if (error) throw error;

  return newComment;
};

// READ
/**
 * Gets all comments for a post
 * @param postId The ID of the post
 * @returns Promise with an array of comments with user details
 */
export const getCommentsByPost = async (
  postId: string
): Promise<(CommentsTable & { user: UsersTable })[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('post_id', postId)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Gets a specific comment
 * @param id The ID of the comment
 * @returns Promise with the comment with user details or null if not found
 */
export const getCommentById = async (
  id: string
): Promise<(CommentsTable & { user: UsersTable }) | null> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }

  return data;
};
