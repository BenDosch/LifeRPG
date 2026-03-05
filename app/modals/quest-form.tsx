import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuestForm } from '../../src/components/forms/QuestForm';
import { useQuestStore } from '../../src/store/questStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Theme } from '../../src/theme';

export default function QuestFormModal() {
  const router = useRouter();
  const { questId, parentId } = useLocalSearchParams<{
    questId?: string;
    parentId?: string;
  }>();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const editQuest = useQuestStore((s) =>
    questId ? s.quests.find((p) => p.id === questId) : null
  );

  const dismiss = () => router.canDismiss() ? router.dismiss() : router.replace('/');
  const handleSave = () => dismiss();
  const handleCancel = () => dismiss();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {editQuest ? 'Edit Quest' : 'New Quest'}
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <QuestForm
        editQuest={editQuest ?? null}
        defaultParentId={parentId ?? null}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </KeyboardAvoidingView>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgCard,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderDefault,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    closeBtn: { padding: 4 },
  });
}
