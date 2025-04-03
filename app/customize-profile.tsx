import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';

export default function CustomizeProfile() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

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

  const goNext = () => {
    router.replace('/create-interests');
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
          className="w-full items-center rounded-xl bg-teal-500 py-4">
          <Text className="text-lg font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
