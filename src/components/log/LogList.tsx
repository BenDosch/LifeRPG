import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuestStore } from '../../store/questStore';
import { getTierColor, getTierLabel, LogEntry } from '../../types';
import { formatDate, groupByDate } from '../../utils/date';
import { SkillChip } from '../shared/SkillChip';

type ListItem =
  | { type: 'header'; date: string; count: number; totalXP: number }
  | { type: 'entry'; entry: LogEntry };

export function LogList() {
  const log = useQuestStore((s) => s.log);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const sections = useMemo(() => {
    const grouped = groupByDate(log);
    return Object.keys(grouped)
      .sort((a, b) => (a > b ? -1 : 1))
      .map((date) => ({ title: date, data: grouped[date] }));
  }, [log]);

  // Default: only the most recent day is expanded
  useEffect(() => {
    if (!initialized && sections.length > 0) {
      setExpandedDates(new Set([sections[0].title]));
      setInitialized(true);
    }
  }, [sections, initialized]);

  const flatData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    for (const section of sections) {
      const totalXP = section.data.reduce((sum, e) => sum + e.xpAwarded, 0);
      items.push({ type: 'header', date: section.title, count: section.data.length, totalXP });
      if (expandedDates.has(section.title)) {
        for (const entry of section.data) {
          items.push({ type: 'entry', entry });
        }
      }
    }
    return items;
  }, [sections, expandedDates]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const allDates = sections.map((s) => s.title);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={48} color="#1e1e2e" />
        <Text style={styles.emptyText}>No history yet</Text>
        <Text style={styles.emptySubtext}>Completed quests appear here</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flatData}
      keyExtractor={(item) =>
        item.type === 'header' ? `h-${item.date}` : `e-${item.entry.id}`
      }
      removeClippedSubviews={Platform.OS !== 'web'}
      ListHeaderComponent={
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setExpandedDates(new Set(allDates))}>
            <Ionicons name="chevron-down" size={13} color="#64748b" />
            <Text style={styles.controlText}>Expand all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setExpandedDates(new Set())}>
            <Ionicons name="chevron-up" size={13} color="#64748b" />
            <Text style={styles.controlText}>Collapse all</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => {
        if (item.type === 'header') {
          const expanded = expandedDates.has(item.date);
          return (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleDate(item.date)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={expanded ? 'chevron-down' : 'chevron-forward'}
                size={14}
                color="#475569"
              />
              <Text style={styles.sectionDate}>{formatDate(item.date)}</Text>
              <View style={styles.sectionMeta}>
                <Text style={styles.sectionCount}>
                  {item.count} quest{item.count !== 1 ? 's' : ''}
                </Text>
                <View style={styles.sectionXpBadge}>
                  <Text style={styles.sectionXpText}>+{item.totalXP} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }

        const { entry } = item;
        return (
          <View style={styles.entry}>
            <View style={[styles.diffDot, { backgroundColor: getTierColor(entry.difficulty) }]} />
            <View style={styles.entryContent}>
              <Text style={styles.entryName}>{entry.questName}</Text>
              <View style={styles.entryMeta}>
                <Text style={styles.metaLabel}>Difficulty: <Text style={[styles.diffLabel, { color: getTierColor(entry.difficulty) }]}>{getTierLabel(entry.difficulty)}</Text></Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaLabel}>Urgency: <Text style={[styles.diffLabel, { color: getTierColor(entry.urgency) }]}>{getTierLabel(entry.urgency)}</Text></Text>
                {entry.skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {entry.skills.map((skill) => (
                      <SkillChip key={skill} name={skill} textStyle={styles.skillText} coloredText />
                    ))}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{entry.xpAwarded} XP</Text>
            </View>
          </View>
        );
      }}
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
  controls: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#12121a',
  },
  controlText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0d0d14',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  sectionDate: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionXpBadge: {
    backgroundColor: '#7c3aed18',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#7c3aed33',
  },
  sectionXpText: { color: '#a855f7', fontSize: 11, fontWeight: '700' },
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
  metaLabel: { color: '#64748b', fontSize: 11 },
  diffLabel: { fontSize: 11, fontWeight: '600' },
  metaSep: { color: '#334155', fontSize: 11 },
  skillsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  skillText: { color: '#7c3aed', fontSize: 11 },
  xpBadge: {
    backgroundColor: '#7c3aed22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
});
