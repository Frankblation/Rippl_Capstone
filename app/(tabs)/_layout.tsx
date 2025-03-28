import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="messaging"
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <Tabs.Screen
        name="matching"
        options={{
          tabBarLabel: 'Matching',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
