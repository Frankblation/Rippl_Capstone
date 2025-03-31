import { supabase } from './supabase';

// Data Types
import { UsersTable } from './db';


// Users CRUD
// Create
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


// Update
/**
 * Creates a new user in the database
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

// Delete
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
