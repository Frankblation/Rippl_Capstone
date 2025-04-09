import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '~/utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import SupabaseImageUploader from '~/components/SupabaseImageUploader';

import { updateUser } from '~/utils/data';

export default function CustomizeProfileScreen() {
  const router = useRouter();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get the current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    getCurrentUser();
  }, []);

  const handleImageUploaded = (imageUrl: string) => {
    setProfileImageUrl(imageUrl);
  };

  const goNext = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }

    if (!userId) {
      Alert.alert('Authentication Error', 'Please sign in to update your profile');
      return;
    }

    try {
      setIsLoading(true);

      // Update the user profile using db function
      await updateUser(userId, {
        name: name,
        image: profileImageUrl || `https://ui-avatars.com/api/?name=${name}`,
        description: bio,
      });

      // Navigate to the next screen on success
      router.replace('/create-categories');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'There was a problem updating your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center px-6 py-12">
        <Text className="mb-8 text-3xl font-bold">Customize Your Profile</Text>

        <View className="mb-8 items-center">
          {userId ? (
            <SupabaseImageUploader
              bucketName="images"
              userId={userId}
              onUploadComplete={handleImageUploaded}
              existingImageUrl={profileImageUrl}
              placeholderLabel="Upload Photo"
              imageSize={128} // 32 * 4 = 128px to match your h-32 w-32
              aspectRatio={[1, 1]}
              folder={'profiles'}
            />
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Name</Text>
          <TextInput
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            style={{ textAlignVertical: 'center', minHeight: 50 }}
          />
        </View>

        <View className="mb-8">
          <Text className="mb-2 font-medium text-gray-700">Bio</Text>
          <TextInput
            className="h-32 w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={goNext}
          disabled={isLoading}
          className={`w-full items-center rounded-xl ${isLoading ? 'bg-[#00AF9F]' : 'bg-[#00AF9F]'} py-4`}>
          <Text className="text-lg font-semibold text-white">
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
