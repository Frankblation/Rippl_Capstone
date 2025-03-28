import type React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
}

// TEMP MOCK DATA FOR EVENTS
const upcomingEvents: Event[] = [
  {
    id: '1',
    title: 'Painting Party',
    date: 'Oct 15, 2023',
    time: '9:00 AM',
    location: 'Art Studio',
    imageUrl: 'https://picsum.photos/200/120?random=1',
  },
  {
    id: '2',
    title: 'Music Festival',
    date: 'Oct 22, 2023',
    time: '6:00 PM',
    location: 'Central Park',
    imageUrl: 'https://picsum.photos/200/120?random=2',
  },
  {
    id: '3',
    title: 'Art Exhibition',
    date: 'Nov 5, 2023',
    time: '10:00 AM',
    location: 'Modern Art Museum',
    imageUrl: 'https://picsum.photos/200/120?random=3',
  },
  {
    id: '4',
    title: 'Food & Wine Tasting',
    date: 'Nov 12, 2023',
    time: '7:00 PM',
    location: 'Downtown Plaza',
    imageUrl: 'https://picsum.photos/200/120?random=4',
  },
  {
    id: '5',
    title: 'Pottery Workshop',
    date: 'Dec 3, 2023',
    time: '8:00 PM',
    location: 'Pottery Studio',
    imageUrl: 'https://picsum.photos/200/120?random=5',
  },
];

// EVENT CARD FOR CAROUSEL
const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: event.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.cardDate}>
          {event.date} • {event.time}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {event.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// MAIN CAROUSEL COMP
interface EventCarouselProps {
  title?: string;
  events?: Event[];
}

const EventCarousel: React.FC<EventCarouselProps> = ({ events = upcomingEvents }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={styles.carouselContent}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width * 0.7;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },

  carouselContent: {
    paddingLeft: 16,
    paddingRight: 8,
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
});

export default EventCarousel;
