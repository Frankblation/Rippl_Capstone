import React from 'react';
import { StyleSheet, View, Image, Dimensions, Text, Pressable } from 'react-native';
import { MasonryFlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import WavyTop from '../components/WavyTop';
import * as Haptics from 'expo-haptics';

type ImageItem = {
  id: string;
  source: any;
  width: number;
  height: number;
};

const welcomeImages: ImageItem[] = [
  { id: '1', source: require('../assets/interests/atv.jpg'), width: 800, height: 1000 },
  { id: '2', source: require('../assets/interests/basketball.jpg'), width: 800, height: 900 },
  { id: '3', source: require('../assets/interests/chalk.jpg'), width: 800, height: 800 },
  { id: '4', source: require('../assets/interests/fashion.jpg'), width: 800, height: 700 },
  { id: '5', source: require('../assets/interests/fishing.jpg'), width: 800, height: 600 },

  { id: '6', source: require('../assets/interests/hiking.jpg'), width: 800, height: 1100 },
  { id: '7', source: require('../assets/interests/laying.jpg'), width: 800, height: 950 },
  { id: '8', source: require('../assets/interests/meditating.jpg'), width: 800, height: 700 },
  { id: '9', source: require('../assets/interests/painting.jpg'), width: 800, height: 600 },
  { id: '10', source: require('../assets/interests/museum.jpg'), width: 800, height: 700 },
  { id: '11', source: require('../assets/interests/skateboarding.jpg'), width: 800, height: 1000 },
  { id: '12', source: require('../assets/interests/gaming.jpg'), width: 800, height: 1000 },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_MARGIN = 6;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function LandingScreen() {
  const router = useRouter();
  const renderItem = ({ item }: { item: ImageItem }) => {
    const aspectRatio = item.width / item.height;
    const calculatedHeight = ITEM_WIDTH / aspectRatio;

    return (
      <View style={[styles.itemContainer, { marginBottom: ITEM_MARGIN }]}>
        <Image
          source={item.source}
          style={[
            styles.image,
            {
              width: ITEM_WIDTH,
              height: calculatedHeight,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    );
  };

  const keyExtractor = (item: ImageItem) => item.id;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.backgroundContainer}>
        <MasonryFlashList
          data={welcomeImages}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={200}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>

      {/* BlurView Overlay */}
      <BlurView intensity={8} tint="dark" style={styles.blurOverlay} />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/rippl-logo.png')} style={styles.logo} />
        <Text style={styles.missionText}>Where Small Connections Make Big Waves.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.blurButtonContainer}>
          <View style={styles.buttonsRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/login');
              }}
              style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/signup');
              }}
              style={styles.button}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  listContainer: {
    paddingHorizontal: ITEM_MARGIN,
    paddingTop: ITEM_MARGIN,
  },
  itemContainer: {
    marginHorizontal: ITEM_MARGIN / 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 6,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  logoContainer: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: '90%',
    height: 200,
    resizeMode: 'contain',
  },
  missionText: {
    fontFamily: 'geistBold',
    color: '#DFF8EB',
    fontSize: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blurButtonContainer: {
    paddingHorizontal: 20,
    borderRadius: 30,
    top: 20,
    overflow: 'hidden',
    width: '90%',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    width: '40%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00AF9F',
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'geistSemiBold',
  },
});
