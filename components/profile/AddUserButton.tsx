import { Pressable, StyleProp, ViewStyle } from 'react-native';

import Feather from '@expo/vector-icons/Feather';

type Props = {
  style?: StyleProp<ViewStyle>;
};
export function AddUserButton({ style }: Props) {
  return (
    <Pressable style={style}>
      <Feather
        name="user-plus"
        size={24}
        color="black"
        style={{ marginRight: 16, paddingBottom: 22 }}
      />
    </Pressable>
  );
}
