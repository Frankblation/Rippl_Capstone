import React from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

export default function ExploreScreen() {
  const [text, onChangeText] = React.useState('');
  return (
    <SafeAreaView className="flex-1  ">
      <View className="mx-4 h-12 flex-row items-center rounded-full border-2 border-black">
        <Feather name="search" size={24} color="black" className="ml-2" />
        <TextInput
          placeholder="Search posts..."
          value={text}
          onChangeText={onChangeText}
          className="ml-2 flex-1 text-black"
        />
      </View>
    </SafeAreaView>
  );
}
