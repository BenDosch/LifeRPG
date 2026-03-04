import React from 'react';
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

export default function QuestFormModal() {
  const router = useRouter();
  const { questId, parentId } = useLocalSearchParams<{
    questId?: string;
    parentId?: string;
  }>();

  const editQuest = useQuestStore((s) =>
    questId ? s.quests.find((p) => p.id === questId) : null
  );

  const handleSave = () => router.dismiss();
  const handleCancel = () => router.dismiss();

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
          <Ionicons name="close" size={24} color="#64748b" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12121a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: { padding: 4 },
});
