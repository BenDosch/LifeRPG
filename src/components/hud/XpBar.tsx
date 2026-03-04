import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useXpProgress, useLevel } from '../../store/characterStore';

export function XpBar() {
  const { progress, total } = useXpProgress();
  const level = useLevel();
  const ratio = Math.min(1, Math.max(0, progress / total));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Character LV {level}</Text>
        <Text style={styles.progress}>
          {progress} / {total} XP
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` as any }]} />
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
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progress: {
    color: '#94a3b8',
    fontSize: 11,
  },
  track: {
    height: 6,
    backgroundColor: '#1e1e2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
});
