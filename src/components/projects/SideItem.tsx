import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { Project } from '../../types';
import { useProjectStore } from '../../store/projectStore';

interface SideItemProps {
  project: Project | null;  // null = "All Projects"
  isSelected: boolean;
  onSelect: () => void;
}

export function SideItem({ project, isSelected, onSelect }: SideItemProps) {
  const children = useProjectStore(
    useShallow((s) =>
      project ? s.projects.filter((p) => p.parentId === project.id && !p.completedAt) : []
    )
  );

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.selected]}
      onPress={onSelect}
    >
      <View style={styles.content}>
        <Ionicons
          name={project ? 'folder-outline' : 'grid-outline'}
          size={16}
          color={isSelected ? '#a855f7' : '#64748b'}
        />
        <Text
          style={[styles.name, isSelected && styles.nameSelected]}
          numberOfLines={1}
        >
          {project ? project.name : 'All Projects'}
        </Text>
      </View>
      {children.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{children.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  selected: {
    backgroundColor: '#7c3aed22',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
  },
  nameSelected: {
    color: '#c4b5fd',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#7c3aed44',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
  },
});
