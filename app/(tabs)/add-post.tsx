import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import AddPostComponent from '../../components/AddPost';
import { Container } from '~/components/Container';

export default function AddPostScreen() {
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Text style={styles.title}>Add a new post</Text>
        <AddPostComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'SFProDisplayBold',
    marginHorizontal: 18,
    paddingVertical: 20,
  },
});
