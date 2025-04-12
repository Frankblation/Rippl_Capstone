import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InterestChip {
  id: string;
  name: string;
}

interface InterestGridProps {
  interests: InterestChip[];
  chipStyle?: object;
  textStyle?: object;
}

const InterestGrid: React.FC<InterestGridProps> = ({ interests, chipStyle, textStyle }) => {
  return (
    <View style={styles.container}>
      {interests.map((interest) => (
        <View key={interest.id} style={[styles.chip, chipStyle]}>
          <Text style={[styles.chipText, textStyle]}>{interest.name}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#00AF9F',
    margin: 1,
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'medium',
  },
});

export default InterestGrid;
