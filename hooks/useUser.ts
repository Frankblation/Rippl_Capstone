import { useState, useEffect, useCallback } from 'react';
import {
  getUserById,
  getUserInterests,
  getUserFriendships
} from '~/utils/data';

import {
  UsersTable,
  InterestsTable,
  FriendshipsTable,
  UserInterestsTable
} from '~/utils/db';

// Extended interface for user interests with interest details
interface UserInterestWithDetails extends UserInterestsTable {
  interests?: InterestsTable;
}

// Extended interface for friendships with user details
interface FriendshipWithDetails extends FriendshipsTable {
  user?: {
    id: string;
    name: string;
    image: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

// Main user data interface
interface UserData {
  // Basic user info
  id: string;
  email?: string;
  name?: string;
  image?: string;
  description?: string;
  created_at?: string;

  // Related collections
  interests: UserInterestWithDetails[];
  friendships: FriendshipWithDetails[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

export function useUser(userId: string | null) {
  const [userData, setUserData] = useState<UserData>({
    id: '',
    interests: [],
    friendships: [],
    isLoading: false,
    error: null
  });

  // Extract the data fetching logic into a reusable function
  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    setUserData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get basic user information
      const user = await getUserById(userId);

      // Get user interests with interest details
      const interests = await getUserInterests(userId);

      // Get user friendships (both where user is the requester or recipient)
      const friendships = await getUserFriendships(userId);

      const updatedUserData = {
        id: userId,
        email: user?.email,
        name: user?.name,
        image: user?.image,
        description: user?.description,
        created_at: user?.created_at,
        interests: interests || [],
        friendships: (friendships || []).map(friendship => ({
          ...friendship,
          status: friendship.status as 'accepted' | 'pending' | 'rejected'
        })),
        isLoading: false,
        error: null
      };
      // Log specific details
      // console.log(`User Profile - ${updatedUserData.name || 'Unnamed User'}`);
      // console.log(`Email: ${updatedUserData.email || 'No email'}`);
      // console.log(`ID: ${updatedUserData.id}`);

      setUserData(updatedUserData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load user data'
      }));
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // The refreshUser function that can be called from components
  const refreshUser = async () => {
    console.log('Manually refreshing user data...');
    await fetchUserData();
    return true;
  };

  // Helper function to get interest IDs
  const getInterestIds = () => {
    return userData.interests.map(interest => interest.interest_id);
  };

  // Helper function to get interest names
  const getInterestNames = () => {
    return userData.interests
      .filter(interest => interest.interests?.name)
      .map(interest => interest.interests?.name as string);
  };

  // Helper function to get friend IDs with specific status
  const getFriendIds = (status: 'accepted' | 'pending' | 'rejected' = 'accepted') => {
    return userData.friendships
      .filter(friendship => friendship.status === status)
      .map(friendship =>
        friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      );
  };

  // Get the count of accepted friendships
  const getFriendsCount = () => {
    return userData.friendships.filter(friendship =>
      friendship.status === 'accepted'
    ).length;
  };

  // Check if user has a specific interest
  const hasInterest = (interestId: string) => {
    return userData.interests.some(interest =>
      interest.interest_id === interestId
    );
  };

  // Check if user is friends with specific user
  const isFriendsWith = (otherUserId: string) => {
    return userData.friendships.some(friendship =>
      friendship.status === 'accepted' &&
      (friendship.user_id === otherUserId || friendship.friend_id === otherUserId)
    );
  };

  return {
    user: userData,
    getInterestIds,
    getInterestNames,
    getFriendIds,
    getFriendsCount,
    hasInterest,
    isFriendsWith,
    refreshUser
  };
}
