import React from 'react';
import { StyleSheet, View, Image, Dimensions, Text, Pressable } from 'react-native';
import { MasonryFlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import WavyTop from '../components/WavyTop';

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

export default function WelcomeScreen() {
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
      <View style={styles.blurOverlay} />
      <WavyTop />
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/rippl3.png')} style={styles.logo} />
        <Text style={styles.missionText}>Where small connections make big waves.</Text>
      </View>

      {/* Buttons Container 
      <View style={styles.buttonContainer}>
        <View style={styles.blurButtonContainer}>
          <View style={styles.buttonsRow}>
            <Pressable onPress={() => router.push('/login')} style={styles.button}>
              <Text style={styles.buttonText}>Log In</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/signup')} style={styles.button}>
              <Text style={styles.buttonText}>Sign up</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/(tabs)/home')} style={styles.button}>
              <Text style={styles.buttonText}>Go to app</Text>
            </Pressable>
          </View>
        </View>
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    fontFamily: 'Poppins',
    color: '#00A9A5',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blurButtonContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    overflow: 'hidden',
    width: '90%',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    height: 48,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3454B4', // teal-500 equivalent
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '500',
  },
});
