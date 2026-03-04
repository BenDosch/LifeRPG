import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '../../store/projectStore';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../types';
import { formatDate, groupByDate } from '../../utils/date';

export function LogList() {
  const log = useProjectStore((s) => s.log);

  const sections = useMemo(() => {
    const grouped = groupByDate(log);
    return Object.keys(grouped)
      .sort((a, b) => (a > b ? -1 : 1))
      .map((date) => ({
        title: date,
        data: grouped[date],
      }));
  }, [log]);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={48} color="#1e1e2e" />
        <Text style={styles.emptyText}>No history yet</Text>
        <Text style={styles.emptySubtext}>Completed projects appear here</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={Platform.OS !== 'web'}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionDate}>{formatDate(section.title)}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <View
            style={[
              styles.diffDot,
              { backgroundColor: DIFFICULTY_COLORS[item.difficulty] },
            ]}
          />
          <View style={styles.entryContent}>
            <Text style={styles.entryName}>{item.projectName}</Text>
            <View style={styles.entryMeta}>
              <Text style={[styles.diffLabel, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
                {DIFFICULTY_LABELS[item.difficulty]}
              </Text>
              {item.skills.length > 0 && (
                <Text style={styles.skills}>{item.skills.join(', ')}</Text>
              )}
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{item.xpAwarded} XP</Text>
          </View>
        </View>
      )}
      stickySectionHeadersEnabled
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
  sectionHeader: {
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  sectionDate: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f0f18',
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryContent: { flex: 1 },
  entryName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  entryMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  diffLabel: { fontSize: 11, fontWeight: '600' },
  skills: { color: '#7c3aed', fontSize: 11 },
  xpBadge: {
    backgroundColor: '#7c3aed22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
});
