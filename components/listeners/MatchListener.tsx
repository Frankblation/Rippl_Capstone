import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/components/providers/AuthProvider';
import { useAnimation } from '~/components/AnimationContext';
import { useRouter } from 'expo-router';
import { getUserById, getUserInterests } from '~/utils/data';
import LottieView from 'lottie-react-native';

type User = {
  name: string;
  bio: string;
  picture: any;
  interests: string[];
  id?: string;
};

// This component doesn't render anything visible, it just listens for matches
export default function MatchListener() {
  const auth = useAuth();
  const { showAnimationOverlay, hideAnimationOverlay } = useAnimation();
  const router = useRouter();

  useEffect(() => {
    let subscription: any;

    // Set up listener only if user is authenticated
    if (auth.user?.id) {
      // Subscribe to new matches
      subscription = supabase
        .channel('matches')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user1_id=eq.${auth.user.id} OR user2_id=eq.${auth.user.id}`,
          },
          async (payload) => {
            console.log('New match detected:', payload);

            // Extract the other user's ID
            const matchData = payload.new;
            const otherUserId =
              auth.user && matchData.user1_id === auth.user.id
                ? matchData.user2_id
                : matchData.user1_id;

            // Only show the match animation if we're not already on the match screen
            // and if this is a new match (status = 'new')
            if (matchData.status === 'new') {
              await handleNewMatch(otherUserId);
            }
          }
        )
        .subscribe();
    }

    // Clean up subscription when component unmounts
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [auth.user]);

  // Handle a new match by fetching user details and showing animation
  const handleNewMatch = async (matchedUserId: string) => {
    try {
      // Get matched user data
      const matchedUser = await getUserById(matchedUserId);

      if (!matchedUser) {
        console.error('Failed to get matched user details');
        return;
      }

      // Get matched user interests
      const matchedUserInterestsResponse = await getUserInterests(matchedUserId);
      const matchedUserInterests = matchedUserInterestsResponse
        .map((item) => item.interests?.name)
        .filter(Boolean) as string[];

      // Format matched user data
      const matchUserData: User = {
        id: matchedUser.id,
        name: matchedUser.name || 'Someone',
        bio: matchedUser.description || '',
        picture: matchedUser.image || null,
        interests: matchedUserInterests || [],
      };

      // Get current user data
      let currentUserData: User = {
        id: auth.user?.id || '',
        name: 'You',
        bio: '',
        picture: null,
        interests: [],
      };

      if (auth.user?.id) {
        // Get current user profile
        const userProfile = await getUserById(auth.user.id);

        // Get current user interests
        const authUserInterests = await getUserInterests(auth.user.id);
        const currentUserInterests = authUserInterests
          .map((item) => item.interests?.name)
          .filter(Boolean) as string[];

        if (userProfile) {
          currentUserData = {
            id: userProfile.id,
            name: userProfile.name || 'You',
            bio: userProfile.description || '',
            picture: userProfile.image || null,
            interests: currentUserInterests,
          };
        }
      }

      // Create animation overlay
      const AnimationOverlay = () => {
        return (
          <View style={[StyleSheet.absoluteFillObject, styles.animationContainer]}>
            <LottieView
              source={require('../assets/animations/Splash Transition.json')}
              style={styles.animation}
              autoPlay
              loop={false}
              speed={0.3}
              onAnimationFinish={() => {
                hideAnimationOverlay();

                router.push({
                  pathname: '/(tabs)/matched-users',
                  params: {
                    matchedUser: JSON.stringify(matchUserData),
                    currentUser: JSON.stringify(currentUserData),
                  },
                });
              }}
            />
          </View>
        );
      };

      // Show animation overlay
      showAnimationOverlay(<AnimationOverlay />);
    } catch (err) {
      console.error('Error handling new match:', err);
    }
  };

  // This component doesn't render anything visible
  return null;
}

const styles = StyleSheet.create({
  animationContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
