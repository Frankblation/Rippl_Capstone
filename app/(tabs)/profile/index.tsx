import { FlashList } from '@shopify/flash-list';
import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CommentsBottomSheet, {
  CommentsBottomSheetRef,
  PostComment,
} from '~/components/CommentsBottomSheet';
import PostCard from '~/components/PostCard';
import { UserProfileHeader } from '~/components/UserProfileHeader';

const INTERESTS = [
  { id: '1', name: 'Photography' },
  { id: '2', name: 'Travel' },
  { id: '3', name: 'Cooking' },
  { id: '4', name: 'Fitness' },
  { id: '5', name: 'Reading' },
  { id: '6', name: 'Music' },
  { id: '7', name: 'Movies' },
  { id: '8', name: 'Art' },
  { id: '9', name: 'Technology' },
  { id: '10', name: 'Sports' },
  { id: '11', name: 'Fashion' },
  { id: '12', name: 'Gaming' },
];

const CurrentUser: React.FC = () => {
  const insets = useSafeAreaInsets();
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);

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

  const feed = [{ id: 'header', type: 'header' }, ...posts];

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <UserProfileHeader />
          <View style={styles.interestsContainer}>
            {INTERESTS.map((interest) => (
              <View key={interest.id} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest.name}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    } else if (item.type === 'post') {
      return (
        <PostCard
          {...item}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => Alert.alert('Profile', `Navigate to ${item.username} profile`)}
          onCommentPress={() => handleOpenComments(sampleComments, item.commentsCount)}
        />
      );
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
            keyExtractor={(item) => item.id}
            estimatedItemSize={300}
            contentContainerStyle={{
              ...styles.listContent,
              paddingBottom: insets.bottom + 16,
            }}
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

const styles = StyleSheet.create({
  listContent: {
    padding: 6,
  },
  headerContainer: {
    paddingTop: 40,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  interestChip: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 16,
    opacity: 75,
    backgroundColor: '#00AF9F',
    width: '48%',
    alignItems: 'center',
  },
  interestText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default CurrentUser;
