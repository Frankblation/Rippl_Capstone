import React, { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  type ImageSourcePropType,
  Dimensions,
} from 'react-native';

interface PostCardProps {
  interest: string;
  username: string;
  userAvatar: ImageSourcePropType;
  timePosted: string;
  title?: string;
  postText?: string;
  postImage?: ImageSourcePropType;
  likesCount: number;
  commentsCount: number;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onProfilePress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  interest,
  username,
  userAvatar,
  timePosted,
  postText,
  title,
  postImage,
  likesCount: initialLikesCount,
  commentsCount,
  onLikePress,
  onCommentPress,
  onProfilePress,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);

  const handleLikePress = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    if (onLikePress) onLikePress();
  };

  const handleCommentPress = () => {
    if (onCommentPress) onCommentPress();
  };

  return (
    <View style={styles.card}>
      {/* HEADER WITH INTEREST, PROFILE PIC AND USERNAME */}
      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
          <Image source={userAvatar} style={styles.avatar} />
          <View>
            <Text style={styles.interest}>{interest}</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* IMAGE */}
      {postImage && <Image source={postImage} style={styles.postImage} resizeMode="cover" />}
      {/* TITLE */}
      {title && <Text style={styles.postTitle}>{title}</Text>}
      {/* DESCRIPTION */}
      {postText && <Text style={styles.postText}>{postText}</Text>}

      {/* NUM OF LIKES AND COMMENTS */}
      <View style={styles.engagementStats}>
        <Text style={styles.likesText}>{likesCount} likes</Text>
        <Text style={styles.commentsText}>{commentsCount} comments</Text>
      </View>

      {/* LIKE AND COMMENT */}
      <View style={styles.divider} />
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
          <Feather
            name="heart"
            color={isLiked ? '#ed4956' : '#262626'}
            fill={isLiked ? '#ed4956' : 'none'}
            stroke={isLiked ? '#ed4956' : '#262626'}
            style={styles.actionIcon}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
          <Feather name="message-circle" color="#262626" style={styles.actionIcon} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <Text style={styles.timePosted}>{timePosted}</Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 8,
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
        elevation: 3,
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
  timePosted: {
    fontSize: 12,
    color: '#8e8e8e',
    alignSelf: 'center',
  },
  postText: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  postTitle: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 15,
    fontWeight: 600,
    color: '#262626',
  },
  postImage: {
    width: '100%',
    height: width,
    marginBottom: 12,
  },
  engagementStats: {
    flexDirection: 'row',
    padding: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 16,
    color: '#262626',
  },
  commentsText: {
    fontSize: 14,
    color: '#262626',
  },
  divider: {
    height: 1,
    backgroundColor: '#efefef',
    marginHorizontal: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#262626',
  },
  likedText: {
    color: '#ed4956',
  },
});

export default PostCard;
