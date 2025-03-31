import { supabase } from './supabase';

// Data Types
import { UsersTable } from './db';
import { PostsTable } from './db';

// Users CRUD
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

// Posts CRUD
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
