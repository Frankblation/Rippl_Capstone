import Feather from '@expo/vector-icons/Feather';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  type ImageSourcePropType,
  Dimensions,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { likePost, unlikePost } from '~/utils/data';
import { useAuth } from '~/components/providers/AuthProvider';

interface PostCardProps {
  id: string; // Post ID
  interest: string;
  username: string;
  userAvatar: ImageSourcePropType;
  timePosted: string;
  userId: string;
  postUserId: string; // The user ID of the post creator
  title?: string;
  postText?: string;
  postImage?: ImageSourcePropType;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  onPress?: () => void;
  onCommentPress?: () => void;
  onProfilePress?: () => void;
  onLikeStatusChange?: (postId: string, isLiked: boolean) => void; // Callback to notify parent of like status changes
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  interest,
  username,
  userAvatar,
  timePosted,
  postText,
  userId,
  postUserId,
  title,
  postImage,
  onPress,
  likesCount: initialLikesCount,
  isLiked: initialIsLiked,
  commentsCount,
  onCommentPress,
  onProfilePress,
  onLikeStatusChange,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const animationRef = useRef<LottieView>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Update the local state if the prop changes (e.g., when switching between feeds)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount]);

  // Handle animation when like status changes
  useEffect(() => {
    if (isLiked) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isLiked]);

  const handleLikePress = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like posts');
      return;
    }

    if (isUpdating) return; // Prevent multiple rapid clicks
    setIsUpdating(true);

    // Optimistically update UI
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      // Make API call
      if (newIsLiked) {
        await likePost(user.id, id);
      } else {
        await unlikePost(user.id, id);
      }

      // Notify parent component if needed
      if (onLikeStatusChange) {
        onLikeStatusChange(id, newIsLiked);
      }
    } catch (error) {
      console.error('Error handling like:', error);

      // Revert UI if there was an error
      setIsLiked(!newIsLiked);
      setLikesCount(newIsLiked ? likesCount : likesCount + 1);

      Alert.alert('Error', 'Failed to update like status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCommentPress = () => {
    if (onCommentPress) onCommentPress();
  };

  return (
    <Pressable onPress={onPress}>
      <View style={styles.card}>
        {/* HEADER WITH INTEREST, PROFILE PIC AND USERNAME */}
        <View style={styles.cardHeader}>

          <Pressable
            onPress={() => router.push(`/(tabs)/profile/${postUserId}`)}

            style={styles.userInfo}>
            <Image source={userAvatar} style={styles.avatar} />
            <View>
              <Text style={styles.interest}>{interest}</Text>
              <Text style={styles.username}>{username}</Text>
            </View>
          </Pressable>
        </View>

        {/* IMAGE */}
        {postImage && <Image source={postImage} style={styles.postImage} resizeMode="cover" />}

        {/* TITLE */}
        {title && <Text style={styles.postTitle}>{title}</Text>}
        {/* DESCRIPTION */}
        {postText && <Text style={styles.postText}>{postText}</Text>}
        {/* NUM OF LIKES AND COMMENTS */}
        <View style={styles.engagementStats}>
          <Text style={styles.numLikesText}>{likesCount} likes</Text>
          <Pressable onPress={handleCommentPress}>
            <Text style={styles.numCommentsText}>{commentsCount} comments</Text>
          </Pressable>
        </View>
        {/* LIKE AND COMMENT */}
        <View style={styles.heartCommentTimeContainer}>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <View style={styles.containerHeartComment}>

              <Pressable
                style={styles.actionIcon}
                onPress={handleLikePress}
                disabled={isUpdating}
              >
                <LottieView
                  ref={animationRef}
                  source={require('../assets/animations/heart.json')}
                  loop={false}
                  autoPlay={isLiked}
                  style={{ width: 70, height: 70 }}
                  progress={isLiked ? undefined : 0}
                />
              </Pressable>

              <Pressable style={styles.actionButton} onPress={handleCommentPress}>
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color="#262626"
                  style={styles.actionIcon}
                />
              </Pressable>
            </View>

            <Text style={styles.timePosted}>{timePosted}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// Existing styles remain unchanged
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  interest: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#262626',
  },
  username: {
    fontSize: 14,
    color: '#262626',
  },
  postImage: {
    width: '100%',
    height: width,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  postText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  engagementStats: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  numLikesText: {
    fontSize: 14,
    marginRight: 16,
    color: '#666',
  },
  numCommentsText: {
    fontSize: 14,
    color: '#666',
  },
  heartCommentTimeContainer: {
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#efefef',
    marginTop: 5,
    top: 12,
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  containerHeartComment: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#262626',
  },
  containerTimePosted: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'center',
  },
  timePosted: {
    fontSize: 12,
    color: '#8e8e8e',
    alignSelf: 'center',
    marginRight: 16,
  },
});

export default PostCard;
