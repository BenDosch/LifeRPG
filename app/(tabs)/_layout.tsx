import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HudBar } from '../../src/components/hud/HudBar';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={22}
      color={focused ? '#a855f7' : '#475569'}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <HudBar />,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: styles.tabLabel,
        contentStyle: { backgroundColor: '#0a0a0f' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quests',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="folder" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bag" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Character',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#12121a',
    borderTopColor: '#1e1e2e',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
