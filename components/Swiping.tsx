
import { useState, useEffect, useRef } from 'react';
import Swiper from 'react-native-deck-swiper';
import { View, Text, StyleSheet, Vibration, ActivityIndicator } from 'react-native';
import UserCard from './UserSwipingCard';
import { useAnimation } from '~/components/AnimationContext';
import LottieView from 'lottie-react-native';

import { getRecommendedUsers, getUserInterests, getUserById } from '~/utils/data';

import { useRouter } from 'expo-router';

import { useAuth } from './providers/AuthProvider';

type User = {
  name: string;
  bio: string;
  picture: any; // Changed to any to support require() for local images
  interests: string[];
  id?: string; // Adding optional id field for database users
};

const dummyUsers: User[] = [
  {
    name: 'Alex Johnson',
    bio: 'Photography enthusiast capturing urban landscapes and street art.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Photography', 'Urban Exploration', 'Cycling', 'Jazz Music', 'Coffee Brewing'],
  },
  // ... other dummy users
];

export default function Swipe() {
  // Use the auth context properly
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
        
        // Get recommended users - this already includes interests from your getRecommendedUsers function
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
        const validatedUsers = data.map(user => ({
          ...user,
          interests: Array.isArray(user.interests) ? user.interests : []
        }));
        
        console.log('Recommended users with interests:', validatedUsers);
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
  }, [auth.user]); // Dependencies include auth.user to re-fetch when user changes

  // Handle swipe gesture
  const handleSwipe = async (direction: string, cardIndex: number) => {
    if (direction === 'right') {
      const matched = users[cardIndex];
      Vibration.vibrate([0, 100, 0, 300, 0, 400]);

      // Before navigation, ensure the matched user has defined interests
      const matchedUserWithValidInterests = {
        ...matched,
        interests: Array.isArray(matched.interests) ? matched.interests : []
      };
      
      try {
        // Get current user's complete profile data and interests
        let currentUserData: User | null = null;
        
        if (auth.user && auth.user.id) {
          // Get full user profile data
          const userProfile = await getUserById(auth.user.id);
          
          // Fetch the current user's interests
          const authUserInterests = await getUserInterests(auth.user.id);
          
          // Extract interest names from the response
          const currentUserInterests = authUserInterests
            .map(item => item.interests?.name)
            .filter(Boolean) as string[];
          
          console.log('Current user interests fetched:', currentUserInterests);
          console.log('Current user profile fetched:', userProfile);
          
          // Create complete user data object
          if (userProfile) {
            currentUserData = {
              id: userProfile.id,
              name: userProfile.name || '',
              bio: userProfile.description || '',
              picture: userProfile.image || null,
              interests: currentUserInterests
            };
          }
        }
        
        // Log the user data being passed to the match screen
        console.log('Swiped right on user:', matchedUserWithValidInterests);
        console.log('Current user data for match screen:', currentUserData);

        const AnimationOverlay = () => {
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
                  
                  // Create a simple object with just the properties needed for the match screen
                  const matchUserData: User = {
                    id: matchedUserWithValidInterests.id,
                    name: matchedUserWithValidInterests.name,
                    bio: matchedUserWithValidInterests.bio || '',
                    picture: matchedUserWithValidInterests.picture,
                    interests: matchedUserWithValidInterests.interests || []
                  };
                  
                  // If we couldn't get the current user data, create a minimal version
                  if (!currentUserData && auth.user) {
                    currentUserData = {
                      id: auth.user.id,
                      name: 'You',
                      bio: '',
                      picture: null,
                      interests: []
                    };
                  }
                  
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

        showAnimationOverlay(<AnimationOverlay />);
      } catch (err) {
        console.error('Error preparing match data:', err);
        
        // Even if there's an error, show the animation and navigate with basic data
        const AnimationOverlay = () => {
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
                  
                  const fallbackMatchedUser: User = {
                    id: matched.id,
                    name: matched.name,
                    bio: '',
                    picture: null,
                    interests: []
                  };
                  
                  const fallbackCurrentUser: User = {
                    id: auth.user?.id || '',
                    name: 'You',
                    bio: '',
                    picture: null,
                    interests: []
                  };
                  
                  router.push({
                    pathname: '/(tabs)/matched-users',
                    params: {
                      matchedUser: JSON.stringify(fallbackMatchedUser),
                      currentUser: JSON.stringify(fallbackCurrentUser),
                    },
                  });
                }}
              />
            </View>
          );
        };

        showAnimationOverlay(<AnimationOverlay />);
      }
    }
  };

  // Removed duplicate fetchRecommendedUsers function as it's now handled in the useEffect

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
        <ActivityIndicator size="large" color="#0000ff" />
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
        />
      ) : (
        <Text style={styles.noUsersText}>No recommendations available</Text>
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
  noUsersText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});