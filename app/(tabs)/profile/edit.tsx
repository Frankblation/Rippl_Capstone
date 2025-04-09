'use client';

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import SupabaseImageUploader from '~/components/SupabaseImageUploader';
import { useAuth } from '~/components/providers/AuthProvider';

// Sample interests for autocomplete
const SAMPLE_INTERESTS = [
  'Photography',
  'Reading',
  'Cooking',
  'Hiking',
  'Travel',
  'Music',
  'Movies',
  'Gaming',
  'Art',
  'Sports',
  'Technology',
  'Fashion',
  'Fitness',
  'Writing',
  'Dancing',
  'Yoga',
];

interface Interest {
  id: string;
  name: string;
}

export default function EditProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const bioInputRef = useRef<TextInput>(null);

  const { user: authUser } = useAuth();

  const handleInterestInput = (text: string) => {
    setNewInterest(text);
    if (text.length > 0) {
      const filtered = SAMPLE_INTERESTS.filter((interest) =>
        interest.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addInterest = (interest: string) => {
    if (interest.trim() === '') return;

    // Check if interest already exists
    if (!interests.some((item) => item.name.toLowerCase() === interest.toLowerCase())) {
      setInterests([...interests, { id: Date.now().toString(), name: interest }]);
    }

    setNewInterest('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const removeInterest = (id: string) => {
    setInterests(interests.filter((interest) => interest.id !== id));
  };

  const selectSuggestion = (suggestion: string) => {
    addInterest(suggestion);
  };

  const saveProfile = () => {
    // Here you would implement the logic to save the profile
    console.log({ name, bio, interests, image });
    alert('Profile saved successfully!');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="p-6">
          <View className="mb-6 items-center">
            {authUser?.id ? (
              <SupabaseImageUploader
                bucketName="images"
                userId={authUser.id}
                onUploadComplete={(imageUrl) => {
                  setImage(imageUrl);
                }}
                existingImageUrl={image}
                placeholderLabel="Update Photo"
                imageSize={128}
                aspectRatio={[1, 1]}
                folder="profiles"
              />
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
              multiline
              numberOfLines={4}
              className="min-h-[100px] rounded-lg border border-gray-300 p-3 text-base"
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 font-semibold text-gray-700">Interests</Text>

            <View className="mb-3 flex-row flex-wrap">
              {interests.map((interest) => (
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
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => selectSuggestion(item)}
                        className="border-b border-gray-200 p-3">
                        <Text>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={saveProfile}
            className="items-center rounded-lg bg-[#00AF9F] py-3">
            <Text className="text-base font-semibold text-white">Save Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
