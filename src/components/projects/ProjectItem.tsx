import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Project, DIFFICULTY_COLORS, IMPORTANCE_LABELS } from '../../types';
import { DifficultyBadge } from './DifficultyBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';

interface ProjectItemProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectItem({ project, onEdit }: ProjectItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const completeProject = useProjectStore((s) => s.completeProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const diffColor = DIFFICULTY_COLORS[project.difficulty];
  const isCompleted = !!project.completedAt;

  const handleComplete = () => {
    if (isCompleted) return;
    const result = completeProject(project.id);
    Alert.alert(
      'Project Complete!',
      `+${result.xpAwarded} XP${result.skills.length ? `\nSkills: ${result.skills.join(', ')}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, isCompleted && styles.completedContainer]}>
      <View style={[styles.difficultyBar, { backgroundColor: diffColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.name, isCompleted && styles.completedText]}
            numberOfLines={2}
          >
            {project.name}
          </Text>
          {!isCompleted && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => onEdit(project)}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil-outline" size={16} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <DifficultyBadge difficulty={project.difficulty} />
          <Text style={styles.importance}>
            {IMPORTANCE_LABELS[project.importance]}
          </Text>
          {project.skills.length > 0 && (
            <Text style={styles.skills} numberOfLines={1}>
              {project.skills.join(', ')}
            </Text>
          )}
        </View>

        {!isCompleted && (
          <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#ADFF2F" />
            <Text style={styles.completeBtnText}>Complete</Text>
          </TouchableOpacity>
        )}

        {isCompleted && project.completedAt && (
          <Text style={styles.completedDate}>
            Completed · Lv {project.levelAtCompletion}
          </Text>
        )}
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Project"
        message={`Delete "${project.name}"? This will also remove all sub-projects.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteProject(project.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#12121a',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  completedContainer: {
    opacity: 0.55,
  },
  difficultyBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  importance: {
    color: '#64748b',
    fontSize: 11,
  },
  skills: {
    color: '#7c3aed',
    fontSize: 11,
    flex: 1,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ADFF2F33',
    backgroundColor: '#ADFF2F11',
  },
  completeBtnText: {
    color: '#ADFF2F',
    fontSize: 12,
    fontWeight: '600',
  },
  completedDate: {
    color: '#64748b',
    fontSize: 11,
  },
});
