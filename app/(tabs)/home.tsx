import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '~/components/providers/AuthProvider';

// DB stuff
import {
  getUserById,
  getPostsByUserId,
  getUserInterests,
  getUserChats,
  getUserFriendships,
  getPendingFriendRequests,
  getUserMatches,
  getAttendeesByUser,
  getPostsByInterestId,
  getAllPosts
} from '~/utils/data';

import EventCard from '../../components/EventCard';
import PostCard from '../../components/PostCard';
import EventCarousel from '../../components/UpcomingEventsCarousel';
import CommentsBottomSheet, {
  CommentsBottomSheetRef,
  PostComment,
} from '../../components/CommentsBottomSheet';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Wait for the user object to be updated by auth
    // Get current user interest
    // Get a list of that users friends
    // Show post from friends and posts from user interest
    const fetchUserData = async () => {
      try {
        // User data
          const userData = await getUserById(user.id);
          // console.log('User data:', userData);

          // User's interests
          const userInterests = await getUserInterests(user.id);
          // console.log('User interests:', userInterests);

          // User's posts
          const userPosts = await getPostsByUserId(user.id);
          // console.log('User posts:', userPosts);

          // any posts???
          const post = await getAllPosts();
          // console.log('All post: ', post)


        // getPostsByUserId();
        // getPostsByInterestId(interestID);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleOpenComments = (comments: PostComment[], count: number) => {
    setSelectedComments(comments);
    setSelectedCommentsCount(count);
    commentsSheetRef.current?.open();
  };

  const handleAddComment = (text: string) => {
    const newComment: PostComment = {
      id: Date.now().toString(),
      username: 'current_user',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/women/68.jpg' },
      text,
      timePosted: 'Just now',
    };
    setSelectedComments((prev) => [...prev, newComment]);
    setSelectedCommentsCount((prev) => prev + 1);
  };


  const avatars2 = [
    { uri: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/69.jpg' },
    { uri: 'https://randomuser.me/api/portraits/women/70.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/71.jpg' },
    { uri: 'https://randomuser.me/api/portraits/women/72.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/73.jpg' },
    { uri: 'https://randomuser.me/api/portraits/women/74.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/75.jpg' },
    { uri: 'https://randomuser.me/api/portraits/women/76.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/77.jpg' },
    { uri: 'https://randomuser.me/api/portraits/women/78.jpg' },
    { uri: 'https://randomuser.me/api/portraits/men/79.jpg' },
  ];

  const posts = [
    {
      id: '1',
      interest: 'Books',
      username: 'Julia Smith',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
      timePosted: '5 hours ago',
      title: 'My trip to the mountains',
      postText: 'Just finished reading an amazing book! Highly recommend it.',
      likesCount: 87,
      commentsCount: 32,
      type: 'post',
    },
    {
      id: '2',
      interest: 'Photography',
      username: 'travel_enthusiast',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/women/68.jpg' },
      timePosted: '1 day ago',
      title: 'My trip to the mountains',
      postText: 'Sunset views from my hotel balcony. No filter needed!',
      postImage: { uri: 'https://picsum.photos/id/1016/1000/1000' },
      likesCount: 342,
      commentsCount: 56,
      type: 'post',
    },
  ];

  const events = [
    {
      id: 'e1',
      title: 'Pottery Workshop',
      date: 'June 15-17, 2024',
      timPosted: '12:00 PM - 11:00 PM',
      location: 'Central Park, New York',
      description: 'Join us for a weekend of creativity and fun at our pottery workshop...',
      image: { uri: 'https://picsum.photos/id/1019/1000/500' },
      attendeeAvatars: avatars2,
      totalAttendees: 235,
      likesCount: 342,
      commentsCount: 56,
      timePosted: '1 day ago',
      status: 'upcoming',
      type: 'event',
    },
  ];

  const sampleComments: PostComment[] = [
    {
      id: '1',
      username: 'alex_dev',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/men/42.jpg' },
      text: 'This is awesome!',
      timePosted: '2h ago',
    },
  ];

  const feed = [{ type: 'carousel' }, ...posts, ...events];

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'post') {
      return (
        <PostCard
          {...item}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(sampleComments, item.commentsCount)}
        />
      );
    } else if (item.type === 'event') {
      return (
        <EventCard
          {...item}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(sampleComments, item.commentsCount)}
        />
      );
    } else if (item.type === 'carousel') {
      return <EventCarousel />;
    }
    return null;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <FlashList
            data={feed}
            renderItem={renderItem}
            keyExtractor={(item, index) => ('id' in item ? item.id : `carousel-${index}`)}
            estimatedItemSize={300}
            contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
          />
          <CommentsBottomSheet
            ref={commentsSheetRef}
            comments={selectedComments}
            commentsCount={selectedCommentsCount}
            onAddComment={handleAddComment}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;
