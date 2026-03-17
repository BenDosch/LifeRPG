import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'not_determined' | 'unavailable'> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return 'unavailable';
    const perm = Notification.permission;
    if (perm === 'granted') return 'granted';
    if (perm === 'denied') return 'denied';
    return 'not_determined';
  } else {
    try {
      const { getFirebaseMessaging } = await import('../lib/firebase');
      const messaging = await getFirebaseMessaging();
      if (!messaging) return 'unavailable';
      const status = await (messaging as any).hasPermission();
      // 1 = AUTHORIZED, 2 = PROVISIONAL → granted; 0 = NOT_DETERMINED; else denied
      if (status === 1 || status === 2) return 'granted';
      if (status === 0) return 'not_determined';
      return 'denied';
    } catch {
      return 'unavailable';
    }
  }
}

export function NotificationPermissionBanner() {
  const theme = useTheme();
  const [permission, setPermission] = useState<string | null>(null);

  useEffect(() => {
    checkNotificationPermission().then(setPermission);
  }, []);

  if (permission !== 'denied') return null;

  return (
    <View style={[styles.banner, { backgroundColor: '#7f1d1d22', borderColor: '#dc262644' }]}>
      <Ionicons name="notifications-off-outline" size={16} color="#dc2626" />
      <Text style={styles.text}>
        Notifications are blocked. Enable them in your device/browser settings to receive alerts.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  text: {
    flex: 1,
    color: '#dc2626',
    fontSize: 12,
    lineHeight: 18,
  },
});
