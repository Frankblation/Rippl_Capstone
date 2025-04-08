import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';
import { uploadProfileImage } from '~/utils/data';

interface SupabaseImageUploaderProps {
  userId: string;
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string | null;
  placeholderLabel?: string;
  imageSize?: number;
  aspectRatio?: [number, number];
}

export default function SupabaseImageUploader({
  userId,
  onUploadComplete,
  existingImageUrl = null,
  placeholderLabel = 'Upload Photo',
  imageSize = 100,
  aspectRatio = [1, 1],
}: SupabaseImageUploaderProps) {
  const [image, setImage] = useState<string | null>(existingImageUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Request permissions and open the image picker
  const pickImage = async (): Promise<void> => {
    try {
      // Request permission if needed
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        // Set the image locally for preview
        setImage(selectedImageUri);

        // Start the upload process
        await handleUpload(selectedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle the upload using the utility function
  const handleUpload = async (imageUri: string): Promise<void> => {
    if (!userId) {
      Alert.alert('Authentication Error', 'Please sign in to upload images');
      return;
    }

    try {
      setIsUploading(true);
      
      // Use the utility function from data.ts
      const imageUrl = await uploadProfileImage(imageUri, userId);
      
      // Call the callback with the URL
      onUploadComplete(imageUrl);
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Error', errorMessage);
      
      // Revert to previous image if it exists
      if (existingImageUrl) {
        setImage(existingImageUrl);
      } else {
        setImage(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="items-center">
      <TouchableOpacity onPress={pickImage} disabled={isUploading} className="relative mb-2">
        {image ? (
          <>
            <Image
              source={{ uri: image }}
              className="rounded-full"
              style={{ width: imageSize, height: imageSize }}
            />
            {isUploading && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black bg-opacity-30">
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          </>
        ) : (
          <View
            className="items-center justify-center rounded-full bg-gray-200"
            style={{ width: imageSize, height: imageSize }}>
            <Feather name="camera" size={imageSize / 4} color="#9ca3af" />
            {isUploading && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black bg-opacity-30">
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={pickImage} disabled={isUploading}>
        <Text className="font-medium text-teal-500">
          {isUploading ? 'Uploading...' : placeholderLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}