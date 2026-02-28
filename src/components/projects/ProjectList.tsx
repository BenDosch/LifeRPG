import React, { useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '../../store/projectStore';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/uiStore';
import { Project } from '../../types';
import { ProjectItem } from './ProjectItem';
import { FilterBar } from './FilterBar';

const IMPORTANCE_ORDER = { very_high: 0, high: 1, medium: 2, low: 3 };

interface ProjectListProps {
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
}

export function ProjectList({ onAddProject, onEditProject }: ProjectListProps) {
  const projects = useProjectStore((s) => s.projects);
  const {
    searchQuery,
    importanceFilter,
    difficultyFilter,
    showCompleted,
    selectedParentId,
  } = useUIStore(useShallow((s) => ({
    searchQuery: s.searchQuery,
    importanceFilter: s.importanceFilter,
    difficultyFilter: s.difficultyFilter,
    showCompleted: s.showCompleted,
    selectedParentId: s.selectedParentId,
  })));

  const filtered = useMemo(() => {
    let list = projects.filter((p) => p.parentId === selectedParentId);

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
    if (importanceFilter) {
      list = list.filter((p) => p.importance === importanceFilter);
    }
    if (difficultyFilter) {
      list = list.filter((p) => p.difficulty === difficultyFilter);
    }

    // Sort: incomplete first by importance, then completed last
    return [...list].sort((a, b) => {
      if (!!a.completedAt !== !!b.completedAt) {
        return a.completedAt ? 1 : -1;
      }
      return IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance];
    });
  }, [projects, searchQuery, importanceFilter, difficultyFilter, showCompleted, selectedParentId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {selectedParentId
            ? projects.find((p) => p.id === selectedParentId)?.name ?? 'Sub-Projects'
            : 'All Projects'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAddProject}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FilterBar />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectItem project={item} onEdit={onEditProject} />
        )}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={40} color="#1e1e2e" />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Tap Add to create your first project</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
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
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#334155', fontSize: 13 },
});
