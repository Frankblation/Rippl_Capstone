'use client';

import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Input } from '@rneui/base';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

interface ProfileData {
  name: string;
  image: string | null;
  bio: string;
}

const mockUser = {
  id: '123',
  name: 'John Doe',
  image: 'https://randomuser.me/api/portraits/men/32.jpg',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
};

export default function EditProfile({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    image: null,
    bio: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setProfileData({
          name: mockUser.name,
          image: mockUser.image,
          bio: mockUser.bio,
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      }
    };

    loadData();
  }, []);

  const handleUpdateProfile = async () => {
    // Validate inputs
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Profile updated with:', profileData);

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const selectedImage = result.assets[0];

        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setProfileData((prev) => ({
            ...prev,
            image: selectedImage.uri,
          }));
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
          console.error(error);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              accessibilityLabel="Change profile picture"
              accessibilityHint="Opens image picker to select a new profile photo">
              {profileData.image ? (
                <Image
                  source={{ uri: profileData.image }}
                  style={styles.profileImage}
                  contentFit="cover"
                  transition={300}
                  accessibilityLabel="Profile picture"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>{profileData.name.charAt(0) || 'U'}</Text>
                </View>
              )}

              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>Edit</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <Input
                value={profileData.name}
                onChangeText={(text) => setProfileData((prev) => ({ ...prev, name: text }))}
                placeholder="Your name"
                containerStyle={styles.inputWrapper}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={styles.inputStyle}
                returnKeyType="next"
                autoCapitalize="words"
                accessibilityLabel="Name input field"
              />

              <Text style={styles.label}>Bio</Text>
              <Input
                value={profileData.bio}
                onChangeText={(text) => setProfileData((prev) => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                containerStyle={styles.inputWrapper}
                inputContainerStyle={[styles.inputContainerStyle, styles.bioInput]}
                inputStyle={styles.inputStyle}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Bio input field"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                disabled={loading}
                buttonStyle={styles.saveButton}
                titleStyle={styles.saveButtonText}
                disabledStyle={styles.disabledButton}
                accessibilityLabel="Save profile changes"
                accessibilityHint="Saves your profile information"
              />

              <Button
                title="Cancel"
                onPress={() => router.push('/profile/index')}
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelButtonText}
                accessibilityLabel="Cancel editing"
                accessibilityHint="Discards changes and returns to previous screen"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#a0a0a0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00AF9F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  editBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  inputContainerStyle: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
  },
  bioInput: {
    minHeight: 100,
  },
  inputStyle: {
    fontSize: 16,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    fontFamily: 'geistBold',
    marginBottom: 8,
    marginLeft: 10,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  saveButton: {
    backgroundColor: '#00AF9F',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#b3d1ff',
  },
  cancelButton: {
    borderColor: '#00AF9F',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#00AF9F',
    fontFamily: 'geistBold',
    fontSize: 16,
  },
});
