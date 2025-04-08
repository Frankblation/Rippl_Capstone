import { Stack } from 'expo-router';
import { EditProfileButton } from '~/components/profile/EditProfileButton';
import { AddUserButton } from '~/components/profile/AddUserButton';
import { LogOutButton } from '~/components/profile/LogOutButton';

export default function ProfileStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Profile',
          headerRight: () => <EditProfileButton />,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit My Profile',
          headerRight: () => <LogOutButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'User Profile',
          headerRight: () => <AddUserButton />,
        }}
      />
    </Stack>
  );
}
