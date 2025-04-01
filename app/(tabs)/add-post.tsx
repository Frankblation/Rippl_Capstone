import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import AddPostComponent from '../../components/AddPost';

export default function AddPostScreen() {
  return (
    <SafeAreaView className="w-full flex-1">
      <View className="w-full flex-1 bg-white">
        <AddPostComponent />
      </View>
    </SafeAreaView>
  );
}
