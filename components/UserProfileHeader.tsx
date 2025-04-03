import React from 'react';
import { StyleSheet, Image, Text, View, ImageSourcePropType, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedSensor,
  useAnimatedStyle,
  SensorType,
  AnimatedStyleProp,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const INTENSITY: number = 30;
const BORDER_RADIUS: number = 20;
const CARD_WIDTH: number = 300;
const CARD_HEIGHT: number = 330;

interface ProfileCardProps {
  profileImage?: ImageSourcePropType;
  username?: string;
  postCount?: number;
  friendCount?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profileImage = require('../assets/user.png'),
  username = 'Alex Johnson',
  postCount = 248,
  friendCount = 1432,
}) => {
  const animatedSensor = useAnimatedSensor(SensorType.ROTATION, {
    interval: 0,
  });

  const style: AnimatedStyleProp<ViewStyle> = useAnimatedStyle(() => {
    const { pitch, yaw, qy } = animatedSensor.sensor.value;

    const num: number = qy > 0 ? 30 : 50;
    const yawValue: number =
      qy > 0 ? num * 2.5 * Number(qy.toFixed(2)) : num * Number(qy.toFixed(2));
    const pitchValue: number = 26 * parseFloat(pitch.toFixed(2));

    return {
      transform: [{ translateX: yawValue }, { translateY: pitchValue }],
    };
  });

  return (
    <>
      <Image style={styles.imageStyle} source={profileImage} />
      <BlurView intensity={INTENSITY} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.animatedViewStyle, style]}>
        <Image style={{ flex: 1 }} source={profileImage} />

        <View style={styles.profileContainer}>
          <Text style={styles.username}>{username}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friendCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        <View style={styles.profilePictureContainer}>
          <Image style={styles.profilePicture} source={profileImage} />
        </View>
      </Animated.View>
    </>
  );
};

interface UserProfileHeaderProps {}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = () => {
  return (
    <View style={styles.headerContainer}>
      <ProfileCard />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS,
  },
  animatedViewStyle: {
    width: CARD_WIDTH + 20,
    height: CARD_HEIGHT + 20,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    paddingTop: 100,
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
  },
  profilePictureContainer: {
    position: 'absolute',
    alignItems: 'center',
    bottom: 120,
    zIndex: 10,
  },
  profilePicture: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'white',
  },
  username: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});
