import {
  Image,
  Platform,
  StyleSheet,
  Dimensions,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

type UserCardProps = {
  user: {
    name: string;
    bio: string;
    picture: string;
    interests: string[];
  };
};

const { width } = Dimensions.get('window');

export default function UserSwipingCard({ user }: UserCardProps) {
  const initialLocations: [number, number] = [0, 1]; // Ensure it's a tuple
  const initialColors: [string, string] = ['#000000', '#FFFFFF']; // Ensure it's a tuple
  const { width, height } = useWindowDimensions();

  // LINEAR GRADIENT
  const { colors: gradientColors, locations: gradientLocations } = easeGradient({
    colorStops: {
      0: { color: 'transparent' },
      0.5: { color: 'rgba(0,0,0,0.99)' },
      1: { color: 'black' },
    },
  }) as { colors: [string, string, ...string[]]; locations: [number, number, ...number[]] };
  return (
    <View style={styles.container}>
      <Image source={{ uri: user.picture }} resizeMode="cover" style={styles.image} />
      <View style={[styles.blurContainer, { width, height: height / 2 }]}>
        <MaskedView
          maskElement={
            <LinearGradient
              locations={gradientLocations}
              colors={gradientColors}
              style={StyleSheet.absoluteFill}
            />
          }
          style={[StyleSheet.absoluteFill]}>
          <BlurView
            intensity={100}
            tint={Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'systemMaterialDark'}
            style={[StyleSheet.absoluteFill]}
          />
        </MaskedView>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bio}>{user.bio}</Text>

          <View style={styles.interestsContainer}>
            <Text style={styles.interestsTitle}>Interests</Text>
            <View style={styles.interestsScroll}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.interestBadge}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    aspectRatio: 0.58,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
    bottom: 50,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
  },
  linearGradient: {
    bottom: 0,
    position: 'absolute',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  name: {
    fontFamily: 'SFProTextBold',
    fontSize: 30,

    color: 'white',
    marginBottom: 8,
  },
  bio: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',

    fontFamily: 'SFProTextRegular',
  },
  interestsContainer: {
    marginTop: 12,
  },
  interestsTitle: {
    fontSize: 28,
    fontFamily: 'SFProTextBold',
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  interestBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,

    backdropFilter: 'blur(10px)',
  },
  interestsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  interestText: {
    color: 'white',
    fontFamily: 'SFProTextRegular',
    fontSize: 18,
  },
});
