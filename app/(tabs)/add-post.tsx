import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, StyleSheet, Platform, View } from 'react-native';
import AddPostComponent from '../../components/AddPost';

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  title: {
    fontSize: 26,
    fontFamily: 'SFProDisplayBold',
    paddingVertical: 20,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
        fontWeight: 'bold',
      },
    }),
  },
});

const AddPostScreen = () => {
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <Text style={styles.title}>Add New Post</Text>
        <AddPostComponent />
      </View>
    </SafeAreaView>
  );
};

export default AddPostScreen;
