import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HudBar } from '../../src/components/hud/HudBar';
import { useTheme } from '../../src/theme/ThemeContext';

function TabIcon({
  name,
  focused,
  color,
  inactiveColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  inactiveColor: string;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={22}
      color={focused ? color : inactiveColor}
    />
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <HudBar />,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopColor: theme.borderDefault,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: theme.textDisabled,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        contentStyle: { backgroundColor: theme.bgPage },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quests',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="folder" focused={focused} color="#a855f7" inactiveColor={theme.textDisabled} />
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
            <TabIcon name="bag" focused={focused} color="#a855f7" inactiveColor={theme.textDisabled} />
          ),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'Character',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} color="#a855f7" inactiveColor={theme.textDisabled} />
          ),
        }}
      />
    </Tabs>
  );
}
