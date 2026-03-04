import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SkillList } from '../../src/components/skills/SkillList';

export default function SkillsScreen() {
  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Skills</Text>
        <SkillList />
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
