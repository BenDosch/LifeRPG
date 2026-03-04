import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { useUIStore } from '../../store/uiStore';

import { SideItem } from './SideItem';

export function SideList() {
  const rootQuests = useQuestStore(
    useShallow((s) => s.quests.filter((p) => p.parentId === null && !p.completedAt))
  );
  const { selectedParentId, setSelectedParentId } = useUIStore(
    useShallow((s) => ({ selectedParentId: s.selectedParentId, setSelectedParentId: s.setSelectedParentId }))
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quests</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* All Quests option */}
        <SideItem
          quest={null}
          isSelected={selectedParentId === null}
          onSelect={() => setSelectedParentId(null)}
        />
        {rootQuests.map((quest) => (
          <SideItem
            key={quest.id}
            quest={quest}
            isSelected={selectedParentId === quest.id}
            onSelect={() => setSelectedParentId(quest.id)}
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
