import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../store/uiStore';
import { Difficulty, Importance } from '../../types';

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const IMPORTANCE_OPTIONS: { label: string; value: Importance }[] = [
  { label: 'Very High', value: 'very_high' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

export function FilterBar() {
  const {
    searchQuery,
    difficultyFilter,
    importanceFilter,
    showCompleted,
    setSearchQuery,
    setDifficultyFilter,
    setImportanceFilter,
    setShowCompleted,
    clearFilters,
  } = useUIStore();

  const hasFilters = searchQuery || difficultyFilter || importanceFilter;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search projects..."
            placeholderTextColor="#475569"
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, showCompleted && styles.toggleBtnActive]}
          onPress={() => setShowCompleted(!showCompleted)}
        >
          <Ionicons
            name={showCompleted ? 'eye' : 'eye-off-outline'}
            size={16}
            color={showCompleted ? '#7c3aed' : '#64748b'}
          />
        </TouchableOpacity>
        {hasFilters ? (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Difficulty chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                difficultyFilter === opt.value && styles.chipActive,
              ]}
              onPress={() =>
                setDifficultyFilter(
                  difficultyFilter === opt.value ? null : opt.value
                )
              }
            >
              <Text
                style={[
                  styles.chipText,
                  difficultyFilter === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          {IMPORTANCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                importanceFilter === opt.value && styles.chipActive,
              ]}
              onPress={() =>
                setImportanceFilter(
                  importanceFilter === opt.value ? null : opt.value
                )
              }
            >
              <Text
                style={[
                  styles.chipText,
                  importanceFilter === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  toggleBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#12121a',
  },
  toggleBtnActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed22',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: { color: '#7c3aed', fontSize: 13 },
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
});
