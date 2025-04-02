import { supabase } from './supabase';

// Data Types
import { UsersTable, ChatsTable, MessagesTable, PostsTable } from './db';


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
