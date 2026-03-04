import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTierLabel, getTierColor } from '../../types';

interface DifficultyBadgeProps {
  value: number; // 1–100
}

export function DifficultyBadge({ value }: DifficultyBadgeProps) {
  const color = getTierColor(value);
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{getTierLabel(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
