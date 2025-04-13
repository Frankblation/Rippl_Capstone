'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Keyboard,
  Alert,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '~/components/providers/AuthProvider';
import { useUser } from '~/hooks/useUser';
import type { InterestsTable } from '~/utils/db';
import { useRouter } from 'expo-router';
import { LogOutButton } from '~/components/profile/LogOutButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { createUserInterest, updateUser, getAllInterests, deleteUserInterest } from '~/utils/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
const SupabaseImageUploader = React.lazy(() => import('~/components/SupabaseImageUploader'));

interface Interest {
  id: string;
  name: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [bio, setBio] = useState('');
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [availableInterests, setAvailableInterests] = useState<InterestsTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUpdated, setImageUpdated] = useState(false); // Track if image was updated

  const bioInputRef = useRef<TextInput>(null);

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user, refreshUser } = useUser(authUser?.id || null);

  // Fetch all available interests and user's current interests
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load all available interests from the database
        const interests = await getAllInterests();
        setAvailableInterests(interests);

        if (!user.isLoading && user.id) {
          // Set user profile data
          setName(user.name || '');
          setBio(user.description || '');
          setImage(user.image || null);

          // Get user interests if available
          if (user.interests && user.interests.length > 0) {
            const formattedInterests = user.interests
              .filter((interest) => interest.interests?.id && interest.interests?.name)
              .map((interest) => ({
                id: interest.interests!.id,
                name: interest.interests!.name,
              }));
            setUserInterests(formattedInterests);
          }
        }
      } catch (error) {
        console.error('Error loading interests:', error);
        Alert.alert('Error', 'Failed to load interests');
      }
    };

    fetchData();
  }, [user.id, user.interests, user.isLoading]);

  const addInterest = async (interest: InterestsTable) => {
    if (!user.id) return;

    // Check if user already has this interest
    if (!userInterests.some((ui) => ui.id === interest.id)) {
      try {
        // Add interest to user in the database
        await createUserInterest({
          user_id: user.id,
          interest_id: interest.id,
        });

        // Add to local state
        setUserInterests([
          ...userInterests,
          {
            id: interest.id,
            name: interest.name,
          },
        ]);
      } catch (error) {
        console.error('Error adding interest:', error);
        Alert.alert('Error', 'Failed to add interest');
      }
    }

    setShowInterestPicker(false);
  };

  const removeInterest = async (id: string) => {
    if (!user.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      // First remove from database
      await deleteUserInterest(user.id, id);

      // Then update local state if removal was successful
      setUserInterests(userInterests.filter((interest) => interest.id !== id));
    } catch (error) {
      console.error('Error removing interest:', error);
      Alert.alert('Error', 'Failed to remove interest');
    }
  };

  const saveProfile = async () => {
    if (!user.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setIsLoading(true);

    try {
      // Update user profile including the image field
      await updateUser(user.id, {
        name: name,
        description: bio,
        image: image || '', // Add this to ensure image is updated even if null
      });

      // Refresh the user data
      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out interests that the user already has
  const availableInterestsToAdd = availableInterests.filter(
    (interest) => !userInterests.some((ui) => ui.id === interest.id)
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="auto" />
        <View style={styles.buttonContainer}>
          <LogOutButton />
        </View>
        <ScrollView>
          <View className="p-6">
            {/* Profile Image Section with improved spacing */}
            <View className="mb-10 items-center justify-center">
              {authUser?.id ? (
                <Suspense
                  fallback={
                    <View className="h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                      <Text>Loading...</Text>
                    </View>
                  }>
                  <SupabaseImageUploader
                    bucketName="images"
                    userId={authUser.id}
                    onUploadComplete={(imageUrl) => {
                      setImage(imageUrl);
                      setImageUpdated(true); // Mark that the image was updated
                    }}
                    existingImageUrl={image}
                    placeholderLabel="Update Photo"
                    imageSize={128}
                    aspectRatio={[1, 1]}
                    folder="profiles"
                    updateUserProfile={true} // This is correct - profile images should update the user profile
                  />
                </Suspense>
              ) : (
                <View className="h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                  <Feather name="user" size={50} color="#9ca3af" />
                  <Text className="mt-2 text-sm text-gray-500">Sign in to update photo</Text>
                </View>
              )}
            </View>

            <View className="mb-6">
              <Text className="mb-2 font-semibold text-gray-700">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                keyboardType="default"
                placeholder="Enter your name"
                className="rounded-lg border border-gray-300 p-3 text-base"
                returnKeyType="next"
                onSubmitEditing={() => bioInputRef.current?.focus()}
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 font-semibold text-gray-700">Bio</Text>
              <TextInput
                ref={bioInputRef}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                keyboardType="default"
                multiline
                numberOfLines={4}
                className="min-h-[100px] rounded-lg border border-gray-300 p-3 text-base"
                textAlignVertical="top"
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 font-semibold text-gray-700">Interests</Text>

              <View className="mb-3 flex-row flex-wrap">
                {userInterests.map((interest) => (
                  <View
                    key={interest.id}
                    className="mb-2 mr-2 flex-row items-center rounded-full bg-[#E6F7F5] px-3 py-1">
                    <Text className="mr-1 text-[#00AF9F]">{interest.name}</Text>
                    <TouchableOpacity onPress={() => removeInterest(interest.id)}>
                      <Feather name="x" size={16} color="#00AF9F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Interest Dropdown Button */}
              <TouchableOpacity
                onPress={() => setShowInterestPicker(true)}
                className="flex-row items-center justify-between rounded-lg border border-gray-300 p-3">
                <Text className="text-base text-gray-500">Select an interest</Text>
                <Feather name="chevron-down" size={20} color="#4b5563" />
              </TouchableOpacity>

              {/* Interest Picker Modal */}
              <Modal
                visible={showInterestPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowInterestPicker(false)}>
                <View className="flex-1 justify-end bg-opacity-30">
                  <View className=" max-h-[70%] rounded-t-lg bg-white ">
                    <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                      <Text className="text-lg font-semibold">Select an Interest</Text>
                      <TouchableOpacity onPress={() => setShowInterestPicker(false)}>
                        <Feather name="x" size={24} color="#4b5563" />
                      </TouchableOpacity>
                    </View>

                    {availableInterestsToAdd.length > 0 ? (
                      <FlatList
                        data={availableInterestsToAdd}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => addInterest(item)}
                            className="border-b border-gray-100 p-4">
                            <Text className="text-base">{item.name}</Text>
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                          <View className="items-center p-4">
                            <Text className="text-gray-500">No more interests available</Text>
                          </View>
                        }
                      />
                    ) : (
                      <View className="items-center p-4">
                        <Text className="text-gray-500">No more interests available</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Modal>
            </View>

            <TouchableOpacity
              onPress={saveProfile}
              disabled={isLoading}
              className={`items-center rounded-lg bg-[#00AF9F] py-3 ${isLoading ? 'opacity-70' : ''}`}>
              <Text className="text-base font-semibold text-white">
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
});
