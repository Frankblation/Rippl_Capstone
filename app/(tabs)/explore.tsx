import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchingBar from '~/components/SearchBar';

export default function ExploreScreen() {
  const handleSearch = (text: string) => {
    console.log('Searching for:', text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.searchContainer}>
        <SearchingBar placeholder="Search" onSearch={handleSearch} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    marginHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
 