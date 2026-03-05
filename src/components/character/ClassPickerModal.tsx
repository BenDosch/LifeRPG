import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { useCharacterStore } from '../../store/characterStore';
import { HERO_CLASSES } from '../../data/heroClasses';
import { getSkillLevels } from '../../utils/skillLevels';
import { getClassLevel, getClassXpProgress } from '../../utils/classLevels';
import { calcLevel } from '../../utils/xp';
import { getTier, TIER_LABELS } from '../../types';
import { HeroClassDef } from '../../types';
import { ClassFormModal } from './ClassFormModal';
import { SkillChip } from '../shared/SkillChip';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface ClassPickerModalProps {
  visible: boolean;
  currentClass: string;
  onSelect: (className: string) => void;
  onClose: () => void;
}

export function ClassPickerModal({
  visible,
  currentClass,
  onSelect,
  onClose,
}: ClassPickerModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [formVisible, setFormVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<HeroClassDef | null>(null);

  const log = useQuestStore((s) => s.log);
  const { customClasses, deleteCustomClass, threshold, unlockedClasses, unlockClass } = useCharacterStore(
    useShallow((s) => ({
      customClasses: s.customClasses,
      deleteCustomClass: s.deleteCustomClass,
      threshold: s.threshold,
      unlockedClasses: s.unlockedClasses,
      unlockClass: s.unlockClass,
    }))
  );

  const skillLevels = useMemo(() => getSkillLevels(log), [log]);
  const playerLevel = calcLevel(threshold);
  const questCount = log.length;

  const meetsRequirements = (classDef: HeroClassDef) =>
    classDef.requirements.every((req) => {
      switch (req.type) {
        case 'skill': return (skillLevels[req.skill] ?? 0) >= req.level;
        case 'playerLevel': return playerLevel >= req.level;
        case 'classLevel': return getClassLevel(log, req.className) >= req.level;
        case 'questsCompleted': {
          const qualifying = log.filter(
            (e) =>
              (req.allowedDifficulties.length === 0 || req.allowedDifficulties.length === 4 || req.allowedDifficulties.includes(getTier(e.difficulty))) &&
              (req.allowedUrgencies.length === 0 || req.allowedUrgencies.length === 4 || req.allowedUrgencies.includes(getTier(e.urgency)))
          );
          return qualifying.length >= req.count;
        }
        default: {
          const legacy = req as any;
          return legacy.skill ? (skillLevels[legacy.skill] ?? 0) >= (legacy.level ?? 1) : true;
        }
      }
    });

  // A class is considered user-unlocked if it has no requirements, is explicitly
  // unlocked, or is currently equipped (backwards-compat migration).
  const isUserUnlocked = (classDef: HeroClassDef) =>
    classDef.requirements.length === 0 ||
    unlockedClasses.includes(classDef.name) ||
    classDef.name === currentClass;

  const openCreate = () => {
    setEditingClass(null);
    setFormVisible(true);
  };

  const openEdit = (cls: HeroClassDef) => {
    setEditingClass(cls);
    setFormVisible(true);
  };

  const handleDelete = (cls: HeroClassDef) => {
    Alert.alert(
      'Delete Class',
      `Delete "${cls.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomClass(cls.id),
        },
      ]
    );
  };

  const renderClassCard = (classDef: HeroClassDef, isCustom = false) => {
    const equipped = classDef.name === currentClass;
    const qualifies = meetsRequirements(classDef);
    const userUnlocked = isUserUnlocked(classDef);
    const classLevel = getClassLevel(log, classDef.name);
    const classXpProgress = getClassXpProgress(log, classDef.name);

    return (
      <View
        key={classDef.id}
        style={[
          styles.card,
          equipped && styles.cardEquipped,
          !qualifies && styles.cardLocked,
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: classDef.color + '33', borderRightColor: classDef.color + '66', borderRightWidth: 1 }]}>
          <Ionicons
            name={classDef.icon as any}
            size={22}
            color={qualifies ? classDef.color : theme.textTertiary}
          />
        </View>
        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Text style={[styles.className, !qualifies && styles.lockedText]}>
                {classDef.name}
              </Text>
              {!!classDef.description && (
                <Text style={[styles.classDesc, !qualifies && styles.lockedSubText]} numberOfLines={2}>
                  {classDef.description}
                </Text>
              )}
            </View>
            <View style={styles.cardActions}>
              {equipped && (
                <View style={styles.equippedBadge}>
                  <Text style={styles.equippedText}>Equipped</Text>
                </View>
              )}
              {isCustom && (
                <>
                  <TouchableOpacity
                    onPress={() => openEdit(classDef)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={15} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(classDef)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={15} color={theme.textMuted} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Class level + XP bar */}
          {(classLevel > 0 || classXpProgress > 0) && (
            <View style={styles.classXpSection}>
              <View style={styles.classXpRow}>
                <Text style={[styles.classXpLevel, { color: classDef.color }]}>Lv {classLevel}</Text>
                <Text style={styles.classXpText}>{classXpProgress} / 100 XP</Text>
              </View>
              <View style={styles.classXpBar}>
                <View style={[styles.classXpFill, { width: `${classXpProgress}%` as any, backgroundColor: classDef.color }]} />
              </View>
            </View>
          )}

          {/* Requirements */}
          {classDef.requirements.length > 0 && (
            <View style={styles.requirements}>
              <Text style={styles.reqHeading}>Requirements</Text>
              {classDef.requirements.map((req, i) => {
                let met = false;
                let label = '';
                let currentLabel = '';
                let isSkill = false;

                switch (req.type) {
                  case 'skill': {
                    const cur = skillLevels[req.skill] ?? 0;
                    met = cur >= req.level;
                    label = req.skill;
                    currentLabel = `Lv ${req.level} (you: ${cur})`;
                    isSkill = true;
                    break;
                  }
                  case 'playerLevel': {
                    met = playerLevel >= req.level;
                    label = `Player Level ${req.level}`;
                    currentLabel = `(you: ${playerLevel})`;
                    break;
                  }
                  case 'classLevel': {
                    const cur = getClassLevel(log, req.className);
                    met = cur >= req.level;
                    label = `${req.className} Lv ${req.level}`;
                    currentLabel = `(you: ${cur})`;
                    break;
                  }
                  case 'questsCompleted': {
                    const qualifying = log.filter(
                      (e) =>
                        (req.allowedDifficulties.length === 0 || req.allowedDifficulties.includes(getTier(e.difficulty))) &&
                        (req.allowedUrgencies.length === 0 || req.allowedUrgencies.includes(getTier(e.urgency)))
                    );
                    met = qualifying.length >= req.count;
                    const diffLabel = req.allowedDifficulties.length > 0 && req.allowedDifficulties.length < 4
                      ? `Diff: ${req.allowedDifficulties.map((t) => TIER_LABELS[t]).join('/')}`
                      : '';
                    const urgLabel = req.allowedUrgencies.length > 0 && req.allowedUrgencies.length < 4
                      ? `Urg: ${req.allowedUrgencies.map((t) => TIER_LABELS[t]).join('/')}`
                      : '';
                    const filters = [diffLabel, urgLabel].filter(Boolean).join(', ');
                    label = `${req.count} Quests${filters ? ` (${filters})` : ''} Completed`;
                    currentLabel = `(you: ${qualifying.length})`;
                    break;
                  }
                  default: {
                    const legacy = req as any;
                    const cur = legacy.skill ? (skillLevels[legacy.skill] ?? 0) : 0;
                    met = cur >= (legacy.level ?? 1);
                    label = legacy.skill ?? '';
                    currentLabel = `Lv ${legacy.level ?? 1} (you: ${cur})`;
                    isSkill = true;
                  }
                }

                return (
                  <View key={i} style={styles.reqRow}>
                    <Ionicons
                      name={met ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={met ? '#ADFF2F' : '#ef4444'}
                    />
                    {isSkill ? (
                      <SkillChip
                        name={label}
                        textStyle={[styles.reqText, met ? styles.reqMet : styles.reqUnmet]}
                        iconSize={12}
                      />
                    ) : (
                      <Text style={[styles.reqText, met ? styles.reqMet : styles.reqUnmet]}>
                        {label}
                      </Text>
                    )}
                    <Text style={styles.reqCurrent}>{currentLabel}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action button: locked / unlock / equip */}
          {!equipped && (
            !qualifies ? (
              <View style={[styles.equipBtn, styles.equipBtnLocked]}>
                <Ionicons name="lock-closed-outline" size={14} color={theme.textTertiary} />
                <Text style={[styles.equipBtnText, { color: theme.textTertiary }]}>Locked</Text>
              </View>
            ) : !userUnlocked ? (
              <TouchableOpacity
                style={[styles.equipBtn, { borderColor: classDef.color + '88', backgroundColor: classDef.color + '18' }]}
                onPress={() => unlockClass(classDef.name)}
              >
                <Ionicons name="lock-open-outline" size={14} color={classDef.color} />
                <Text style={[styles.equipBtnText, { color: classDef.color }]}>Unlock</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.equipBtn, { borderColor: classDef.color + '66', backgroundColor: classDef.color + '18' }]}
                onPress={() => { onSelect(classDef.name); onClose(); }}
              >
                <Ionicons name="checkmark-outline" size={14} color={classDef.color} />
                <Text style={[styles.equipBtnText, { color: classDef.color }]}>Equip</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.heading}>Choose Class</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {/* Custom classes */}
            <View style={styles.customHeader}>
              <Text style={styles.sectionLabel}>Custom Classes</Text>
              <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                <Ionicons name="add" size={16} color="#a855f7" />
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
            {customClasses.length === 0 ? (
              <View style={styles.emptyCustom}>
                <Text style={styles.emptyCustomText}>No custom classes yet.</Text>
              </View>
            ) : (
              customClasses.map((c) => renderClassCard(c, true))
            )}

            {/* Predefined classes */}
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Predefined Classes</Text>
            {HERO_CLASSES.map((c) => renderClassCard(c, false))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ClassFormModal
        visible={formVisible}
        editClass={editingClass}
        onClose={() => setFormVisible(false)}
      />
    </>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bgPage },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderDefault,
      backgroundColor: theme.bgCard,
    },
    heading: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
    closeBtn: { padding: 4 },
    list: { padding: 16, gap: 10, paddingBottom: 32 },
    sectionLabel: {
      color: theme.textDisabled,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 2,
      marginTop: 4,
    },
    customHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    createBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#7c3aed22',
      borderWidth: 1,
      borderColor: '#7c3aed44',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    createBtnText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
    emptyCustom: {
      borderWidth: 1,
      borderColor: theme.borderDefault,
      borderRadius: 10,
      borderStyle: 'dashed',
      padding: 20,
      alignItems: 'center',
    },
    emptyCustomText: { color: theme.textTertiary, fontSize: 13 },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    cardEquipped: { borderColor: '#a855f744', backgroundColor: '#a855f708' },
    cardLocked: { opacity: 0.6 },
    accentBar: {
      width: 52,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardBody: { flex: 1, padding: 12, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    cardTitle: { flex: 1, gap: 2 },
    className: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
    classDesc: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    lockedText: { color: theme.textDisabled },
    lockedSubText: { color: theme.textTertiary },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    iconBtn: { padding: 3 },
    equippedBadge: {
      backgroundColor: '#a855f722',
      borderWidth: 1,
      borderColor: '#a855f744',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    equippedText: { color: '#a855f7', fontSize: 11, fontWeight: '700' },
    classXpSection: {
      gap: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.borderDefault,
    },
    classXpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    classXpLevel: { fontSize: 12, fontWeight: '700' },
    classXpText: { color: theme.textDisabled, fontSize: 11 },
    classXpBar: {
      height: 4,
      backgroundColor: theme.bgPage,
      borderRadius: 2,
      overflow: 'hidden',
    },
    classXpFill: {
      height: '100%',
      borderRadius: 2,
    },
    requirements: {
      gap: 5,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.borderDefault,
    },
    reqHeading: {
      color: theme.textDisabled,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    reqRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    reqText: { fontSize: 12, fontWeight: '600' },
    reqMet: { color: '#ADFF2F' },
    reqUnmet: { color: '#ef4444' },
    reqCurrent: { color: theme.textDisabled, fontSize: 11 },
    equipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 6,
      borderWidth: 1,
    },
    equipBtnLocked: { borderColor: theme.borderDefault, backgroundColor: 'transparent' },
    equipBtnText: { fontSize: 12, fontWeight: '600' },
  });
}
