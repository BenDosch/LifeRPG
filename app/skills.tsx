import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SkillList } from '../src/components/skills/SkillList';

export default function SkillsScreen() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#a855f7" />
        </TouchableOpacity>
        <Text style={styles.heading}>Skills</Text>
      </View>
      <SkillList />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  heading: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
});
