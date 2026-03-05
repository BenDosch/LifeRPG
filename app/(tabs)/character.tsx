import React, { useState, useMemo } from 'react';
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
import { IconPickerModal } from '../../src/components/skills/IconPickerModal';
import { getClassDef } from '../../src/data/heroClasses';
import { getTier } from '../../src/types';
import { useUIStore } from '../../src/store/uiStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Theme, resolveIconColor } from '../../src/theme';

export default function CharacterScreen() {
  const {
    name, heroClass, customClasses, points, gold, unlockedClasses,
    waterUnit, dailyWaterServings, energyMinutesPerDay, energyDecayEnabled,
    colorScheme, setColorScheme,
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
      colorScheme: s.colorScheme,
      setColorScheme: s.setColorScheme,
      setName: s.setName,
      setHeroClass: s.setHeroClass,
      setWaterUnit: s.setWaterUnit,
      setDailyWaterServings: s.setDailyWaterServings,
      setEnergyMinutesPerDay: s.setEnergyMinutesPerDay,
      setEnergyDecayEnabled: s.setEnergyDecayEnabled,
    }))
  );

  const theme = useTheme();

  const classDef = getClassDef(heroClass, customClasses);
  const classColor = classDef?.color ?? '#a855f7';
  const level = useLevel();
  const { progress } = useXpProgress();
  const { log, quests: allQuests } = useQuestStore(useShallow((s) => ({ log: s.log, quests: s.quests })));
  const { skillIcons, skillColors, standaloneSkills, addStandaloneSkill, setSkillIcon, setSkillColor, renameSkill, deleteSkill } = useQuestStore(
    useShallow((s) => ({
      skillIcons: s.skillIcons,
      skillColors: s.skillColors,
      standaloneSkills: s.standaloneSkills,
      addStandaloneSkill: s.addStandaloneSkill,
      setSkillIcon: s.setSkillIcon,
      setSkillColor: s.setSkillColor,
      renameSkill: s.renameSkill,
      deleteSkill: s.deleteSkill,
    }))
  );

  const openClassPicker = useUIStore((s) => s.openClassPicker);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pickerSkill, setPickerSkill] = useState<string | null>(null);
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  const totalXP = log.reduce((sum, e) => sum + e.xpAwarded, 0);
  const completedCount = log.length;
  const classLevel = getClassLevel(log, heroClass);
  const classXpProgress = getClassXpProgress(log, heroClass);

  const allClasses = [...HERO_CLASSES, ...customClasses];
  const skillLevels = getSkillLevels(log);

  const skillStats = useMemo(() => {
    const XP_PER_LEVEL = 100;
    const map = new Map<string, { name: string; count: number; xp: number; level: number; progress: number }>();
    for (const entry of log) {
      for (const skill of entry.skills) {
        const existing = map.get(skill);
        if (existing) { existing.xp += entry.xpAwarded; }
        else { map.set(skill, { name: skill, count: 0, xp: entry.xpAwarded, level: 0, progress: 0 }); }
      }
    }
    for (const skill of standaloneSkills) {
      if (!map.has(skill)) map.set(skill, { name: skill, count: 0, xp: 0, level: 0, progress: 0 });
    }
    // Count uncompleted quests per skill; also surfaces skills not yet in the log
    for (const quest of allQuests) {
      if (quest.completedAt !== null) continue;
      for (const skill of quest.skills) {
        const existing = map.get(skill);
        if (existing) { existing.count++; }
        else { map.set(skill, { name: skill, count: 1, xp: 0, level: 0, progress: 0 }); }
      }
    }
    const result = Array.from(map.values());
    for (const stat of result) { stat.level = Math.floor(stat.xp / XP_PER_LEVEL); stat.progress = stat.xp % XP_PER_LEVEL; }
    return result.sort((a, b) => b.xp - a.xp);
  }, [log, standaloneSkills, allQuests]);

  const handleConfirmAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (trimmed) addStandaloneSkill(trimmed);
    setNewSkillName('');
    setAddingSkill(false);
  };
  const newlyUnlockableCount = allClasses.filter(
    (cls) =>
      cls.requirements.length > 0 &&
      !unlockedClasses.includes(cls.name) &&
      cls.name !== heroClass &&
      checkClassRequirements(cls, skillLevels, level, log)
  ).length;
  const totalClassLevels = allClasses.reduce((sum, c) => sum + getClassLevel(log, c.name), 0);
  const totalSkillLevels = Object.values(skillLevels).reduce((sum, lv) => sum + lv, 0);

  const handleSaveName = () => {
    if (nameInput.trim()) setName(nameInput.trim());
    setEditingName(false);
  };

  const styles = useMemo(() => getStyles(theme), [theme]);

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
                <Ionicons name="pencil-outline" size={14} color={theme.textDisabled} />
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
                <Ionicons name="hammer" size={12} color={theme.textDisabled} />
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
          <View style={[styles.field, { marginTop: 24 }]}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Skills</Text>
              <TouchableOpacity
                style={styles.manageClassesBtn}
                onPress={() => setAddingSkill((v) => !v)}
              >
                <Ionicons name={addingSkill ? 'close' : 'add'} size={12} color={addingSkill ? '#a855f7' : theme.textDisabled} />
                <Text style={[styles.manageClassesText, addingSkill && { color: '#a855f7' }]}>
                  {addingSkill ? 'Cancel' : 'New Skill'}
                </Text>
              </TouchableOpacity>
            </View>

            {addingSkill && (
              <View style={styles.skillAddRow}>
                <TextInput
                  style={styles.skillAddInput}
                  value={newSkillName}
                  onChangeText={setNewSkillName}
                  placeholder="Skill name..."
                  placeholderTextColor={theme.textDisabled}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleConfirmAddSkill}
                />
                <TouchableOpacity
                  style={[styles.skillAddConfirmBtn, !newSkillName.trim() && styles.skillAddConfirmBtnDisabled]}
                  onPress={handleConfirmAddSkill}
                  disabled={!newSkillName.trim()}
                >
                  <Ionicons name="checkmark" size={16} color={newSkillName.trim() ? '#a855f7' : theme.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skillAddCancelBtn}
                  onPress={() => { setNewSkillName(''); setAddingSkill(false); }}
                >
                  <Ionicons name="close" size={16} color={theme.textDisabled} />
                </TouchableOpacity>
              </View>
            )}

            {skillStats.length === 0 && !addingSkill && (
              <Text style={styles.skillEmptyText}>No skills yet — complete quests with skills or add one</Text>
            )}

            {skillStats.map((stat, index) => {
              const color = skillColors[stat.name] ?? '#a855f7';
              const resolvedColor = resolveIconColor(color, theme.colorScheme);
              const icon = skillIcons[stat.name] as keyof typeof Ionicons.glyphMap | undefined;
              return (
                <View key={stat.name}>
                  {index > 0 && <View style={styles.skillSeparator} />}
                  <View style={styles.skillRow}>
                    <TouchableOpacity
                      style={[
                        styles.skillBadge,
                        icon
                          ? { borderColor: resolvedColor + '66', backgroundColor: resolvedColor + '22' }
                          : { borderColor: theme.borderDefault, backgroundColor: theme.bgDeep },
                      ]}
                      onPress={() => setPickerSkill(stat.name)}
                    >
                      {icon
                        ? <Ionicons name={icon} size={22} color={resolvedColor} />
                        : <Ionicons name="add" size={18} color={theme.textTertiary} />
                      }
                      <Text style={[styles.skillLevel, icon && { color: resolvedColor + 'cc' }]}>{stat.level}</Text>
                    </TouchableOpacity>
                    <View style={styles.skillInfo}>
                      <View style={styles.skillNameRow}>
                        <Text style={styles.skillName}>{stat.name}</Text>
                        <Text style={[styles.skillXp, { color: resolvedColor }]}>{stat.xp} XP</Text>
                      </View>
                      <View style={styles.skillBarTrack}>
                        <View style={[styles.skillBarFill, { width: `${stat.progress}%` as any, backgroundColor: resolvedColor }]} />
                      </View>
                      <Text style={styles.skillProgressLabel}>
                        {stat.progress} / 100 to next level · {stat.count} active quest{stat.count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

        </View>

        {/* Stats */}
        <Text style={styles.sectionHeading}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Player XP" value={String(totalXP)} icon="sparkles-sharp" color="#7c3aed" />
          <StatCard label="Completed Quests" value={String(completedCount)} icon="checkmark-circle" color="#ADFF2F" />
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
              trackColor={{ false: theme.borderMuted, true: '#4ade8066' }}
              thumbColor={energyDecayEnabled ? '#4ade80' : '#fff'}
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

          <View style={styles.settingDivider} />
          {/* Theme */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.fieldLabel}>Light Mode</Text>
              <Text style={styles.settingHint}>Switch between dark and light appearance</Text>
            </View>
            <Switch
              value={colorScheme === 'light'}
              onValueChange={(v) => setColorScheme(v ? 'light' : 'dark')}
              trackColor={{ false: theme.borderMuted, true: '#4ade8066' }}
              thumbColor={colorScheme === 'light' ? '#4ade80' : '#fff'}
            />
          </View>
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

      {pickerSkill && (
        <IconPickerModal
          visible
          skillName={pickerSkill}
          currentIcon={skillIcons[pickerSkill] ?? null}
          currentColor={skillColors[pickerSkill] ?? null}
          onConfirm={(icon, color) => { setSkillIcon(pickerSkill, icon); setSkillColor(pickerSkill, color); }}
          onClose={() => setPickerSkill(null)}
          onRename={(newName) => { renameSkill(pickerSkill, newName); setPickerSkill(newName); }}
          onDelete={() => { deleteSkill(pickerSkill); setPickerSkill(null); }}
        />
      )}

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
  const theme = useTheme();
  const statStyles = useMemo(() => getStatStyles(theme), [theme]);
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bgPage },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 12, paddingBottom: 32 },
    heading: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
    },
    sectionHeading: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 8,
    },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderDefault,
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
      color: theme.textMuted,
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
    fieldText: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
    classNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editInput: {
      flex: 1,
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#7c3aed',
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: theme.textPrimary,
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
      color: theme.textMuted,
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
      backgroundColor: theme.borderDefault,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 4,
    },
    classXpFill: {
      height: '100%',
      borderRadius: 2,
    },
    classXpLabel: {
      color: theme.textMuted,
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
      color: theme.textDisabled,
      fontSize: 11,
      marginTop: 2,
    },
    unitToggle: {
      flexDirection: 'row',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    unitBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: theme.bgPage,
    },
    unitBtnActive: {
      backgroundColor: '#0ea5e922',
    },
    unitBtnText: {
      color: theme.textDisabled,
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
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      minWidth: 64,
      textAlign: 'center',
    },
    stepUnit: {
      color: theme.textDisabled,
      fontSize: 12,
      fontWeight: '400',
    },
    stepBtnAmber: {
      borderColor: '#4ade8033',
      backgroundColor: '#4ade8011',
    },
    settingDivider: {
      height: 1,
      backgroundColor: theme.borderDefault,
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
    skillAddRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    skillAddInput: {
      flex: 1,
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#7c3aed',
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: theme.textPrimary,
      fontSize: 14,
    },
    skillAddConfirmBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#7c3aed44',
      backgroundColor: '#7c3aed18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillAddConfirmBtnDisabled: {
      borderColor: theme.borderDefault,
      backgroundColor: 'transparent',
    },
    skillAddCancelBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillEmptyText: {
      color: theme.textTertiary,
      fontSize: 12,
      marginTop: 8,
    },
    skillSeparator: {
      height: 1,
      backgroundColor: theme.borderDefault,
    },
    skillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    skillBadge: {
      width: 48,
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    skillLevel: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '700',
    },
    skillInfo: { flex: 1, gap: 4 },
    skillNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    skillName: { color: theme.textPrimary, fontSize: 15, fontWeight: '600' },
    skillXp: { fontSize: 12, fontWeight: '700' },
    skillBarTrack: {
      height: 6,
      backgroundColor: theme.borderDefault,
      borderRadius: 3,
      overflow: 'hidden',
    },
    skillBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    skillProgressLabel: { color: theme.textDisabled, fontSize: 11 },
    dangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dangerText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  });
}

function getStatStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.bgDeep,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    value: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
    },
    label: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
  });
}
