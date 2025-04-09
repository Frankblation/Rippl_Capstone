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
import { LogOutButton } from '~/components/profile/LogOutButton';
import { createContext, useContext, useState } from 'react';


// Create a simple context for the reload flag
interface TabsReloadContextType {
  reloadFlag: number;
  triggerReload: () => void;
}

const TabsReloadContext = createContext<TabsReloadContextType>({
  reloadFlag: 0,
  triggerReload: () => {},
});

// Custom hook to use the reload context
export const useTabsReload = () => {
  return useContext(TabsReloadContext);
};



export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const [reloadFlag, setReloadFlag] = useState(0);

  const triggerReload = () => {
    setReloadFlag(prev => prev + 1);
  };
  return (
    <TabsReloadContext.Provider value={{ reloadFlag, triggerReload }}>
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
          name="profile"
          options={{
            tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
            headerShown: false, // Handled in profile/_layout.tsx
          }}
          listeners={{
            tabPress: () => {
              Haptics.selectionAsync();
            },
          }}
        />
      </Tabs>
    </TabsReloadContext.Provider>
  );
}
