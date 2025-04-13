import { useState, useEffect, useRef } from 'react';
import Swiper from 'react-native-deck-swiper';
import { View, Text, StyleSheet, Image, Vibration, ActivityIndicator } from 'react-native';
import UserCard from './UserSwipingCard';
import { useAnimation } from '~/components/AnimationContext';
import LottieView from 'lottie-react-native';
import { AntDesign } from '@expo/vector-icons';

import { getRecommendedUsers, getUserInterests, getUserById, saveSwipe } from '~/utils/data';

import { useRouter } from 'expo-router';
import { useAuth } from './providers/AuthProvider';

type User = {
  name: string;
  bio: string;
  picture: any;
  interests: string[];
  id?: string;
};

export default function Swipe() {
  const auth = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const router = useRouter();
  const { showAnimationOverlay, hideAnimationOverlay } = useAnimation();

  // Fetch recommended users when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Ensure user is authenticated
        if (!auth.user || !auth.user.id) {
          console.error('No authenticated user found');
          setUsers([]);
          setLoading(false);
          return;
        }

        // Get recommended users
        const { data, error } = await getRecommendedUsers(auth.user.id);

        if (error) {
          console.error('Error fetching recommended users:', error);
          setUsers([]);
          return;
        }

        if (!data || data.length === 0) {
          setUsers([]);
          return;
        }

        // Make sure all users have an interests array, even if empty
        const validatedUsers = data.map((user) => ({
          ...user,
          interests: Array.isArray(user.interests) ? user.interests : [],
        }));
        setUsers(validatedUsers);
      } catch (err) {
        console.error('Exception loading data:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    // Only load data if we have an authenticated user
    if (auth.user) {
      loadData();
    }
  }, [auth.user]);

  // Create animation overlay component
  const createAnimationOverlay = (matchedUser: User, currentUser: User) => {
    return () => {
      const animationRef = useRef<LottieView>(null);

      useEffect(() => {
        if (animationRef.current) {
          animationRef.current.play();
        }
      }, []);

      return (
        <View style={[StyleSheet.absoluteFillObject, styles.animationContainer]}>
          <LottieView
            ref={animationRef}
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
                  matchedUser: JSON.stringify(matchedUser),
                  currentUser: JSON.stringify(currentUser),
                },
              });
            }}
          />
        </View>
      );
    };
  };

  // Handle swipe gesture
  const handleSwipe = async (direction: string, cardIndex: number) => {
    const swipedUser = users[cardIndex];

    if (!auth.user?.id || !swipedUser.id) {
      console.error('Missing user IDs for swipe action');
      return;
    }

    // For both right and left swipes, we'll save the action to the database
    // true for right swipe (like), false for left swipe (pass)
    const isLiked = direction === 'right';

    try {
      // Save the swipe action to database
      const swipeResult = await saveSwipe(auth.user.id, swipedUser.id, isLiked);

      // Only proceed with the match flow for right swipes that result in a match
      if (isLiked) {
        // Trigger vibration for right swipe
        Vibration.vibrate([0, 100, 0, 300, 0, 400]);

        // Determine if there was a match
        const isMatch = swipeResult.isMatch;

        // Even if it's not a match now, it could be in the future when the other user swipes
        // So we'll just log that info for now
        if (!isMatch) {
          return;
        }

        // If there's a match, proceed with showing the match screen
        console.log('Match found! Preparing match screen...');

        // Ensure the matched user has defined interests
        const matchedUserWithValidInterests = {
          ...swipedUser,
          interests: Array.isArray(swipedUser.interests) ? swipedUser.interests : [],
        };

        // Initialize with basic data in case fetching fails
        let currentUserData: User = {
          id: auth.user.id,
          name: 'You',
          bio: '',
          picture: null,
          interests: [],
        };

        try {
          // Get full user profile data
          const userProfile = await getUserById(auth.user.id);

          // Fetch the current user's interests
          const authUserInterests = await getUserInterests(auth.user.id);

          // Extract interest names from the response
          const currentUserInterests = authUserInterests
            .map((item) => item.interests?.name)
            .filter(Boolean) as string[];

          // Update user data if profile was fetched successfully
          if (userProfile) {
            currentUserData = {
              id: userProfile.id,
              name: userProfile.name || 'You',
              bio: userProfile.description || '',
              picture: userProfile.image || null,
              interests: currentUserInterests,
            };
          }

          // Prepare final matched user data
          const matchUserData: User = {
            id: matchedUserWithValidInterests.id,
            name: matchedUserWithValidInterests.name,
            bio: matchedUserWithValidInterests.bio || '',
            picture: matchedUserWithValidInterests.picture,
            interests: matchedUserWithValidInterests.interests || [],
          };

          // Show animation and navigate
          const AnimationOverlay = createAnimationOverlay(matchUserData, currentUserData);
          showAnimationOverlay(<AnimationOverlay />);
        } catch (err) {
          console.error('Error preparing match data:', err);

          // Create fallback data
          const fallbackMatchedUser: User = {
            id: swipedUser.id,
            name: swipedUser.name,
            bio: swipedUser.bio || '',
            picture: swipedUser.picture || null,
            interests: Array.isArray(swipedUser.interests) ? swipedUser.interests : [],
          };

          // Show animation and navigate with fallback data
          const FallbackAnimationOverlay = createAnimationOverlay(
            fallbackMatchedUser,
            currentUserData
          );
          showAnimationOverlay(<FallbackAnimationOverlay />);
        }
      }
    } catch (err) {
      console.error('Error processing swipe action:', err);
    }
  };

  // Render swipe indicators
  const renderOverlayLabel = (label: string) => {
    return (
      <View style={styles.overlayLabelContainer}>
        {label === 'LEFT' ? (
          <AntDesign name="close" size={80} color="#F39237" style={styles.overlayIcon} />
        ) : (
          <AntDesign name="check" size={80} color="#00AF9F" style={styles.overlayIcon} />
        )}
      </View>
    );
  };

  if (!auth.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.noUsersText}>Please sign in to see recommendations</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00AF9F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {users.length > 0 ? (
        <Swiper
          cards={users}
          renderCard={(user) => <UserCard user={user} />}
          onSwiped={(cardIndex) => setCardIndex(cardIndex)}
          onSwipedRight={(cardIndex) => handleSwipe('right', cardIndex)}
          onSwipedLeft={(cardIndex) => handleSwipe('left', cardIndex)}
          onSwipedAll={() => console.log('No more cards')}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={3}
          verticalSwipe={false}
          overlayLabels={{
            left: {
              element: renderOverlayLabel('LEFT'),
              style: {
                wrapper: styles.overlayWrapper,
              },
            },
            right: {
              element: renderOverlayLabel('RIGHT'),
              style: {
                wrapper: styles.overlayWrapper,
              },
            },
          }}
        />
      ) : (
        <View style={styles.noUsersContainer}>
          <Text style={styles.noUsersText}>No recommendations available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
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

  overlayLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  overlayWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -80,
    zIndex: 2,
    opacity: 0.8,
  },
  noUsersContainer: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: 400,
  },
  noUsersText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
});
