import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestList } from '../../src/components/quests/QuestList';
import { Quest } from '../../src/types';
import { useTheme } from '../../src/theme/ThemeContext';
import { Theme } from '../../src/theme';

export default function QuestsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleAddQuest = () => {
    router.push('/modals/quest-form');
  };

  const handleEditQuest = (quest: Quest) => {
    router.push({ pathname: '/modals/quest-form', params: { questId: quest.id } });
  };

  const handleAddSubQuest = (parentId: string) => {
    router.push({ pathname: '/modals/quest-form', params: { parentId } });
  };

  return (
    <View style={styles.container}>
      <QuestList
        onAddQuest={handleAddQuest}
        onEditQuest={handleEditQuest}
        onAddSubQuest={handleAddSubQuest}
      />
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgPage,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
    },
  });
}
