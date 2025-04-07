// ~/components/SearchBar.tsx
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SearchBar } from '@rneui/themed';

interface SearchingBarProps {
  placeholder?: string;
  onSearch?: (text: string) => void;
}

const SearchingBar: React.FC<SearchingBarProps> = ({ placeholder = 'Search', onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <SearchBar
      placeholder={placeholder}
      onChangeText={handleSearch}
      value={searchQuery}
      onClear={clearSearch}
      containerStyle={styles.containerStyle}
      inputContainerStyle={styles.inputContainerStyle}
      inputStyle={styles.inputStyle}
      platform="default"
    />
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    padding: 0,
    width: '100%',
    height: '100%',
  },
  inputContainerStyle: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    height: '100%',
  },
  inputStyle: {
    fontSize: 16,
    color: '#000',
  },
});

export default SearchingBar;
