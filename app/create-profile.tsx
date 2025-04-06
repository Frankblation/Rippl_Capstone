import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import * as FileSystem from 'expo-file-system';
import { supabase } from '~/utils/supabase';

import { updateUser } from '~/utils/data';

export default function CustomizeProfile() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPassword, setUserPassword] = useState<string | null>(null);

  // Get the current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        
        // Optionally fetch the current user data to pre-fill the form
        const { data: userData } = await supabase
          .from('users')
          .select('email, name, description')
          .eq('id', data.user.id)
          .single();
          
        if (userData) {
          setUserEmail(userData.email);
          setName(userData.name || '');
          setBio(userData.description || '');
          // You might also want to fetch and display the current profile image
        }
      }
    };
    
    getCurrentUser();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const goNext = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter your name");
      return;
    }

    if (!userId || !userEmail) {
      Alert.alert("Authentication Error", "Please sign in to update your profile");
      return;
    }

    try {
      setIsLoading(true);
      
      // Handle image upload if an image is selected
      let imageUrl = null;
      if (image) {
        // For Supabase Storage approach:
        const fileExt = image.split('.').pop();
        const filePath = `${userId}-${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('profile-images')
          .upload(filePath, await FileSystem.readAsStringAsync(image, {
            encoding: FileSystem.EncodingType.Base64
          }), {
            contentType: `image/${fileExt}`
          });
          
        if (error) {
          throw new Error('Error uploading image: ' + error.message);
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);
          
        imageUrl = urlData.publicUrl;
      }
      
      // Update the user profile using your existing function
      await updateUser(userId, {
        email: userEmail,
        password: userPassword || '', // This might need adjustment based on your auth flow
        name: name,
        image: imageUrl || '',
        description: bio,
      });
      
      // Navigate to the next screen on success
      router.replace('/create-interests');
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert(
        "Error", 
        "There was a problem updating your profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-12">
        <Text className="mb-8 text-3xl font-bold">Customize Your Profile</Text>

        <View className="mb-8 items-center">
          <TouchableOpacity onPress={pickImage} className="mb-2">
            {image ? (
              <Image source={{ uri: image }} className="h-32 w-32 rounded-full" />
            ) : (
              <View className="h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                <Feather name="camera" size={24} color="#9ca3af" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text className="font-medium text-teal-500">Upload Photo</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Name</Text>
          <TextInput
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
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
          className={`w-full items-center rounded-xl ${isLoading ? 'bg-teal-300' : 'bg-teal-500'} py-4`}>
          <Text className="text-lg font-semibold text-white">
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
