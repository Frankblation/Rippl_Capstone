import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

const BottomSheetTextInput = forwardRef<TextInput, TextInputProps>((props, ref) => {
  return <TextInput ref={ref} {...props} style={[styles.input, props.style]} />;
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minHeight: 40,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    color: '#000',
  },
});

export default BottomSheetTextInput;
