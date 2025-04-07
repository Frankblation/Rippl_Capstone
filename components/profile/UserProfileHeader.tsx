import React from 'react';
import {
  StyleSheet,
  Image,
  Text,
  View,
  ImageSourcePropType,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';

const BORDER_RADIUS: number = 20;

interface ProfileCardProps {
  profileImage?: ImageSourcePropType;
  name?: string;
  postCount?: number;
  friendCount?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profileImage,
  name,
  postCount = 0,
  friendCount = 0,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const cardWidth = isLandscape ? width * 0.5 : width * 0.9;
  const cardHeight = isLandscape ? height * 0.8 : cardWidth * 1.1;
  const profilePicSize = Math.min(cardWidth * 0.55, 180);

  const dynamicStyles = StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: BORDER_RADIUS,
      overflow: 'hidden',
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
    },
    profilePicture: {
      width: profilePicSize,
      height: profilePicSize,
      borderRadius: profilePicSize / 2,
      borderWidth: Platform.OS === 'ios' ? 3 : 2,
      borderColor: 'white',
    },
    profileContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: Math.max(width * 0.03, 12),
      paddingTop: profilePicSize / 2 + 10,
      borderBottomLeftRadius: BORDER_RADIUS,
      borderBottomRightRadius: BORDER_RADIUS,
    },
    profilePictureContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      top: cardHeight / 2 - profilePicSize / 2,
      zIndex: 10,
    },
    username: {
      color: 'white',
      fontSize: Math.min(width * 0.05, 20),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
    },
    statNumber: {
      color: 'white',
      fontSize: Math.min(width * 0.045, 18),
      fontWeight: 'bold',
    },
    statLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: Math.min(width * 0.035, 14),
    },
  });

  return (
    <View style={dynamicStyles.cardContainer}>
      {/* Background Image */}
      <Image style={dynamicStyles.backgroundImage} source={profileImage} resizeMode="cover" />

      {/* Profile picture container - centered horizontally */}
      <View style={dynamicStyles.profilePictureContainer}>
        <Image style={dynamicStyles.profilePicture} source={profileImage} />
      </View>

      {/* Dark overlay for text */}
      <View style={dynamicStyles.profileContainer}>
        <Text style={dynamicStyles.username}>{name}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={dynamicStyles.statNumber}>{postCount}</Text>
            <Text style={dynamicStyles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={dynamicStyles.statNumber}>{friendCount.toLocaleString()}</Text>
            <Text style={dynamicStyles.statLabel}>Friends</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export interface UserProfileHeaderProps {
  name: string;
  profileImage: string;
  postsCount: number;
  friendsCount: number;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  name,
  profileImage,
  postsCount,
  friendsCount,
}) => {
  const statusBarHeight = Constants.statusBarHeight || 0;

  return (
    <View style={[styles.headerContainer, { paddingTop: statusBarHeight + 10 }]}>
      <ProfileCard
        name={name}
        profileImage={{ uri: profileImage }}
        postCount={postsCount}
        friendCount={friendsCount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});
