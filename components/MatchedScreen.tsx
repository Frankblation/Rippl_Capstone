import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Feather from '@expo/vector-icons/Feather';
import LottieView from 'lottie-react-native';
import { useRef, useEffect } from 'react';

type User = {
  name: string;
  interests: string[];
  bio?: string;
  picture?: string;
};

type MatchScreenProps = {
  matchedUser: User;
  currentUser: User;
  onClose: () => void;
  onStartChat: () => void;
};

const MatchScreen = ({ matchedUser, currentUser, onStartChat }: MatchScreenProps) => {
  const sharedInterests = matchedUser.interests
    .filter((interest) => currentUser.interests.includes(interest))
    .slice(0, 3);

  const interestsToShow =
    sharedInterests.length > 0 ? sharedInterests : matchedUser.interests.slice(0, 3);

  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover">
      <Text style={styles.title}>You're Making Waves!</Text>

      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="default" style={styles.blurContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.bottomContent}>
                <View style={styles.interestsContainer}>
                  <Text style={styles.interestsTitle}>
                    You and {matchedUser.name} are both interested in
                  </Text>

                  <View style={styles.interestTags}>
                    {interestsToShow.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.chatContainer}>
                  <View style={styles.buttonWrapper}>
                    <LottieView
                      ref={animationRef}
                      source={require('../assets/animations/orange-ripple.json')}
                      style={styles.rippleAnimation}
                      loop={true}
                      autoPlay={true}
                    />
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={onStartChat}
                      activeOpacity={0.8}>
                      <Text style={styles.chatButtonText}>Let's Go</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.blurContainer, styles.androidBlurFallback]}>
            <View style={styles.contentContainer}>
              <View style={styles.bottomContent}>
                <View style={styles.interestsContainer}>
                  <Text style={styles.interestsTitle}>
                    You and {matchedUser.name} both enjoy these activities
                  </Text>

                  <View style={styles.interestTags}>
                    {interestsToShow.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.buttonWrapper}>
                  <LottieView
                    ref={animationRef}
                    source={require('../assets/animations/orange-ripple.json')}
                    style={styles.rippleAnimation}
                    loop={true}
                    autoPlay={true}
                  />
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={onStartChat}
                    activeOpacity={0.8}>
                    <Text style={styles.chatButtonText}>Let's Go</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.profileContainer}>
          <View style={styles.profileImagesContainer}>
            <View style={styles.profileImageLeft}>
              <Image
                source={require('../assets/user.jpg')}
                style={styles.profileImage}
                borderRadius={100}
              />
            </View>
            <View style={styles.profileImageRight}>
              <Image
                source={require('../assets/user2.jpg')}
                style={styles.profileImage}
                borderRadius={100}
              />
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 100,
    justifyContent: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: 'geistBold',
    textAlign: 'center',
    color: 'white',
    zIndex: 3,
    marginTop: 100,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'geistMedium',
    textAlign: 'center',
    color: 'white',
    zIndex: 3,
    marginTop: 8,
    marginHorizontal: 40,
  },
  blurContainer: {
    position: 'absolute',
    top: '15%',
    left: 40,
    right: 40,
    bottom: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  androidBlurFallback: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  contentContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 30,
  },
  bottomContent: {
    width: '100%',
    marginTop: 'auto',
    alignItems: 'center',
  },
  profileContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  profileImagesContainer: {
    position: 'relative',
    height: 160,
    width: 260,
  },
  profileImageLeft: {
    position: 'absolute',
    right: 185,
    top: 0,
    height: 80,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageRight: {
    position: 'absolute',
    left: 185,
    bottom: 0,
    height: 80,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 200,
    height: 200,
  },
  chatContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  rippleAnimation: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
  chatButton: {
    width: 90,
    height: 90,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'geistBold',
  },
  interestsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  interestsTitle: {
    fontSize: 18,
    fontFamily: 'geistMedium',
    marginBottom: 16,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  interestTag: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    marginHorizontal: 4,
    marginBottom: 8,
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(243, 146, 55, 0.3)',
    borderWidth: 2,
  },
  interestTagText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'geistSemiBold',
  },
});

export default MatchScreen;
