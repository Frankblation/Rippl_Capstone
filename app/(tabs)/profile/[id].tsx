'use client';

import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CommentsBottomSheet, {
  type CommentsBottomSheetRef,
  type PostComment,
} from '~/components/CommentsBottomSheet';
import PostCard from '~/components/PostCard';
import { UserProfileHeader } from '~/components/profile/UserProfileHeader';
import InterestGrid from '~/components/profile/InterestMasonary';
import { getUserById, getPostsByUserId, getUserInterests, getCommentsByPost } from '~/utils/data';
import { formatPostForUI } from '~/utils/formatPosts';
import type { UsersTable } from '~/utils/db';

function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const commentsSheetRef = useRef<CommentsBottomSheetRef>(null);
  const [selectedComments, setSelectedComments] = useState<PostComment[]>([]);
  const [selectedCommentsCount, setSelectedCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UsersTable | null>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!id) return;

        setLoading(true);

        // Fetch user data
        const userData = await getUserById(id);
        if (!userData) {
          Alert.alert('Error', 'User not found');
          return;
        }
        setUser(userData);

        // Fetch user interests
        const userInterests = await getUserInterests(id);
        const formattedInterests = userInterests.map((item) => ({
          id: item.interests.id,
          name: item.interests.name,
        }));
        setInterests(formattedInterests);

        // Fetch user posts
        const userPosts = await getPostsByUserId(id);
        const formattedPosts = await Promise.all(userPosts.map((post) => formatPostForUI(post)));
        setPosts(formattedPosts);

        // Create feed with header and posts
        setFeed([{ id: 'header', type: 'header' }, ...formattedPosts]);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  const handleOpenComments = async (postId: string) => {
    try {
      const commentsData = await getCommentsByPost(postId);
      const formattedComments = commentsData.map((comment) => ({
        id: comment.id,
        username: comment.user?.name || 'Unknown User',
        userAvatar: {
          uri: comment.user?.image || 'https://randomuser.me/api/portraits/women/68.jpg',
        },
        text: comment.content,
        timePosted: comment.sent_at,
      }));

      setSelectedComments(formattedComments);
      setSelectedCommentsCount(formattedComments.length);
      commentsSheetRef.current?.open();
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    }
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

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          {user && (
            <UserProfileHeader
              name={user.name}
              profileImage={user.image}
              postsCount={posts.length}
              friendsCount={0} // You would need to fetch this data
            />
          )}

          <View style={styles.interestsContainer}>
            <InterestGrid interests={interests} />
          </View>
        </View>
      );
    } else if (item.type === 'post' || item.type === 'event') {
      return (
        <PostCard
          {...item}
          userId={item.postUserId}
          onLikePress={() => console.log('Like pressed')}
          onProfilePress={() => console.log('Profile pressed')}
          onCommentPress={() => handleOpenComments(item.id)}
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 6,
  },
  headerContainer: {
    paddingTop: 20,
  },
  interestsContainer: {
    paddingTop: 20,
  },
  addUserButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
  },
});

export default Profile;
