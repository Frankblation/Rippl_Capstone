'use client';

import type React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  LinearTransition,
  withSpring,
} from 'react-native-reanimated';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Feather from '@expo/vector-icons/Feather';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
}

// EVENT CARD FOR CAROUSEL
const EventCard: React.FC<{
  event: Event;
  onPress: () => void;
  isExpanded: boolean;
}> = ({ event, onPress, isExpanded }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isExpanded && styles.expandedCard]}
      onPress={onPress}
      activeOpacity={0.9}>
      <Image source={{ uri: event.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.cardDate}>{event.date}</Text>
        <Text style={styles.cardDate}>{event.time}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {event.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// EXPANDED EVENT LIST ITEM with Reanimated Swipeable
const EventListItem: React.FC<{
  event: Event;
  onRemove: (id: string) => void;
}> = ({ event, onRemove }) => {
  // Swipe animation value
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(100); // Approximate height of the item
  const opacity = useSharedValue(1);

  // Threshold for swipe to delete
  const SWIPE_THRESHOLD = -80;

  // Using the newer Gesture API instead of useAnimatedGestureHandler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // No need to store startX as the context is maintained internally
    })
    .onUpdate((event) => {
      // Only allow swiping left (negative values)
      translateX.value = event.translationX < 0 ? event.translationX : 0;
    })
    .onEnd(() => {
      // If swiped past threshold, trigger delete
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-200);
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            itemHeight.value = withTiming(0, { duration: 300 }, (finished) => {
              if (finished) {
                // Use the event ID from props
                runOnJS(onRemove)(event.id);
              }
            });
          }
        });
      } else {
        // Spring back to original position
        translateX.value = withSpring(0);
      }
    });

  // Animated styles for the item
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      height: itemHeight.value,
      opacity: opacity.value,
    };
  });

  // Animated styles for the delete action
  const deleteActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [SWIPE_THRESHOLD, -150], [0.5, 1], 'clamp');

    return {
      opacity,
      transform: [
        {
          translateX: interpolate(translateX.value, [0, -150], [-150, 0], 'clamp'),
        },
      ],
    };
  });

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete action behind the item */}
      <Animated.View style={[styles.deleteContainer, deleteActionStyle]}>
        <Feather name="x" size={24} color="#f87171" />
      </Animated.View>

      {/* Swipeable item using GestureDetector */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.listItem, animatedStyle]}>
          <Image source={{ uri: event.imageUrl }} style={styles.listItemImage} resizeMode="cover" />
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>{event.title}</Text>
            <Text style={styles.listItemDate}>
              {event.date} • {event.time}
            </Text>
            <Text style={styles.listItemLocation}>{event.location}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// MAIN CAROUSEL COMP
interface EventCarouselProps {
  title?: string;
  events?: Event[];
}

const EventCarousel: React.FC<EventCarouselProps> = ({
  events: initialEvents = upcomingEvents,
}) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isExpanded = expandedId !== null;
  const { height: windowHeight } = useWindowDimensions();

  // Calculate dynamic expanded height based on list length
  const ITEM_HEIGHT = 100; // Approximate height of each list item
  const HEADER_HEIGHT = 50; // Approximate height of the header
  const PADDING = 60; // Increased padding to ensure last item is visible
  const MIN_HEIGHT = 300; // Minimum expanded height
  const MAX_HEIGHT = windowHeight * 0.8; // Maximum expanded height (80% of screen)

  // Effect to handle the case when the expanded item is removed
  useEffect(() => {
    if (expandedId && !events.some((event) => event.id === expandedId)) {
      // If the expanded item was removed, select the first available item or collapse
      if (events.length > 0) {
        setExpandedId(events[0].id);
      } else {
        setExpandedId(null);
      }
    }
  }, [events, expandedId]);

  const expandedHeight = useMemo(() => {
    // Calculate height based on number of items plus extra padding for the last item
    const calculatedHeight = HEADER_HEIGHT + events.length * (ITEM_HEIGHT + 12) + PADDING;

    // Ensure height is within bounds
    return Math.max(MIN_HEIGHT, Math.min(calculatedHeight, MAX_HEIGHT));
  }, [events.length, windowHeight]);

  // Animation values
  const animationProgress = useSharedValue(0);

  // Toggle expansion
  const toggleExpand = useCallback(
    (id: string | null) => {
      if (id === null) {
        // Handle close button press
        animationProgress.value = withTiming(0, { duration: 400 }, () => {
          runOnJS(setExpandedId)(null);
        });
      } else if (expandedId === id) {
        // Collapse when tapping the same card
        animationProgress.value = withTiming(0, { duration: 400 }, () => {
          runOnJS(setExpandedId)(null);
        });
      } else {
        // Expand when tapping a new card
        setExpandedId(id);
        animationProgress.value = withTiming(1, { duration: 400 });
      }
    },
    [expandedId, animationProgress]
  );

  // Handle removing an event
  const handleRemoveEvent = useCallback((id: string) => {
    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
  }, []);

  // Animated styles for the container
  const animatedContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(animationProgress.value, [0, 1], [230, expandedHeight], 'clamp');

    return {
      height,
      overflow: 'hidden',
    };
  });

  // Animated styles for the carousel
  const animatedCarouselStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0, 0.3], [1, 0], 'clamp');

    const translateY = interpolate(animationProgress.value, [0, 0.3], [0, -50], 'clamp');

    return {
      opacity,
      transform: [{ translateY }],
      position: 'absolute',
      width: '100%',
      zIndex: opacity === 0 ? -1 : 1,
    };
  });

  // Animated styles for the list
  const animatedListStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0.3, 0.7], [0, 1], 'clamp');

    const translateY = interpolate(animationProgress.value, [0.3, 0.7], [50, 0], 'clamp');

    return {
      opacity,
      transform: [{ translateY }],
      flex: 1,
    };
  });

  // Header for expanded view - simplified to always show when expanded
  const renderHeader = () => {
    return (
      <View style={styles.expandedHeader}>
        <Text style={styles.expandedHeaderTitle}>Upcoming Events</Text>
        <Pressable style={styles.closeButton} onPress={() => toggleExpand(null)}>
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </Pressable>
      </View>
    );
  };

  // Render expanded list items with manual layout
  const renderExpandedItems = () => {
    return events.map((event) => (
      <Animated.View
        key={event.id}
        layout={LinearTransition.springify().damping(20).stiffness(200)}
        style={styles.listItemContainer}>
        <EventListItem event={event} onRemove={handleRemoveEvent} />
      </Animated.View>
    ));
  };

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Carousel View */}
      <Animated.View style={animatedCarouselStyle}>
        {/* Use a ScrollView for horizontal scrolling instead of FlatList */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => toggleExpand(event.id)}
              isExpanded={event.id === expandedId}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Expanded List View with manual rendering instead of FlatList */}
      {isExpanded && (
        <Animated.View style={animatedListStyle}>
          {renderHeader()}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}>
            {renderExpandedItems()}
            {/* Extra padding view at the bottom to ensure last item is visible */}
            <View style={styles.listBottomPadding} />
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// TEMP MOCK DATA FOR EVENTS
const upcomingEvents: Event[] = [
  {
    id: '1',
    title: 'Street Snaps & Coffee Chats',
    date: 'May 15, 2025',
    time: '11:00 AM',
    location: 'Archer Street Coffee Collective',
    imageUrl: 'https://picsum.photos/id/319/200/120',
  },
  {
    id: '2',
    title: 'Meditation Retreat',
    date: 'May 22, 2025',
    time: '7:00 AM',
    location: 'Peaceful Gardens',
    imageUrl: 'https://picsum.photos/id/326/200/120',
  },
  {
    id: '3',
    title: 'Fishing Competition',
    date: 'June 5, 2025',
    time: '5:30 AM',
    location: 'Lake Serenity',
    imageUrl: 'https://picsum.photos/id/1011/200/120',
  },
  {
    id: '4',
    title: 'Museum Exhibition',
    date: 'June 12, 2025',
    time: '3:00 PM',
    location: 'National History Museum',
    imageUrl: 'https://picsum.photos/id/508/200/120',
  },
  {
    id: '5',
    title: 'Cooking Workshop',
    date: 'July 3, 2025',
    time: '6:00 PM',
    location: 'Culinary Institute',
    imageUrl: 'https://picsum.photos/id/292/200/120',
  },
];

const { width } = Dimensions.get('window');
const cardWidth = width * 0.35;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    height: 220, // Default height for collapsed state
    position: 'relative',
  },
  carouselContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
  },
  card: {
    width: cardWidth,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  expandedCard: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
  },
  // List container
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
  },
  listItemContainer: {
    marginBottom: 12,
  },
  listBottomPadding: {
    height: 20, // Extra padding at the bottom of the list
  },
  // Swipeable container
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  listItemImage: {
    width: 80,
    height: '100%',
  },
  listItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listItemLocation: {
    fontSize: 14,
    color: '#666',
  },
  // Expanded header
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expandedHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Swipeable delete action
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,

    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 0,
  },
});

export default EventCarousel;
