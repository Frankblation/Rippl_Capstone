import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { EditProfileButton } from '~/components/profile/EditProfileButton';
import * as Haptics from 'expo-haptics';
import TabBarBackground from '~/components/ui/TabBarBackground';
import { Colors } from '~/constants/Colors';
import { useColorScheme } from '~/hooks/useColorScheme';
import { ChatButton } from '~/components/ChatButton';
import { AddUserButton } from '~/components/profile/AddUserButton';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <Feather name="search" size={24} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="add-post"
        options={{
          tabBarIcon: ({ color }) => <Feather name="plus" size={24} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="matching"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cards-outline" size={24} color={color} />
          ),
          headerShown: true,
          headerRight: () => <ChatButton />,
          headerTransparent: true,
          headerTitle: '',
        }}
        listeners={{
          tabPress: () => {
            Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="matched-users"
        options={{
          title: 'Matched Users',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
          headerShown: true,
          headerRight: () => <EditProfileButton />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.selectionAsync();
          },
        }}
      />
      <Tabs.Screen
        name="profile/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
