import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Swipe from '~/components/Swiping';

export default function App() {
  return (
    <SafeAreaView className="flex-1">
      <View style={styles.container}>
        <Text style={styles.title}>Connect Through Shared Interests</Text>
        <Swipe />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontFamily: 'SFProTextBold',
    fontSize: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});
