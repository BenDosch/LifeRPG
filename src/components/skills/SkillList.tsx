import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '../../store/projectStore';
import { DIFFICULTY_COLORS } from '../../types';

interface SkillStat {
  name: string;
  count: number;
  xp: number;
  recentDifficulty: string;
}

export function SkillList() {
  const log = useProjectStore((s) => s.log);

  const stats = useMemo(() => {
    const map = new Map<string, SkillStat>();
    for (const entry of log) {
      for (const skill of entry.skills) {
        const existing = map.get(skill);
        if (existing) {
          existing.count += 1;
          existing.xp += entry.xpAwarded;
        } else {
          map.set(skill, {
            name: skill,
            count: 1,
            xp: entry.xpAwarded,
            recentDifficulty: entry.difficulty,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.xp - a.xp);
  }, [log]);

  if (stats.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="flash-outline" size={48} color="#1e1e2e" />
        <Text style={styles.emptyText}>No skills yet</Text>
        <Text style={styles.emptySubtext}>
          Complete projects with skills to see them here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stats}
      keyExtractor={(item) => item.name}
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillStat}>
              {item.count} project{item.count !== 1 ? 's' : ''} · {item.xp} XP
            </Text>
          </View>
          <View style={[styles.xpBadge]}>
            <Text style={styles.xpText}>{item.xp} XP</Text>
          </View>
        </View>
      )}
      removeClippedSubviews={Platform.OS !== 'web'}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 40,
  },
  emptyText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#334155', fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rank: {
    width: 32,
    alignItems: 'center',
  },
  rankText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  info: { flex: 1 },
  skillName: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  skillStat: { color: '#64748b', fontSize: 12, marginTop: 2 },
  xpBadge: {
    backgroundColor: '#7c3aed22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#1e1e2e', marginHorizontal: 16 },
});
