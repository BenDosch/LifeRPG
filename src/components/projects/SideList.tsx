import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';

import { SideItem } from './SideItem';

export function SideList() {
  const rootProjects = useProjectStore(
    useShallow((s) => s.projects.filter((p) => p.parentId === null && !p.completedAt))
  );
  const { selectedParentId, setSelectedParentId } = useUIStore(
    useShallow((s) => ({ selectedParentId: s.selectedParentId, setSelectedParentId: s.setSelectedParentId }))
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Projects</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* All Projects option */}
        <SideItem
          project={null}
          isSelected={selectedParentId === null}
          onSelect={() => setSelectedParentId(null)}
        />
        {rootProjects.map((project) => (
          <SideItem
            key={project.id}
            project={project}
            isSelected={selectedParentId === project.id}
            onSelect={() => setSelectedParentId(project.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d14',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  heading: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
