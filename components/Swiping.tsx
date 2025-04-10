import { useState, useEffect, useRef } from 'react';
import Swiper from 'react-native-deck-swiper';
import { View, Text, StyleSheet, Vibration, ActivityIndicator } from 'react-native';
import UserCard from './UserSwipingCard';
import { useAnimation } from '~/components/AnimationContext';
import LottieView from 'lottie-react-native';

import { getRecommendedUsers } from '~/utils/data';
import { getUserInterests } from '~/utils/data';

import { useRouter } from 'expo-router';

type User = {
  name: string;
  bio: string;
  picture: any; // Changed to any to support require() for local images
  interests: string[];
};

const dummyUsers: User[] = [
  {
    name: 'Alex Johnson',
    bio: 'Photography enthusiast capturing urban landscapes and street art.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Photography', 'Urban Exploration', 'Cycling', 'Jazz Music', 'Coffee Brewing'],
  },
  {
    name: 'Jamie Smith',
    bio: 'Avid hiker and nature photographer documenting wilderness trails.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Hiking', 'Photography', 'Bird Watching', 'Camping', 'Botany'],
  },
  {
    name: 'Taylor Rodriguez',
    bio: 'Passionate home chef specializing in international cuisines and baking.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Cooking', 'Baking', 'Farmers Markets', 'Food Blogging', 'Wine Tasting'],
  },
  {
    name: 'Morgan Chen',
    bio: 'Book lover and writer working on a collection of short stories.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Reading', 'Creative Writing', 'Poetry', 'Book Clubs', 'Library Visits'],
  },
  {
    name: 'Jordan Williams',
    bio: 'Dedicated musician playing guitar in a local indie rock band.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Guitar', 'Songwriting', 'Concert-going', 'Record Collecting', 'Music Production'],
  },
  {
    name: 'Casey Parker',
    bio: 'Yoga instructor and meditation practitioner focused on mindfulness.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Yoga', 'Meditation', 'Hiking', 'Vegetarian Cooking', 'Journaling'],
  },
  {
    name: 'Riley Thompson',
    bio: 'Crafting enthusiast specializing in handmade jewelry and accessories.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Jewelry Making', 'Crafting', 'Art Markets', 'Upcycling', 'Design'],
  },
  {
    name: 'Avery Martinez',
    bio: 'Rock climbing coach who spends weekends exploring new climbing routes.',
    picture: require('../assets/user2.jpg'), // Local image path
    interests: ['Rock Climbing', 'Bouldering', 'Outdoor Adventure', 'Fitness', 'Travel'],
  },
];

const currentAuthUser = {
  id: '123f2785-cbed-4e04-863a-fa0f0e376d53',
  name: 'Test User',
  interests: ['Reading', 'Gardening', 'Knitting', 'Photography', 'Hiking'],
};

export default function Swipe() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);

  // Fetch recommended users when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // First get recommended users
        const { data, error } = await getRecommendedUsers(currentAuthUser.id);
        
        if (error) {
          console.error('Error fetching recommended users:', error);
          setUsers([]);
          return;
        }
        
        if (!data || data.length === 0) {
          setUsers([]);
          return;
        }
        
        // Then get interests for each user and merge the data
        const usersWithInterests = await Promise.all(
          data.map(async (user) => {
            try {
              const interestsData = await getUserInterests(user.id);
              
              // Extract just the interest names from the interests data
              const interestNames = interestsData.map(item => 
                item.interests?.name || ''
              ).filter(name => name !== '');
              
              // Return user with interests added
              return {
                ...user,
                interests: interestNames
              };
            } catch (err) {
              console.error(`Error fetching interests for user ${user.id}:`, err);
              return {
                ...user,
                interests: []
              };
            }
          })
        );
        
        setUsers(usersWithInterests);
      } catch (err) {
        console.error('Exception loading data:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const router = useRouter();

  const { showAnimationOverlay, hideAnimationOverlay } = useAnimation();

  // Handle swipe gesture
  const handleSwipe = (direction: string, cardIndex: number) => {
    if (direction === 'right') {
      const matched = users[cardIndex];
      Vibration.vibrate([0, 100, 0, 300, 0, 400]);

      const AnimationOverlay = () => {
        const animationRef = useRef<LottieView>(null);

        useEffect(() => {
          fetch;
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
                    matchedUser: JSON.stringify(matched),
                    currentUser: JSON.stringify(currentAuthUser),
                  },
                });
              }}
            />
          </View>
        );
      };

      showAnimationOverlay(<AnimationOverlay />);
    }
  };

  // Get the recommended user data
  const fetchRecommendedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await getRecommendedUsers(currentAuthUser.id);

      if (error) {
        console.error('Error fetching recommended users:', error);
        setUsers([]);
      } else if (data && data.length > 0) {
        setUsers(data);
      } else {
        // No recommendations, set empty array
        setUsers([]);
      }
    } catch (err) {
      console.error('Exception in fetching recommended users:', err);
      setUsers([]); // Set empty array instead of dummy data
    } finally {
      setLoading(false);
    }
  };

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
