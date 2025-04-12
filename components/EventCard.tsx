import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ImageSourcePropType,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import AvatarGroup from './AvatarGroup';
import LottieView from 'lottie-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Calendar from 'expo-calendar';
import { parse, format, parseISO } from 'date-fns';
import {
  createAttendee,
  updateAttendeeStatus,
  deleteAttendee,
  getAttendeesByPost,
  getAttendeeCount
} from '~/utils/data';
import { useAuth } from '~/components/providers/AuthProvider';
import { useUser } from '~/hooks/useUser';
import { AttendeesTable } from '~/utils/db';

// Import attendee status type from db.ts
import { Status } from '~/utils/db';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image: ImageSourcePropType;
  attendeeAvatars?: ImageSourcePropType[];
  status?: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  timePosted: string;
  onPress?: () => void;
  onRegisterPress?: () => void;
  onProfilePress?: () => void;
  onCommentPress?: () => void;
  onLikePress?: () => void;
  onAttendeeStatusChange?: (postId: string, status: Status | null) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
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
  likesCount: initialLikesCount,
  isLiked: initialIsLiked,
  commentsCount,
  onProfilePress,
  timePosted,
  onLikePress,
  onAttendeeStatusChange,
}) => {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [attendeeStatus, setAttendeeStatus] = useState<Status | null>(null);
  const [attendeeCount, setAttendeeCount] = useState({
    going: 0,
    interested: 0
  });
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(true);
  const animationRef = useRef<LottieView>(null);

  const { user: authUser } = useAuth();
  const { user } = useUser(authUser?.id || null);

  // Update the local state if the prop changes
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

  // Request calendar permission
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setHasCalendarPermission(status === 'granted');
    })();
  }, []);

  // Load user's attendance status and counts
  useEffect(() => {
    const loadAttendance = async () => {
      if (!id) return;

      setIsLoadingAttendees(true);
      try {
        // Get attendance counts
        const goingCount = await getAttendeeCount(id, Status.GOING);
        const interestedCount = await getAttendeeCount(id, Status.INTERESTED);

        setAttendeeCount({
          going: goingCount,
          interested: interestedCount
        });

        // Get current user's attendance status if logged in
        if (user?.id) {
          const attendees = await getAttendeesByPost(id);
          const userAttendance = attendees.find(a => a.user_id === user.id);

          if (userAttendance) {
            console.log(`User ${user.id} attendance status:`, userAttendance.status);
            setAttendeeStatus(userAttendance.status as Status);
          } else {
            console.log(`User ${user.id} has no attendance record`);
            setAttendeeStatus(null);
          }
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setIsLoadingAttendees(false);
      }
    };

    loadAttendance();
  }, [id, user?.id]);

  // Debug logging
  useEffect(() => {
    console.log(`Event ${id} - User attendance status:`, attendeeStatus);
    console.log(`Event ${id} - Attendance counts:`, attendeeCount);
  }, [attendeeStatus, attendeeCount, id]);

  const handleAttendeeStatusChange = async (newStatus: Status | null) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to update your attendance');
      return;
    }

    setIsUpdating(true);
    console.log(`Changing attendance from ${attendeeStatus} to ${newStatus}`);

    try {
      // CASE 1: User wants to remove attendance (toggle off current status)
      if (newStatus === null && attendeeStatus !== null) {
        console.log(`Removing user ${user.id} from event ${id}`);
        await deleteAttendee(id, user.id);

        // Update counts based on previous status
        if (attendeeStatus === Status.GOING) {
          setAttendeeCount(prev => ({ ...prev, going: Math.max(0, prev.going - 1) }));
        } else if (attendeeStatus === Status.INTERESTED) {
          setAttendeeCount(prev => ({ ...prev, interested: Math.max(0, prev.interested - 1) }));
        }

        // Update UI
        setAttendeeStatus(null);
      }
      // CASE 2: User changing from one status to another
      else if (newStatus !== null && attendeeStatus !== null) {
        console.log(`Updating user ${user.id} status from ${attendeeStatus} to ${newStatus}`);
        await updateAttendeeStatus(id, user.id, newStatus);

        // Update counts based on status change
        if (attendeeStatus === Status.GOING && newStatus === Status.INTERESTED) {
          setAttendeeCount(prev => ({
            going: Math.max(0, prev.going - 1),
            interested: prev.interested + 1
          }));
        } else if (attendeeStatus === Status.INTERESTED && newStatus === Status.GOING) {
          setAttendeeCount(prev => ({
            going: prev.going + 1,
            interested: Math.max(0, prev.interested - 1)
          }));
        }

        // Update UI
        setAttendeeStatus(newStatus);
      }
      // CASE 3: User setting status for the first time
      else if (newStatus !== null && attendeeStatus === null) {
        console.log(`Adding user ${user.id} to event ${id} with status ${newStatus}`);
        await createAttendee({
          user_id: user.id,
          post_id: id,
          status: newStatus
        });

        // Update counts
        if (newStatus === Status.GOING) {
          setAttendeeCount(prev => ({ ...prev, going: prev.going + 1 }));
        } else if (newStatus === Status.INTERESTED) {
          setAttendeeCount(prev => ({ ...prev, interested: prev.interested + 1 }));
        }

        // Update UI
        setAttendeeStatus(newStatus);
      }

      // Add to calendar if going
      if (newStatus === Status.GOING && hasCalendarPermission) {
        await addEventToCalendar();
      }

      // Notify parent component
      if (onAttendeeStatusChange) {
        onAttendeeStatusChange(id, newStatus);
      }

    } catch (error) {
      console.error('Error updating attendance status:', error);
      Alert.alert('Error', 'Failed to update your attendance status');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleGoing = async () => {
    // If already going, remove status. Otherwise set to going.
    const newStatus = attendeeStatus === Status.GOING ? null : Status.GOING;
    await handleAttendeeStatusChange(newStatus);
  };

  const toggleInterested = async () => {
    // If already interested, remove status. Otherwise set to interested.
    const newStatus = attendeeStatus === Status.INTERESTED ? null : Status.INTERESTED;
    await handleAttendeeStatusChange(newStatus);
  };

  const addEventToCalendar = async () => {
    try {
      // Get default calendar ID
      const defaultCalendarSource =
        Platform.OS === 'ios'
          ? await getDefaultCalendarSource()
          : { isLocalAccount: true, name: 'Expo Calendar' };

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        (cal: Calendar.Calendar) => cal.source.name === defaultCalendarSource.name
      );

      if (!defaultCalendar) {
        Alert.alert('Calendar Error', 'Could not find a default calendar');
        return;
      }

      // Parse date and time strings to create Date objects
      const { startDate, endDate } = parseEventDateRange(date, time);

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title,
        location,
        startDate,
        endDate,
        notes: description || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }],
      });

      Alert.alert('Added to Calendar', "You'll get a reminder before it starts.", [
        { text: 'Great' },
      ]);

      return eventId;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      Alert.alert('Error', 'Failed to add event to calendar');
    }
  };

  const getDefaultCalendarSource = async () => {
    const defaultCalendar =
      Platform.OS === 'ios'
        ? await Calendar.getDefaultCalendarAsync()
        : { isLocalAccount: true, name: 'Expo Calendar' };

    if ('source' in defaultCalendar) {
      return defaultCalendar.source;
    }
    return defaultCalendar;
  };

  const parseEventDateRange = (
    dateStr: string,
    timeStr: string
  ): { startDate: Date; endDate: Date } => {
    try {
      // Extract year
      const yearMatch = dateStr.match(/\d{4}$/);
      const year = yearMatch ? yearMatch[0] : `${new Date().getFullYear()}`;

      const dateWithoutYear = dateStr.replace(year, '').replace(',', '').trim();
      const [startDateRaw, endDateRaw] = dateWithoutYear.split(/[–-]/).map((s) => s.trim());

      const startDateText = `${startDateRaw} ${year}`;
      const endDateText = endDateRaw
        ? isNaN(Number(endDateRaw))
          ? `${endDateRaw} ${year}` // "June 17"
          : `${startDateRaw.split(' ')[0]} ${endDateRaw} ${year}` // "15–17" becomes "June 17"
        : startDateText;

      // Parse time range (e.g., "12:00 PM - 11:00 PM")
      const [startTimeRaw, endTimeRaw] = timeStr.split(/[–-]/).map((s) => s.trim());
      const startTime = startTimeRaw || '12:00 PM';
      const endTime = endTimeRaw || startTime;

      // Use date-fns to parse full datetimes
      const formatStr = 'MMMM d yyyy h:mm a';
      const startDate = parse(`${startDateText} ${startTime}`, formatStr, new Date());
      const endDate = parse(`${endDateText} ${endTime}`, formatStr, new Date());

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Could not parse date range');
      }

      return { startDate, endDate };
    } catch (error) {
      console.error('Error parsing date and time range:', error);
      throw new RangeError('Date or time range could not be parsed');
    }
  };

  const handleLikePress = () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like events');
      return;
    }

    // Update local state for animation
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? Math.max(0, likesCount - 1) : likesCount + 1);

    // Call the parent handler from useFeed
    if (onLikePress) {
      onLikePress();
    }
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
            <View style={styles.attendanceContainer}>
              {/* Counter section */}
              <View style={styles.countersContainer}>
                <View style={styles.counterItem}>
                  <Text style={styles.counterValue}>{attendeeCount.going}</Text>
                  <Text style={styles.counterLabel}>Going</Text>
                </View>
                <View style={styles.counterItem}>
                  <Text style={styles.counterValue}>{attendeeCount.interested}</Text>
                  <Text style={styles.counterLabel}>Interested</Text>
                </View>
              </View>

              {/* Buttons section */}
              <View style={styles.attendanceButtons}>
                {isLoadingAttendees ? (
                  <ActivityIndicator size="small" color="#00AF9F" />
                ) : (
                  <>
                    {/* GOING */}
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        attendeeStatus === Status.GOING
                          ? styles.goingButtonActiveGreen
                          : styles.goingButtonInactive,
                      ]}
                      onPress={toggleGoing}
                      disabled={isUpdating}>
                      <AntDesign
                        name="check"
                        size={20}
                        color={attendeeStatus === Status.GOING ? '#fff' : '#00AF9F'}
                      />
                      {isUpdating && attendeeStatus === Status.GOING && (
                        <ActivityIndicator
                          size="small"
                          color="#fff"
                          style={styles.buttonLoader}
                        />
                      )}
                    </TouchableOpacity>

                    {/* INTERESTED */}
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        attendeeStatus === Status.INTERESTED
                          ? styles.interestedButtonActiveGray
                          : styles.interestedButtonInactive,
                      ]}
                      onPress={toggleInterested}
                      disabled={isUpdating}>
                      <AntDesign
                        name="staro"
                        size={20}
                        color={attendeeStatus === Status.INTERESTED ? '#fff' : '#F39237'}
                      />
                      {isUpdating && attendeeStatus === Status.INTERESTED && (
                        <ActivityIndicator
                          size="small"
                          color="#fff"
                          style={styles.buttonLoader}
                        />
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* NUM OF LIKES AND COMMENTS */}
          <View style={styles.engagementStats}>
            <Text style={styles.likesText}>{likesCount} likes</Text>
            <Text style={styles.commentsText}>{commentsCount} comments</Text>
          </View>

          {/* HEART AND COMMENT ICON */}
          <View style={styles.heartCommentTimeContainer}>
            <View style={styles.divider} />
            <View style={styles.footerRow}>
              <View style={styles.containerHeartComment}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={handleLikePress}
                >
                  <LottieView
                    ref={animationRef}
                    source={require('../assets/animations/heart.json')}
                    loop={false}
                    autoPlay={isLiked}
                    style={{ width: 70, height: 70 }}
                    progress={isLiked ? undefined : 0}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#262626"
                    style={styles.actionIcon}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.timePosted}>{timePosted}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Styles with additional loading indicator style
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
  // Attendance section
  attendanceContainer: {
    marginBottom: 16,
  },
  countersContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  counterItem: {
    marginRight: 24,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  counterLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    borderColor: '#00AF9F',
  },
  interestedButtonInactive: {
    backgroundColor: 'white',
    borderColor: '#F39237',
  },
  goingButtonActiveGreen: {
    backgroundColor: '#00AF9F',
    borderColor: '#00AF9F',
  },
  interestedButtonActiveGray: {
    backgroundColor: '#F39237',
    borderColor: '#F39237',
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
  buttonLoader: {
    position: 'absolute',
    right: -20,
  },
});

export default EventCard;
