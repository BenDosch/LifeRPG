import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

import { SideItem } from './SideItem';

export function SideList() {
  const rootQuests = useQuestStore(
    useShallow((s) => s.quests.filter((p) => p.parentId === null && !p.completedAt))
  );
  const { selectedParentId, setSelectedParentId } = useUIStore(
    useShallow((s) => ({ selectedParentId: s.selectedParentId, setSelectedParentId: s.setSelectedParentId }))
  );

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

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

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgDeep,
      paddingTop: 8,
      paddingHorizontal: 8,
    },
    heading: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
  });
}
