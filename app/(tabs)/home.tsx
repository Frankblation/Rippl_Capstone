import { FlashList } from '@shopify/flash-list';
import React, { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentsBottomSheet, {
  type CommentsBottomSheetRef,
  type PostComment,
} from '../../components/CommentsBottomSheet';
import EventCard from '../../components/EventCard';
import PostCard from '../../components/PostCard';
import EventCarousel from '../../components/UpcomingEventsCarousel';

import type { ImageSourcePropType } from 'react-native';

type PostItem = {
  id: string;
  interest: string;
  username: string;
  userAvatar: ImageSourcePropType;
  timePosted: string;
  postText?: string;
  title?: string;
  postImage?: ImageSourcePropType;
  likesCount: number;
  commentsCount: number;
  type: 'post';
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image: ImageSourcePropType;
  attendeeAvatars?: ImageSourcePropType[];
  totalAttendees?: number;
  status?: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  type: 'event';
};

type CarouselItem = {
  type: 'carousel';
};

type FeedItem = PostItem | EventItem | CarouselItem;

const HomeScreen = () => {
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);

  const handleOpenComments = (comments: PostComment[], count: number) => {
    setSelectedComments(comments);
    setSelectedCommentsCount(count);
    commentsSheetRef.current?.open();
  };

  const handleAddComment = (text: string) => {
    console.log('New comment:', text);
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

  const sampleComments: PostComment[] = [
    {
      id: '1',
      username: 'alex_dev',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/men/42.jpg' },
      text: 'This is awesome!',
      timePosted: '2h ago',
    },
    {
      id: '2',
      username: 'jane_smith',
      userAvatar: { uri: 'https://randomuser.me/api/portraits/women/33.jpg' },
      text: 'Love the colors in this photo!',
      timePosted: '1h ago',
    },
  ];

  const posts: PostItem[] = [
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

  const events: EventItem[] = [
    {
      id: 'e1',
      title: 'Pottery Workshop',
      date: 'June 15-17, 2024',
      time: '12:00 PM - 11:00 PM',
      location: 'Central Park, New York',
      description: 'Join us for a weekend of creativity and fun at our pottery workshop...',
      image: { uri: 'https://picsum.photos/id/1019/1000/500' },
      attendeeAvatars: avatars2,
      totalAttendees: 235,
      status: 'upcoming',
      type: 'event',
    },
  ];

  const feed: FeedItem[] = [{ type: 'carousel' }, ...posts, ...events];

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'post') {
      return (
        <PostCard
          interest={item.interest}
          username={item.username}
          userAvatar={item.userAvatar}
          timePosted={item.timePosted}
          postText={item.postText}
          postImage={item.postImage}
          title="My trip to the mountains"
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(sampleComments, item.commentsCount)}
        />
      );
    }

    if (item.type === 'event') {
      return (
        <EventCard
          title={item.title}
          date={item.date}
          time={item.time}
          location={item.location}
          description={item.description}
          image={item.image}
          attendeeAvatars={item.attendeeAvatars}
          status={item.status}
          onPress={() => Alert.alert('Event Details', 'View full event details')}
          onRegisterPress={() => Alert.alert('Register', 'Registration form would open here')}
        />
      );
    }

    if (item.type === 'carousel') return <EventCarousel />;

    return null;
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <FlashList
          data={feed}
          renderItem={renderItem}
          keyExtractor={(item, index) => ('id' in item ? item.id : `carousel-${index}`)}
          estimatedItemSize={300}
        />

        <CommentsBottomSheet
          ref={commentsSheetRef}
          comments={selectedComments}
          commentsCount={selectedCommentsCount}
          onAddComment={handleAddComment}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
