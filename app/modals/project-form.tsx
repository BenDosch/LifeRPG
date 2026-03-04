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
import { ProjectForm } from '../../src/components/forms/ProjectForm';
import { useProjectStore } from '../../src/store/projectStore';

export default function ProjectFormModal() {
  const router = useRouter();
  const { projectId, parentId } = useLocalSearchParams<{
    projectId?: string;
    parentId?: string;
  }>();

  const editProject = useProjectStore((s) =>
    projectId ? s.projects.find((p) => p.id === projectId) : null
  );

  const handleSave = () => router.back();
  const handleCancel = () => router.back();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {editProject ? 'Edit Project' : 'New Project'}
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ProjectForm
        editProject={editProject ?? null}
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
