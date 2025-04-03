'use client';

import { useState } from 'react';
import Swiper from 'react-native-deck-swiper';
import { View, StyleSheet, Text } from 'react-native';
import UserCard from './UserSwipingCard';

import { useRouter } from 'expo-router';

type User = {
  name: string;
  bio: string;
  picture: string;
  interests: string[];
};

const users: User[] = [
  {
    name: 'Alex Johnson',
    bio: 'Photography enthusiast capturing urban landscapes and street art.',
    picture:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Photography', 'Urban Exploration', 'Cycling', 'Jazz Music', 'Coffee Brewing'],
  },
  {
    name: 'Jamie Smith',
    bio: 'Avid hiker and nature photographer documenting wilderness trails.',
    picture:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Hiking', 'Photography', 'Bird Watching', 'Camping', 'Botany'],
  },
  {
    name: 'Taylor Rodriguez',
    bio: 'Passionate home chef specializing in international cuisines and baking.',
    picture:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Cooking', 'Baking', 'Farmers Markets', 'Food Blogging', 'Wine Tasting'],
  },
  {
    name: 'Morgan Chen',
    bio: 'Book lover and writer working on a collection of short stories.',
    picture:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Reading', 'Creative Writing', 'Poetry', 'Book Clubs', 'Library Visits'],
  },
  {
    name: 'Jordan Williams',
    bio: 'Dedicated musician playing guitar in a local indie rock band.',
    picture:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Guitar', 'Songwriting', 'Concert-going', 'Record Collecting', 'Music Production'],
  },
  {
    name: 'Casey Parker',
    bio: 'Yoga instructor and meditation practitioner focused on mindfulness.',
    picture:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Yoga', 'Meditation', 'Hiking', 'Vegetarian Cooking', 'Journaling'],
  },
  {
    name: 'Riley Thompson',
    bio: 'Crafting enthusiast specializing in handmade jewelry and accessories.',
    picture:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Jewelry Making', 'Crafting', 'Art Markets', 'Upcycling', 'Design'],
  },
  {
    name: 'Avery Martinez',
    bio: 'Rock climbing coach who spends weekends exploring new climbing routes.',
    picture:
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=faces&q=80',
    interests: ['Rock Climbing', 'Bouldering', 'Outdoor Adventure', 'Fitness', 'Travel'],
  },
];

const currentUser = {
  name: 'You',
  interests: ['Reading', 'Gardening', 'Knitting', 'Photography', 'Hiking'],
};

export default function Swipe() {
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const router = useRouter();

  const handleSwipe = (direction: string, cardIndex: number) => {
    if (direction === 'right') {
      const matched = users[cardIndex];
      router.push({
        pathname: '/(tabs)/matched-users',
        params: {
          matchedUser: JSON.stringify(matched),
          currentUser: JSON.stringify(currentUser),
        },
      });
    }
  };

  const handleCloseMatch = () => {
    setShowMatch(false);
    setMatchedUser(null);
  };

  const handleStartChat = () => {
    console.log('Starting chat with', matchedUser?.name);
    handleCloseMatch();
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
});
