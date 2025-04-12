import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';
import { uploadImage, deleteImage, updateUser } from '~/utils/data';

interface SupabaseImageUploaderProps {
  userId: string;
  bucketName: string;
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string | null;
  placeholderLabel?: string;
  imageSize?: number;
  aspectRatio?: [number, number];
  folder?: string;
  updateUserProfile?: boolean; // Add new prop to control user profile updates
}

export default function SupabaseImageUploader({
  bucketName,
  userId,
  onUploadComplete,
  existingImageUrl = null,
  placeholderLabel = 'Upload Photo',
  imageSize = 100,
  aspectRatio = [1, 1],
  folder = '',
  updateUserProfile = false, // Default to false to prevent unintended profile updates
}: SupabaseImageUploaderProps) {
  const [image, setImage] = useState<string | null>(existingImageUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const pickImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setImage(selectedImageUri);
        await handleUpload(selectedImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUpload = async (imageUri: string): Promise<void> => {
    if (!userId) {
      Alert.alert('Authentication Error', 'Please sign in to upload images');
      return;
    }

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(imageUri, userId, bucketName, folder);

      // Delete the old image if it exists and is different
      if (existingImageUrl && existingImageUrl !== imageUrl) {
        await deleteImage(existingImageUrl, bucketName, folder);
      }

      // Only update the user profile if explicitly requested
      if (updateUserProfile) {
        await updateUser(userId, {
          image: imageUrl,
        });
      }

      // Call the callback to update the UI
      onUploadComplete(imageUrl);
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Upload Error', errorMessage);
      setImage(existingImageUrl ?? null);
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