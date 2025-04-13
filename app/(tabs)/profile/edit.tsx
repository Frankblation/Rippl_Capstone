'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Alert,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '~/components/providers/AuthProvider';
import { useUser } from '~/hooks/useUser';
import type { InterestsTable } from '~/utils/db';
import { useRouter } from 'expo-router';
import { LogOutButton } from '~/components/profile/LogOutButton';
import { invalidateAllFeedCaches } from '~/hooks/useFeed';
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
  const [newInterest, setNewInterest] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<InterestsTable[]>([]);
  const [availableInterests, setAvailableInterests] = useState<InterestsTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUpdated, setImageUpdated] = useState(false);

  const bioInputRef = useRef<TextInput>(null);
  const interestInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth();

  // Use our custom hook to get full user data
  const { user, refreshUser } = useUser(authUser?.id || null);

  // Dismiss dropdown when tapping outside
  useEffect(() => {
    const handleOutsideTouch = (e: TouchEvent) => {
      if (showSuggestions && interestInputRef.current) {
        // This is a simple check - in a real app you might want to check
        // if the tap is actually outside the dropdown area
        setShowSuggestions(false);
      }
    };

    // Add touchend listener to detect taps outside
    document.addEventListener('touchend', handleOutsideTouch);

    return () => {
      document.removeEventListener('touchend', handleOutsideTouch);
    };
  }, [showSuggestions]);

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
      invalidateAllFeedCaches();
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.buttonContainer}>
        <LogOutButton />
      </View>

      <ScrollView ref={scrollViewRef}>
        <View style={styles.content}>
          {/* Profile Image Section with improved spacing */}
          <View style={styles.imageSection}>
            {authUser?.id ? (
              <Suspense
                fallback={
                  <View style={styles.imagePlaceholder}>
                    <Text>Loading...</Text>
                  </View>
                }>
                <SupabaseImageUploader
                  bucketName="images"
                  userId={authUser.id}
                  onUploadComplete={(imageUrl) => {
                    setImage(imageUrl);
                    setImageUpdated(true);
                  }}
                  existingImageUrl={image}
                  placeholderLabel="Update Photo"
                  imageSize={128}
                  aspectRatio={[1, 1]}
                  folder="profiles"
                  updateUserProfile={true}
                />
              </Suspense>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="user" size={50} color="#9ca3af" />
                <Text style={styles.signInText}>Sign in to update photo</Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              keyboardType="default"
              placeholder="Enter your name"
              style={styles.input}
              returnKeyType="next"
              onSubmitEditing={() => bioInputRef.current?.focus()}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              ref={bioInputRef}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              keyboardType="default"
              multiline
              numberOfLines={4}
              style={styles.bioInput}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Interests</Text>

            <View style={styles.interestsContainer}>
              {userInterests.map((interest) => (
                <View
                  key={interest.id}
                  style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest.name}</Text>
                  <TouchableOpacity onPress={() => removeInterest(interest.id)}>
                    <Feather name="x" size={16} color="#00AF9F" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.interestInputContainer}>
              <View style={styles.interestInputWrapper}>
                <TextInput
                  ref={interestInputRef}
                  value={newInterest}
                  onChangeText={handleInterestInput}
                  placeholder="Add an interest"
                  style={styles.interestInput}
                  returnKeyType="done"
                  onFocus={() => {
                    if (newInterest.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onSubmitEditing={() => addInterest(newInterest)}
                />
                <TouchableOpacity onPress={() => addInterest(newInterest)}>
                  <Feather name="plus" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {/* Dropdown suggestions list */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={styles.dropdownContainer}>
                  <ScrollView
                    style={styles.dropdownList}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredSuggestions.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => selectSuggestion(item)}
                        style={styles.dropdownItem}>
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={saveProfile}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    padding: 24,
  },
  imageSection: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: 128,
    width: 128,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 64,
  },
  signInText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#00AF9F',
    marginRight: 4,
  },
  interestInputContainer: {
    position: 'relative',
    zIndex: 10, // Ensure dropdown appears above other content
  },
  interestInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
  },
  interestInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%', // Position just below the input
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4, // Small gap between input and dropdown
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 20,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#00AF9F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
