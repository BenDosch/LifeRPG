import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogList } from '../../src/components/log/LogList';

export default function LogScreen() {
  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Activity Log</Text>
        <LogList />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { flex: 1 },
  heading: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
