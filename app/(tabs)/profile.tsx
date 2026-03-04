import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore, useLevel, useXpProgress } from '../../src/store/profileStore';
import { useProjectStore } from '../../src/store/projectStore';
import { ConfirmDialog } from '../../src/components/shared/ConfirmDialog';

export default function ProfileScreen() {
  const { name, title, points, momentum, setName, setTitle } = useProfileStore();
  const level = useLevel();
  const { progress } = useXpProgress();
  const log = useProjectStore((s) => s.log);

  const [editingName, setEditingName] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [titleInput, setTitleInput] = useState(title);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalXP = log.reduce((sum, e) => sum + e.xpAwarded, 0);
  const completedCount = log.length;

  const handleSaveName = () => {
    if (nameInput.trim()) setName(nameInput.trim());
    setEditingName(false);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) setTitle(titleInput.trim());
    setEditingTitle(false);
  };

  return (
    <View style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>

        {/* Identity card */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#7c3aed" />
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveIconBtn}>
                  <Ionicons name="checkmark" size={20} color="#a855f7" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.fieldValue}
                onPress={() => { setNameInput(name); setEditingName(true); }}
              >
                <Text style={styles.fieldText}>{name}</Text>
                <Ionicons name="pencil-outline" size={14} color="#475569" />
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title</Text>
            {editingTitle ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={titleInput}
                  onChangeText={setTitleInput}
                  autoFocus
                  onSubmitEditing={handleSaveTitle}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveTitle} style={styles.saveIconBtn}>
                  <Ionicons name="checkmark" size={20} color="#a855f7" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.fieldValue}
                onPress={() => { setTitleInput(title); setEditingTitle(true); }}
              >
                <Text style={[styles.fieldText, styles.titleText]}>{title}</Text>
                <Ionicons name="pencil-outline" size={14} color="#475569" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionHeading}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Level" value={String(level)} icon="star" color="#FFD700" />
          <StatCard label="Total XP" value={String(totalXP)} icon="flash" color="#7c3aed" />
          <StatCard label="Completed" value={String(completedCount)} icon="checkmark-circle" color="#ADFF2F" />
          <StatCard label="Momentum" value={`${Math.round(momentum)}%`} icon="speedometer" color="#06b6d4" />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionHeading}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => setShowResetConfirm(true)}
          >
            <Ionicons name="warning-outline" size={18} color="#dc2626" />
            <Text style={styles.dangerText}>Reset All Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showResetConfirm}
        title="Reset All Progress"
        message="This will delete all projects, log entries, and reset your profile. This cannot be undone."
        confirmLabel="Reset Everything"
        destructive
        onConfirm={() => {
          setShowResetConfirm(false);
          // Reset profile
          useProfileStore.setState({
            points: 0,
            threshold: 100,
            momentum: 0,
          });
          // Reset projects
          useProjectStore.setState({ projects: [], log: [] });
          Alert.alert('Reset Complete', 'All progress has been cleared.');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  heading: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHeading: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#12121a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7c3aed22',
    borderWidth: 2,
    borderColor: '#7c3aed44',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  field: { gap: 4 },
  fieldLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  titleText: { color: '#a855f7' },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#e2e8f0',
    fontSize: 15,
  },
  saveIconBtn: { padding: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0d0d14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
});
