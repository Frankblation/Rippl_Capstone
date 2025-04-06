import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Swipe from '~/components/Swiping';
import { ChatButton } from '~/components/ChatButton';

export default function App() {
  return (
    <SafeAreaView className="flex-1">
      <View style={styles.container}>
        <Text style={styles.title}>Build Community Around</Text>
        <Text style={styles.sharedTitle}>Shared Interests</Text>

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
    fontFamily: 'geistBold',
    fontSize: 28,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  sharedTitle: {
    fontFamily: 'bubbles',
    fontSize: 42,
    paddingTop: 0,
    paddingHorizontal: 20,
  },
});
