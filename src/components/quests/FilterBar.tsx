import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore, SortOrder, DueDateFilter } from '../../store/uiStore';
import { Tier } from '../../types';
import { Tooltip } from '../shared/Tooltip';

const TIER_OPTIONS: { label: string; value: Tier }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Very Hard', value: 'very_hard' },
];

export function FilterBar() {
  const [expanded, setExpanded] = useState(false);

  const {
    searchQuery,
    difficultyFilter,
    urgencyFilter,
    dueDateFilter,
    showCompleted,
    sortOrder,
    setSearchQuery,
    setDifficultyFilter,
    setUrgencyFilter,
    setDueDateFilter,
    setShowCompleted,
    setSortOrder,
    clearFilters,
  } = useUIStore(useShallow((s) => ({
    searchQuery: s.searchQuery,
    difficultyFilter: s.difficultyFilter,
    urgencyFilter: s.urgencyFilter,
    dueDateFilter: s.dueDateFilter,
    showCompleted: s.showCompleted,
    sortOrder: s.sortOrder,
    setSearchQuery: s.setSearchQuery,
    setDifficultyFilter: s.setDifficultyFilter,
    setUrgencyFilter: s.setUrgencyFilter,
    setDueDateFilter: s.setDueDateFilter,
    setShowCompleted: s.setShowCompleted,
    setSortOrder: s.setSortOrder,
    clearFilters: s.clearFilters,
  })));

  const hasFilters = !!(difficultyFilter || urgencyFilter || dueDateFilter || sortOrder !== 'due_date');

  return (
    <View style={styles.container}>
      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search quests..."
            placeholderTextColor="#475569"
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Show completed toggle */}
        <Tooltip label="Show completed">
          <TouchableOpacity
            style={[styles.iconBtn, showCompleted && styles.iconBtnActive]}
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Ionicons
              name={showCompleted ? 'eye' : 'eye-off-outline'}
              size={16}
              color={showCompleted ? '#7c3aed' : '#64748b'}
            />
          </TouchableOpacity>
        </Tooltip>

        {/* Filter / sort expand toggle */}
        <Tooltip label="Filters & sort">
          <TouchableOpacity
            style={[styles.iconBtn, expanded && styles.iconBtnActive]}
            onPress={() => setExpanded((v) => !v)}
          >
            <Ionicons
              name={expanded ? 'options' : 'options-outline'}
              size={16}
              color={expanded ? '#a855f7' : hasFilters ? '#a855f7' : '#64748b'}
            />
            {hasFilters && !expanded && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </Tooltip>

        {/* Clear — only when expanded and something is active */}
        {expanded && (difficultyFilter || urgencyFilter || dueDateFilter) ? (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Collapsible filter + sort rows */}
      {expanded && (
        <View style={styles.filtersPanel}>
          {/* Difficulty */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Difficulty</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chips}>
                {TIER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={'d-' + opt.value}
                    style={[styles.chip, difficultyFilter === opt.value && styles.chipActive]}
                    onPress={() => setDifficultyFilter(difficultyFilter === opt.value ? null : opt.value)}
                  >
                    <Text style={[styles.chipText, difficultyFilter === opt.value && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Urgency */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Urgency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chips}>
                {TIER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={'i-' + opt.value}
                    style={[styles.chip, urgencyFilter === opt.value && styles.chipActiveImp]}
                    onPress={() => setUrgencyFilter(urgencyFilter === opt.value ? null : opt.value)}
                  >
                    <Text style={[styles.chipText, urgencyFilter === opt.value && styles.chipTextActiveImp]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Due date */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Due</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chips}>
                {([
                  { label: 'Overdue',   value: 'overdue'   as DueDateFilter },
                  { label: 'Today',     value: 'today'     as DueDateFilter },
                  { label: 'Tomorrow',  value: 'tomorrow'  as DueDateFilter },
                  { label: 'This week', value: 'this_week' as DueDateFilter },
                ]).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, dueDateFilter === opt.value && styles.chipActiveDue]}
                    onPress={() => setDueDateFilter(dueDateFilter === opt.value ? null : opt.value)}
                  >
                    <Text style={[styles.chipText, dueDateFilter === opt.value && styles.chipTextActiveDue]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sort */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chips}>
                {([
                  { label: 'Urgency',    value: 'urgency'    as SortOrder },
                  { label: 'Difficulty', value: 'difficulty' as SortOrder },
                  { label: 'Due Date',   value: 'due_date'   as SortOrder },
                ]).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, sortOrder === opt.value && styles.chipActiveSort]}
                    onPress={() => setSortOrder(opt.value)}
                  >
                    <Text style={[styles.chipText, sortOrder === opt.value && styles.chipTextActiveSort]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#12121a',
  },
  iconBtnActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed22',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a855f7',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: { color: '#7c3aed', fontSize: 13 },
  filtersPanel: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    width: 68,
    flexShrink: 0,
  },
  chipScroll: { flex: 1 },
  chips: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#12121a',
  },
  chipActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed33',
  },
  chipText: { color: '#64748b', fontSize: 12 },
  chipTextActive: { color: '#a855f7' },
  chipActiveImp: {
    borderColor: '#06b6d4',
    backgroundColor: '#06b6d433',
  },
  chipTextActiveImp: { color: '#06b6d4' },
  chipActiveSort: {
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b22',
  },
  chipTextActiveSort: { color: '#f59e0b', fontWeight: '600' },
  chipActiveDue: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444422',
  },
  chipTextActiveDue: { color: '#ef4444', fontWeight: '600' },
});
