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
import { useRef, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type User = {
  name: string;
  interests: string[];
  bio?: string;
  picture?: any; // Can be URL string or require() result
  id?: string;
};

type MatchScreenProps = {
  matchedUser: User;
  currentUser: User;
  onClose: () => void;
  onStartChat: () => void;
};

const DEFAULT_USER_IMAGE = require('../assets/user.jpg');
const DEFAULT_MATCHED_USER_IMAGE = require('../assets/user2.jpg');

const MatchScreen = ({ matchedUser, currentUser, onClose, onStartChat }: MatchScreenProps) => {
  // Find shared interests between users
  const sharedInterests = matchedUser.interests
    .filter((interest) => 
      currentUser.interests && currentUser.interests.includes(interest)
    )
    .slice(0, 3);

  // If no shared interests, show some of the matched user's interests
  const interestsToShow =
    sharedInterests.length > 0 
      ? sharedInterests 
      : (matchedUser.interests || []).slice(0, 3);

  // Determine which images to use
  const currentUserImage = currentUser.picture || DEFAULT_USER_IMAGE;
  const matchedUserImage = matchedUser.picture || DEFAULT_MATCHED_USER_IMAGE;

  // Determine if images are static (require) or remote URLs
  const isCurrentUserImageUrl = typeof currentUserImage === 'string';
  const isMatchedUserImageUrl = typeof matchedUserImage === 'string';

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover">
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Feather name="x" size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.title}>You're Making Waves!</Text>

      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="default" style={styles.blurContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.bottomContent}>
                <View style={styles.interestsContainer}>
                  <Text style={styles.interestsTitle}>
                    {sharedInterests.length > 0 
                      ? `You and ${matchedUser.name} are both interested in`
                      : `${matchedUser.name} is interested in`}
                  </Text>

                  <View style={styles.interestTags}>
                    {interestsToShow.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.chatButton} onPress={onStartChat} activeOpacity={0.8}>
                <View style={styles.buttonContent}>
                  <Text style={styles.chatButtonText}>Jump In</Text>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={24}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.blurContainer, styles.androidBlurFallback]}>
            <View style={styles.contentContainer}>
              <View style={styles.bottomContent}>
                <View style={styles.interestsContainer}>
                  <Text style={styles.interestsTitle}>
                    {sharedInterests.length > 0 
                      ? `You and ${matchedUser.name} both enjoy these activities`
                      : `${matchedUser.name} enjoys these activities`}
                  </Text>

                  <View style={styles.interestTags}>
                    {interestsToShow.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.chatButton} onPress={onStartChat} activeOpacity={0.8}>
                <View style={styles.buttonContent}>
                  <Text style={styles.chatButtonText}>Jump In</Text>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={24}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.profileContainer}>
          <View style={styles.profileImagesContainer}>
            <View style={styles.profileImageLeft}>
              {isCurrentUserImageUrl ? (
                <Image
                  source={{ uri: currentUserImage }}
                  style={styles.profileImage}
                  borderRadius={100}
                />
              ) : (
                <Image
                  source={currentUserImage}
                  style={styles.profileImage}
                  borderRadius={100}
                />
              )}
            </View>
            <View style={styles.profileImageRight}>
              {isMatchedUserImageUrl ? (
                <Image
                  source={{ uri: matchedUserImage }}
                  style={styles.profileImage}
                  borderRadius={100}
                />
              ) : (
                <Image
                  source={matchedUserImage}
                  style={styles.profileImage}
                  borderRadius={100}
                />
              )}
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
    padding: 20,
    justifyContent: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    position: 'absolute',
  },
  bottomContent: {
    width: '100%',
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 60,
  },
  profileContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
    borderRadius: 100,
  },
  profileImageRight: {
    position: 'absolute',
    left: 185,
    bottom: 0,
    height: 80,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
    borderRadius: 100,
  },
  profileImage: {
    width: 80,
    height: 80,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 140,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 146, 55, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 18,
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  interestTagText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'geistSemiBold',
  },
});

export default MatchScreen;