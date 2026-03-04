import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore, useLevel, useXpProgress } from '../../src/store/characterStore';
import { useQuestStore } from '../../src/store/questStore';
import { getClassLevel, getClassXpProgress } from '../../src/utils/classLevels';
import { getSkillLevels } from '../../src/utils/skillLevels';
import { checkClassRequirements } from '../../src/utils/classRequirements';
import { HERO_CLASSES } from '../../src/data/heroClasses';
import { useShopStore } from '../../src/store/shopStore';
import { ConfirmDialog } from '../../src/components/shared/ConfirmDialog';
import { getClassDef } from '../../src/data/heroClasses';
import { getTier } from '../../src/types';
import { useUIStore } from '../../src/store/uiStore';

export default function CharacterScreen() {
  const {
    name, heroClass, customClasses, points, gold, unlockedClasses,
    waterUnit, dailyWaterServings, energyMinutesPerDay, energyDecayEnabled,
    setName, setHeroClass, setWaterUnit, setDailyWaterServings, setEnergyMinutesPerDay, setEnergyDecayEnabled,
  } = useCharacterStore(
    useShallow((s) => ({
      name: s.name,
      heroClass: s.heroClass,
      customClasses: s.customClasses,
      points: s.points,
      gold: s.gold,
      unlockedClasses: s.unlockedClasses,
      waterUnit: s.waterUnit,
      dailyWaterServings: s.dailyWaterServings,
      energyMinutesPerDay: s.energyMinutesPerDay,
      energyDecayEnabled: s.energyDecayEnabled,
      setName: s.setName,
      setHeroClass: s.setHeroClass,
      setWaterUnit: s.setWaterUnit,
      setDailyWaterServings: s.setDailyWaterServings,
      setEnergyMinutesPerDay: s.setEnergyMinutesPerDay,
      setEnergyDecayEnabled: s.setEnergyDecayEnabled,
    }))
  );
  const classDef = getClassDef(heroClass, customClasses);
  const classColor = classDef?.color ?? '#a855f7';
  const level = useLevel();
  const { progress } = useXpProgress();
  const log = useQuestStore(useShallow((s) => s.log));
  const { skillIcons, skillColors, standaloneSkills } = useQuestStore(
    useShallow((s) => ({ skillIcons: s.skillIcons, skillColors: s.skillColors, standaloneSkills: s.standaloneSkills }))
  );

  const openClassPicker = useUIStore((s) => s.openClassPicker);
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalXP = log.reduce((sum, e) => sum + e.xpAwarded, 0);
  const completedCount = log.length;
  const classLevel = getClassLevel(log, heroClass);
  const classXpProgress = getClassXpProgress(log, heroClass);

  const allClasses = [...HERO_CLASSES, ...customClasses];
  const skillLevels = getSkillLevels(log);
  const allSkills = Array.from(
    new Set([...Object.keys(skillLevels), ...standaloneSkills])
  ).sort((a, b) => {
    const lvDiff = (skillLevels[b] ?? 0) - (skillLevels[a] ?? 0);
    return lvDiff !== 0 ? lvDiff : a.localeCompare(b);
  });
  const newlyUnlockableCount = allClasses.filter(
    (cls) =>
      cls.requirements.length > 0 &&
      !unlockedClasses.includes(cls.name) &&
      cls.name !== heroClass &&
      checkClassRequirements(cls, skillLevels, level, log)
  ).length;
  const unlockedCount = allClasses.filter((c) =>
    c.requirements.every((r) => {
      switch (r.type) {
        case 'skill': return (skillLevels[r.skill] ?? 0) >= r.level;
        case 'playerLevel': return level >= r.level;
        case 'classLevel': return getClassLevel(log, r.className) >= r.level;
        case 'questsCompleted': {
          const qualifying = log.filter(
            (e) =>
              (r.allowedDifficulties.length === 0 || r.allowedDifficulties.length === 4 || r.allowedDifficulties.includes(getTier(e.difficulty))) &&
              (r.allowedUrgencies.length === 0 || r.allowedUrgencies.length === 4 || r.allowedUrgencies.includes(getTier(e.urgency)))
          );
          return qualifying.length >= r.count;
        }
        default: {
          const legacy = r as any;
          return legacy.skill ? (skillLevels[legacy.skill] ?? 0) >= (legacy.level ?? 1) : true;
        }
      }
    })
  ).length;
  const totalClassLevels = allClasses.reduce((sum, c) => sum + getClassLevel(log, c.name), 0);
  const highestClass = allClasses.reduce<{ name: string; level: number } | null>((best, c) => {
    const lv = getClassLevel(log, c.name);
    return lv > (best?.level ?? -1) ? { name: c.name, level: lv } : best;
  }, null);
  const totalSkillLevels = Object.values(skillLevels).reduce((sum, lv) => sum + lv, 0);

  const handleSaveName = () => {
    if (nameInput.trim()) setName(nameInput.trim());
    setEditingName(false);
  };


  return (
    <View style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Character</Text>

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

          {/* Current Class */}
          <View style={[styles.field, { marginTop: 8 }]}>
            <Text style={styles.fieldLabel}>Current Class</Text>
            <TouchableOpacity
              style={styles.fieldValue}
              onPress={openClassPicker}
            >
              <View style={styles.classNameRow}>
                {classDef && <Ionicons name={classDef.icon as any} size={15} color={classColor} />}
                <Text style={[styles.fieldText, { color: classColor }]}>{heroClass}</Text>
                <View style={[styles.classLevelBadge, { backgroundColor: classColor + '22', borderColor: classColor + '55' }]}>
                  <Text style={[styles.classLevelText, { color: classColor }]}>Lv {classLevel}</Text>
                </View>
              </View>
              <View style={styles.manageClassesBtn}>
                {newlyUnlockableCount > 0 && (
                  <View style={styles.unlockCountBadge}>
                    <Text style={styles.unlockCountText}>{newlyUnlockableCount}</Text>
                  </View>
                )}
                <Ionicons name="hammer" size={12} color="#475569" />
                <Text style={styles.manageClassesText}>Manage classes</Text>
              </View>
            </TouchableOpacity>
            {/* Class XP bar */}
            <View style={styles.classXpBar}>
              <View style={[styles.classXpFill, { width: `${classXpProgress}%` as any, backgroundColor: classColor }]} />
            </View>
            <Text style={styles.classXpLabel}>{classXpProgress} / 100 XP</Text>
          </View>

          {/* Unlocked Classes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Unlocked Classes</Text>
            <View style={styles.unlockedBadgeRow}>
              {allClasses
                .filter((cls) =>
                  cls.requirements.length === 0 ||
                  checkClassRequirements(cls, skillLevels, level, log)
                )
                .sort((a, b) => {
                  const lvDiff = getClassLevel(log, b.name) - getClassLevel(log, a.name);
                  return lvDiff !== 0 ? lvDiff : a.name.localeCompare(b.name);
                })
                .map((cls) => {
                  const isEquipped = cls.name === heroClass;
                  return (
                    <TouchableOpacity
                      key={cls.name}
                      style={[
                        styles.unlockedBadge,
                        { borderColor: cls.color + (isEquipped ? 'bb' : '44'), backgroundColor: cls.color + (isEquipped ? '33' : '11') },
                      ]}
                      onPress={() => setHeroClass(cls.name)}
                    >
                      <Ionicons name={cls.icon as any} size={13} color={isEquipped ? cls.color : cls.color + '99'} />
                      <Text style={[styles.unlockedBadgeText, { color: isEquipped ? cls.color : cls.color + '99' }]}>
                        {cls.name}
                      </Text>
                      <Text style={[styles.unlockedBadgeLv, { color: isEquipped ? cls.color + 'bb' : cls.color + '55' }]}>
                        Lv {getClassLevel(log, cls.name)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>

          {/* Skills */}
          {allSkills.length > 0 && (
            <View style={[styles.field, { marginTop: 24 }]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Skills</Text>
                <TouchableOpacity style={styles.manageClassesBtn} onPress={() => router.push('/skills')}>
                  <Ionicons name="hammer" size={12} color="#475569" />
                  <Text style={styles.manageClassesText}>Manage skills</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.unlockedBadgeRow}>
                {allSkills.map((skill) => {
                  const lv = skillLevels[skill] ?? 0;
                  const color = skillColors[skill] ?? '#a855f7';
                  const icon = skillIcons[skill];
                  return (
                    <View
                      key={skill}
                      style={[styles.unlockedBadge, { borderColor: color + '44', backgroundColor: color + '11' }]}
                    >
                      {icon && <Ionicons name={icon as any} size={13} color={color} />}
                      <Text style={[styles.unlockedBadgeText, { color }]}>{skill}</Text>
                      <Text style={[styles.unlockedBadgeLv, { color: color + 'bb' }]}>Lv {lv}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </View>

        {/* Stats */}
        <Text style={styles.sectionHeading}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Player XP" value={String(totalXP)} icon="flash" color="#7c3aed" />
          <StatCard label="Completed Quests" value={String(completedCount)} icon="checkmark-circle" color="#ADFF2F" />
          <StatCard label="Classes Unlocked" value={String(unlockedCount)} icon="shield-checkmark" color="#a855f7" />
          <StatCard label="Highest Level Class" value={highestClass ? `Lv ${highestClass.level} ${highestClass.name}` : '—'} icon="trophy" color="#FFD700" />
          <StatCard label="Total Class Levels" value={String(totalClassLevels)} icon="star" color="#f59e0b" />
          <StatCard label="Total Skill Levels" value={String(totalSkillLevels)} icon="barbell" color="#22c55e" />
        </View>

        {/* Settings */}
        <Text style={styles.sectionHeading}>Settings</Text>
        <View style={styles.card}>
          {/* Energy section */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.fieldLabel}>Time-based Energy Decay</Text>
              <Text style={styles.settingHint}>
                {energyDecayEnabled
                  ? 'Energy drains over time. Turn off to only lose energy from quest costs.'
                  : 'Off — energy only decreases from quest costs.'}
              </Text>
            </View>
            <Switch
              value={energyDecayEnabled}
              onValueChange={setEnergyDecayEnabled}
              trackColor={{ false: '#1e1e2e', true: '#4ade8044' }}
              thumbColor={energyDecayEnabled ? '#4ade80' : '#334155'}
            />
          </View>

          <Text style={[styles.fieldLabel, !energyDecayEnabled && styles.disabledLabel]}>
            Total Energy Per Day
          </Text>
          <View style={[styles.settingRow, !energyDecayEnabled && styles.disabledRow]}>
            <Text style={styles.settingHint}>Energy drains from 100% to 0% over this duration</Text>
            <View style={styles.durationStepper}>
              {/* Hours */}
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAmber]}
                  onPress={() => setEnergyMinutesPerDay(energyMinutesPerDay - 60)}
                  disabled={!energyDecayEnabled || energyMinutesPerDay <= 60}
                >
                  <Ionicons name="remove" size={16} color={!energyDecayEnabled || energyMinutesPerDay <= 60 ? '#334155' : '#4ade80'} />
                </TouchableOpacity>
                <Text style={[styles.stepValue, !energyDecayEnabled && { color: '#334155' }]}>
                  {Math.floor(energyMinutesPerDay / 60)}
                  <Text style={styles.stepUnit}> hr</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAmber]}
                  onPress={() => setEnergyMinutesPerDay(energyMinutesPerDay + 60)}
                  disabled={!energyDecayEnabled || energyMinutesPerDay >= 1440}
                >
                  <Ionicons name="add" size={16} color={!energyDecayEnabled || energyMinutesPerDay >= 1440 ? '#334155' : '#4ade80'} />
                </TouchableOpacity>
              </View>
              {/* Minutes */}
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAmber]}
                  onPress={() => setEnergyMinutesPerDay(energyMinutesPerDay - 5)}
                  disabled={!energyDecayEnabled || energyMinutesPerDay <= 5}
                >
                  <Ionicons name="remove" size={16} color={!energyDecayEnabled || energyMinutesPerDay <= 5 ? '#334155' : '#f59e0b'} />
                </TouchableOpacity>
                <Text style={[styles.stepValue, !energyDecayEnabled && { color: '#334155' }]}>
                  {energyMinutesPerDay % 60}
                  <Text style={styles.stepUnit}> min</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAmber]}
                  onPress={() => setEnergyMinutesPerDay(energyMinutesPerDay + 5)}
                  disabled={!energyDecayEnabled || energyMinutesPerDay >= 1440}
                >
                  <Ionicons name="add" size={16} color={!energyDecayEnabled || energyMinutesPerDay >= 1440 ? '#334155' : '#4ade80'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.settingDivider} />

          {/* Water section */}
          <Text style={styles.fieldLabel}>Daily Water Goal</Text>
          <View style={styles.settingRow}>
            {/* Unit toggle */}
            <View style={styles.unitToggle}>
              {(['imperial', 'metric'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, waterUnit === u && styles.unitBtnActive]}
                  onPress={() => setWaterUnit(u)}
                >
                  <Text style={[styles.unitBtnText, waterUnit === u && styles.unitBtnTextActive]}>
                    {u === 'imperial' ? 'oz' : 'ml'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Stepper */}
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setDailyWaterServings(dailyWaterServings - 1)}
                disabled={dailyWaterServings <= 1}
              >
                <Ionicons name="remove" size={16} color={dailyWaterServings <= 1 ? '#334155' : '#0ea5e9'} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>
                {dailyWaterServings * (waterUnit === 'imperial' ? 8 : 240)}
                <Text style={styles.stepUnit}> {waterUnit === 'imperial' ? 'oz' : 'ml'}</Text>
              </Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setDailyWaterServings(dailyWaterServings + 1)}
              >
                <Ionicons name="add" size={16} color="#0ea5e9" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.settingHint}>
            1 serving = {waterUnit === 'imperial' ? '8oz' : '240ml'} · {dailyWaterServings} servings per day
          </Text>
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
        message="This will delete all quests, log entries, and reset your profile. This cannot be undone."
        confirmLabel="Reset Everything"
        destructive
        onConfirm={() => {
          setShowResetConfirm(false);
          // Reset profile
          useCharacterStore.setState({
            points: 0,
            threshold: 100,
            energy: 100,
            energyLastUpdated: new Date().toISOString(),
            gold: 0,
            customClasses: [],
          });
          // Reset quests
          useQuestStore.setState({ quests: [], log: [] });
          // Reset shop
          useShopStore.setState({ items: [], inventory: [] });
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
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: '#64748b',
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
  classNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  unlockedBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unlockedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unlockedBadgeLv: {
    fontSize: 10,
    fontWeight: '700',
  },
  manageClassesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageClassesText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  unlockCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unlockCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  classLevelBadge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  classLevelText: { fontSize: 11, fontWeight: '700' },
  classXpBar: {
    height: 4,
    backgroundColor: '#1e1e2e',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  classXpFill: {
    height: '100%',
    borderRadius: 2,
  },
  classXpLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingHint: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0a0a0f',
  },
  unitBtnActive: {
    backgroundColor: '#0ea5e922',
  },
  unitBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#0ea5e9',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationStepper: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e933',
    backgroundColor: '#0ea5e911',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'center',
  },
  stepUnit: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '400',
  },
  stepBtnAmber: {
    borderColor: '#4ade8033',
    backgroundColor: '#4ade8011',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#1e1e2e',
  },
  settingLabelCol: {
    flex: 1,
    gap: 2,
  },
  disabledLabel: {
    opacity: 0.35,
  },
  disabledRow: {
    opacity: 0.35,
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
