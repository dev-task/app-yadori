import { Tabs } from 'expo-router'
import { Home, Search, Plus, User } from '@expo/vector-icons/Feather'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1db954',
        tabBarInactiveTintColor: '#727272',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#404040',
        },
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}