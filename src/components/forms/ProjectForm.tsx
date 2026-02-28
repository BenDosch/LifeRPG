import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Difficulty, Importance, Project, DIFFICULTY_LABELS, IMPORTANCE_LABELS } from '../../types';
import { SelectPicker } from '../shared/SelectPicker';
import { SkillInput } from './SkillInput';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '../../store/projectStore';

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy (+5 XP)', value: 'easy' },
  { label: 'Medium (+10 XP)', value: 'medium' },
  { label: 'Hard (+25 XP)', value: 'hard' },
];

const IMPORTANCE_OPTIONS: { label: string; value: Importance }[] = [
  { label: 'Very High', value: 'very_high' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

interface ProjectFormProps {
  editProject?: Project | null;
  defaultParentId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ProjectForm({
  editProject,
  defaultParentId,
  onSave,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [importance, setImportance] = useState<Importance>('medium');
  const [skills, setSkills] = useState<string[]>([]);
  const [hasParent, setHasParent] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const rootProjects = useProjectStore(
    useShallow((s) => s.projects.filter((p) => p.parentId === null && !p.completedAt))
  );
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const parentOptions = rootProjects.map((p) => ({ label: p.name, value: p.id }));

  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setDifficulty(editProject.difficulty);
      setImportance(editProject.importance);
      setSkills(editProject.skills);
      setHasParent(!!editProject.parentId);
      setParentId(editProject.parentId);
    } else if (defaultParentId) {
      setHasParent(true);
      setParentId(defaultParentId);
    }
  }, [editProject, defaultParentId]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (editProject) {
      updateProject(editProject.id, {
        name: name.trim(),
        difficulty,
        importance,
        skills,
        parentId: hasParent ? parentId : null,
      });
    } else {
      addProject({
        name: name.trim(),
        difficulty,
        importance,
        skills,
        parentId: hasParent ? parentId : null,
      });
    }
    onSave();
  };

  return (
    <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Project Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter project name..."
          placeholderTextColor="#475569"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Text style={styles.sectionLabel}>Difficulty</Text>
        <SelectPicker
          value={difficulty}
          onValueChange={setDifficulty}
          options={DIFFICULTY_OPTIONS}
          style={styles.picker}
        />

        <Text style={styles.sectionLabel}>Importance</Text>
        <SelectPicker
          value={importance}
          onValueChange={setImportance}
          options={IMPORTANCE_OPTIONS}
          style={styles.picker}
        />

        <Text style={styles.sectionLabel}>Skills</Text>
        <SkillInput skills={skills} onChange={setSkills} />

        {rootProjects.length > 0 && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.sectionLabel}>Sub-project</Text>
              <Switch
                value={hasParent}
                onValueChange={(v) => {
                  setHasParent(v);
                  if (v && rootProjects.length > 0) {
                    setParentId(rootProjects[0].id);
                  } else {
                    setParentId(null);
                  }
                }}
                trackColor={{ true: '#7c3aed' }}
                thumbColor="#fff"
              />
            </View>
            {hasParent && parentOptions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Parent Project</Text>
                <SelectPicker
                  value={parentId ?? rootProjects[0].id}
                  onValueChange={(v) => setParentId(v)}
                  options={parentOptions}
                  style={styles.picker}
                />
              </>
            )}
          </>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text style={styles.saveText}>
              {editProject ? 'Update' : 'Add Project'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, gap: 8 },
  sectionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 15,
  },
  picker: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    alignItems: 'center',
  },
  cancelText: { color: '#94a3b8', fontSize: 15 },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
