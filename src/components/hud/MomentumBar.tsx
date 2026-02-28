import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProfileStore } from '../../store/profileStore';

export function MomentumBar() {
  const momentum = useProfileStore((s) => s.momentum);
  const ratio = Math.min(1, Math.max(0, momentum / 100));

  const color =
    momentum >= 80 ? '#06b6d4' : momentum >= 40 ? '#0ea5e9' : '#1e3a4a';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>MOMENTUM</Text>
        <Text style={[styles.value, { color }]}>{Math.round(momentum)}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${ratio * 100}%` as any, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 4,
    backgroundColor: '#1e1e2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
