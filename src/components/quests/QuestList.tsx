import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogList } from '../log/LogList';
import { Ionicons } from '@expo/vector-icons';
import { useQuestStore } from '../../store/questStore';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/uiStore';
import { Quest, getTier } from '../../types';
import { QuestItem } from './QuestItem';
import { FilterBar } from './FilterBar';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface QuestListProps {
  onAddQuest: () => void;
  onEditQuest: (quest: Quest) => void;
  onAddSubQuest: (parentId: string) => void;
}

export function QuestList({ onAddQuest, onEditQuest, onAddSubQuest }: QuestListProps) {
  const [showLog, setShowLog] = useState(false);
  const quests = useQuestStore((s) => s.quests);
  const {
    searchQuery,
    urgencyFilter,
    difficultyFilter,
    dueDateFilter,
    showCompleted,
    sortOrder,
  } = useUIStore(useShallow((s) => ({
    searchQuery: s.searchQuery,
    urgencyFilter: s.urgencyFilter,
    difficultyFilter: s.difficultyFilter,
    dueDateFilter: s.dueDateFilter,
    showCompleted: s.showCompleted,
    sortOrder: s.sortOrder,
  })));

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const filtered = useMemo(() => {
    // Only show root-level quests
    let list = quests.filter((p) => p.parentId === null);

    if (!showCompleted) {
      list = list.filter((p) => !p.completedAt);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (urgencyFilter) {
      list = list.filter((p) => getTier(p.urgency) === urgencyFilter);
    }
    if (difficultyFilter) {
      list = list.filter((p) => getTier(p.difficulty) === difficultyFilter);
    }

    if (dueDateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const todayStr    = fmt(today);
      const tomorrowStr = fmt(new Date(today.getTime() + 86400000));
      const weekEndStr  = fmt(new Date(today.getTime() + 7 * 86400000));

      list = list.filter((p) => {
        if (!p.dueDate) return false;
        if (dueDateFilter === 'overdue')   return p.dueDate < todayStr;
        if (dueDateFilter === 'today')     return p.dueDate === todayStr;
        if (dueDateFilter === 'tomorrow')  return p.dueDate === tomorrowStr;
        if (dueDateFilter === 'this_week') return p.dueDate >= todayStr && p.dueDate <= weekEndStr;
        return true;
      });
    }

    const byDueDate = (a: Quest, b: Quest) => {
      const aDate = a.dueDate ?? null;
      const bDate = b.dueDate ?? null;
      if (aDate && bDate) return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
      if (aDate) return -1;
      if (bDate) return 1;
      return 0;
    };
    const byUrgency    = (a: Quest, b: Quest) => b.urgency - a.urgency;
    const byDifficulty = (a: Quest, b: Quest) => b.difficulty - a.difficulty;

    // Default chain: due_date → urgency → difficulty.
    // When user picks a different primary, it moves to front and the rest follow.
    const chain =
      sortOrder === 'urgency'    ? [byUrgency,    byDueDate, byDifficulty] :
      sortOrder === 'difficulty' ? [byDifficulty, byDueDate, byUrgency]    :
                                   [byDueDate,    byUrgency, byDifficulty];

    return [...list].sort((a, b) => {
      // Completed quests always sink to the bottom
      if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1;

      for (const cmp of chain) {
        const result = cmp(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [quests, searchQuery, urgencyFilter, difficultyFilter, dueDateFilter, showCompleted, sortOrder]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Quests</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.logBtn} onPress={() => setShowLog(true)}>
            <Ionicons name="list-outline" size={16} color={theme.textMuted} />
            <Text style={styles.logBtnText}>Quest Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={onAddQuest}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLog(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>Quest Log</Text>
            <TouchableOpacity onPress={() => setShowLog(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <LogList />
        </SafeAreaView>
      </Modal>

      <FilterBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={40} color={theme.borderDefault} />
            <Text style={styles.emptyText}>No quests yet</Text>
            <Text style={styles.emptySubtext}>Tap Add to create your first quest</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <QuestItem
              key={item.id}
              quest={item}
              onEdit={onEditQuest}
              onAddSubQuest={onAddSubQuest}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    heading: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    headerBtns: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    logBtnText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
    modalSafe: { flex: 1, backgroundColor: theme.bgPage },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderDefault,
      backgroundColor: theme.bgCard,
    },
    modalHeading: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
    closeBtn: { padding: 4 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#7c3aed',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    scrollView: { flex: 1 },
    listContent: { paddingBottom: 16 },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    emptyContainer: { flexGrow: 1, justifyContent: 'center' },
    emptyText: { color: theme.textDisabled, fontSize: 16, fontWeight: '600' },
    emptySubtext: { color: theme.textTertiary, fontSize: 13 },
  });
}
