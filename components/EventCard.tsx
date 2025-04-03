import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import AvatarGroup from './AvatarGroup';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image: ImageSourcePropType;
  attendeeAvatars?: ImageSourcePropType[];
  status?: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  onPress?: () => void;
  onRegisterPress?: () => void;
  likesCount?: number;
  commentsCount?: number;
  timePosted?: string;
  onCommentPress?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  time,
  location,
  description,
  image,
  attendeeAvatars = [],
  status = 'upcoming',
  onPress,
  onRegisterPress,
  onCommentPress,
  likesCount = 0,
  commentsCount = 0,
  timePosted = '2h ago',
}) => {
  const [isGoing, setIsGoing] = useState(false);
  const [isNotGoing, setIsNotGoing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const toggleGoing = () => {
    setIsGoing(!isGoing);
    if (!isGoing) setIsNotGoing(false);
  };

  const toggleNotGoing = () => {
    setIsNotGoing(!isNotGoing);
    if (!isNotGoing) setIsGoing(false);
  };

  const handleLikePress = () => {
    setIsLiked(!isLiked);
  };

  const handleCommentPress = () => {
    if (onCommentPress) onCommentPress();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return '#4CAF50';
      case 'in-progress':
        return '#2196F3';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      default:
        return '#4CAF50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image source={image} style={styles.image} resizeMode="cover" />

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Feather name="calendar" color="#666" style={styles.icon} />
              <Text style={styles.detailText}>{date}</Text>
            </View>

            <View style={styles.detailRow}>
              <Feather name="clock" color="#666" style={styles.icon} />
              <Text style={styles.detailText}>{time}</Text>
            </View>

            <View style={styles.detailRow}>
              <Feather name="map-pin" color="#666" style={styles.icon} />
              <Text style={styles.detailText}>{location}</Text>
            </View>
          </View>

          {attendeeAvatars.length > 0 && (
            <View style={styles.attendeesSection}>
              <View style={styles.attendeesHeader}>
                <Feather name="users" color="#666" style={styles.icon} />
                <Text style={styles.detailText}>Attendees</Text>
              </View>
              <AvatarGroup avatars={attendeeAvatars} />
            </View>
          )}

          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}

          {status === 'upcoming' && (
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
              {/* GOING */}
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  isGoing ? styles.goingButtonActiveGreen : styles.goingButtonInactive,
                ]}
                onPress={toggleGoing}>
                <Feather name="check" size={20} color={isGoing ? '#fff' : '#10b981'} />
              </TouchableOpacity>

              {/* NOT GOING */}
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  isNotGoing ? styles.notGoingButtonActiveGray : styles.notGoingButtonInactive,
                ]}
                onPress={toggleNotGoing}>
                <Feather name="x" size={20} color={isNotGoing ? '#fff' : '#f87171'} />
              </TouchableOpacity>
            </View>
          )}

          {/* NUM OF LIKES AND COMMENTS */}
          <View style={styles.engagementStats}>
            <Text style={styles.likesText}>{likesCount} likes</Text>
            <Text style={styles.commentsText}>{commentsCount} comments</Text>
          </View>

          {/* HEART AND COMMENT ICON */}
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
      </View>
    </TouchableOpacity>
  );
};

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
  image: {
    width: '100%',
    height: 160,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingTop: 16,
  },
  detailsContainer: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  // Icon Buttons (GOING & NOT GOING)
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goingButtonInactive: {
    backgroundColor: 'white',
    borderColor: '#10b981',
  },
  notGoingButtonInactive: {
    backgroundColor: 'white',
    borderColor: '#f87171',
  },
  goingButtonActiveGreen: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  notGoingButtonActiveGray: {
    backgroundColor: '#f87171',
    borderColor: '#f87171',
  },
  // ATTENDEES SELECTION
  attendeesSection: {
    marginBottom: 6,
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  // ENGAGMENT STATS
  engagementStats: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  likesText: {
    fontSize: 14,
    marginRight: 16,
    color: '#666',
  },
  commentsText: {
    fontSize: 14,
    color: '#666',
  },
  // ACTION BUTTONS (GOING OR NOT GOING)
  divider: {
    height: 1,
    backgroundColor: '#efefef',
    marginTop: 8,
    paddingHorizontal: 16,
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
  timePosted: {
    fontSize: 12,
    color: '#8e8e8e',
    alignSelf: 'center',
  },
});

export default EventCard;
