import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.hudSafe}>
        <HudBar />
      </SafeAreaView>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#a855f7',
          tabBarInactiveTintColor: '#475569',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Projects',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="folder" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            title: 'Skills',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="flash" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="list" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="person" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  hudSafe: { backgroundColor: '#12121a' },
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
