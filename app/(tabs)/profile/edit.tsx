'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Keyboard,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTabsReload } from '~/app/(tabs)/_layout';
import { useAuth } from '~/components/providers/AuthProvider';
import { useUser } from '~/hooks/useUser';
import { InterestsTable } from '~/utils/db';
import { useRouter } from 'expo-router';

import { createUserInterest, updateUser, getAllInterests } from '~/utils/data';
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
  const [newInterest, setNewInterest] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<InterestsTable[]>([]);
  const [availableInterests, setAvailableInterests] = useState<InterestsTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { triggerReload } = useTabsReload();
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

  const handleInterestInput = (text: string) => {
    setNewInterest(text);

    if (text.length > 0) {
      const filtered = availableInterests.filter(
        (interest) =>
          interest.name.toLowerCase().includes(text.toLowerCase()) &&
          !userInterests.some((ui) => ui.id === interest.id)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addInterest = async (interestName: string) => {
    if (!interestName.trim() || !user.id) return;

    // Find if this interest exists in our available interests
    const existingInterest = availableInterests.find(
      (int) => int.name.toLowerCase() === interestName.toLowerCase()
    );

    if (existingInterest) {
      // Check if user already has this interest
      if (!userInterests.some((ui) => ui.id === existingInterest.id)) {
        try {
          // Add interest to user in the database
          await createUserInterest({
            user_id: user.id,
            interest_id: existingInterest.id,
          });

          // Add to local state
          setUserInterests([
            ...userInterests,
            {
              id: existingInterest.id,
              name: existingInterest.name,
            },
          ]);
        } catch (error) {
          console.error('Error adding interest:', error);
          Alert.alert('Error', 'Failed to add interest');
        }
      }
    } else {
      Alert.alert('Interest not found', 'Please select an interest from the suggestions');
    }

    setNewInterest('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const removeInterest = (id: string) => {
    // In a real implementation, you would also remove from the database
    // For now, just removing from local state
    setUserInterests(userInterests.filter((interest) => interest.id !== id));
  };

  const selectSuggestion = (interest: InterestsTable) => {
    addInterest(interest.name);
  };

  const saveProfile = async () => {
    if (!user.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setIsLoading(true);

    try {
      // Update user profile
      await updateUser(user.id, {
        name: name,
        description: bio,
        // You'd need to handle image upload separately
        // image: uploadedImageUrl
      });

      // Refresh the user data
      if (refreshUser) {
        await refreshUser();
      }

      // Trigger reload for other tabs
      triggerReload();

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

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="p-6">
          <View className="mb-6 items-center">
            {authUser?.id ? (
              <Suspense fallback={<Text>Loading uploader...</Text>}>
                <SupabaseImageUploader
                  bucketName="images"
                  userId={authUser.id}
                  onUploadComplete={(imageUrl) => {
                    // Simply update the image state without handling deletion
                    setImage(imageUrl);
                  }}
                  existingImageUrl={image}
                  placeholderLabel="Update Photo"
                  imageSize={128}
                  aspectRatio={[1, 1]}
                  folder="profiles"
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

            <View className="relative">
              <View className="flex-row items-center rounded-lg border border-gray-300 p-2">
                <TextInput
                  value={newInterest}
                  onChangeText={handleInterestInput}
                  placeholder="Add an interest"
                  className="flex-1 p-1 text-base"
                  returnKeyType="done"
                  onSubmitEditing={() => addInterest(newInterest)}
                />
                <TouchableOpacity onPress={() => addInterest(newInterest)}>
                  <Feather name="plus" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <View className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 rounded-lg border border-gray-300 bg-white">
                  <FlatList
                    data={filteredSuggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => selectSuggestion(item)}
                        className="border-b border-gray-200 p-3">
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
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
    </View>
  );
}
