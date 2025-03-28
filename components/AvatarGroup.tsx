import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';

interface AvatarGroupProps {
  avatars: ImageSourcePropType[];
  maxDisplay?: number;
  size?: number;
  totalAttendees?: number;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  maxDisplay = 4,
  size = 32,
  totalAttendees,
}) => {
  const displayAvatars = avatars.slice(0, maxDisplay);
  const remainingCount = avatars.length - maxDisplay;

  return (
    <View style={styles.avatarGroupContainer}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.avatarContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -size / 4,
              zIndex: displayAvatars.length - index,
            },
          ]}>
          <Image
            source={avatar}
            style={{
              width: size - 2,
              height: size - 2,
              borderRadius: (size - 2) / 2,
            }}
          />
        </View>
      ))}

      {remainingCount > 0 && (
        <View
          style={[
            styles.avatarContainer,
            styles.moreContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size / 4,
              zIndex: 0,
            },
          ]}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}

      {totalAttendees !== undefined && (
        <Text style={styles.attendeesText}>{totalAttendees} attendees</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'white',
    overflow: 'hidden',
  },
  moreContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  attendeesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default AvatarGroup;
