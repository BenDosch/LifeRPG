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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore, useLevel, useXpProgress } from '../../src/store/characterStore';
import { useQuestStore } from '../../src/store/questStore';
import { getClassLevel, getClassXpProgress } from '../../src/utils/classLevels';
import { getSkillLevels } from '../../src/utils/skillLevels';
import { checkClassRequirements } from '../../src/utils/classRequirements';
import { HERO_CLASSES, getClassDef, DEFAULT_SKILLS } from '../../src/data/heroClasses';
import { useShopStore } from '../../src/store/shopStore';
import { ConfirmDialog } from '../../src/components/shared/ConfirmDialog';
import { IconPickerModal } from '../../src/components/skills/IconPickerModal';
import { SliderInput } from '../../src/components/shared/SliderInput';
import { useUIStore } from '../../src/store/uiStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Theme, resolveIconColor } from '../../src/theme';

export default function CharacterScreen() {
  const {
    name, heroClass, customClasses, points, gold, unlockedClasses,
    waterUnit, dailyWaterServings, energyMinutesPerDay, energyDecayEnabled,
    colorScheme, setColorScheme, energy, hydration,
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
      energy: s.energy,
      hydration: s.hydration,
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
  const { skillIcons, skillColors, standaloneSkills, addStandaloneSkill, setSkillIcon, setSkillColor, renameSkill, deleteSkill,
    skillGroups, groupIcons, groupColors, addSkillGroup, deleteSkillGroup, renameSkillGroup, setGroupIcon, setGroupColor,
    addSkillToGroup, removeSkillFromGroup } = useQuestStore(
    useShallow((s) => ({
      skillIcons: s.skillIcons,
      skillColors: s.skillColors,
      standaloneSkills: s.standaloneSkills,
      addStandaloneSkill: s.addStandaloneSkill,
      setSkillIcon: s.setSkillIcon,
      setSkillColor: s.setSkillColor,
      renameSkill: s.renameSkill,
      deleteSkill: s.deleteSkill,
      skillGroups: s.skillGroups,
      groupIcons: s.groupIcons,
      groupColors: s.groupColors,
      addSkillGroup: s.addSkillGroup,
      deleteSkillGroup: s.deleteSkillGroup,
      renameSkillGroup: s.renameSkillGroup,
      setGroupIcon: s.setGroupIcon,
      setGroupColor: s.setGroupColor,
      addSkillToGroup: s.addSkillToGroup,
      removeSkillFromGroup: s.removeSkillFromGroup,
    }))
  );

  const openClassPicker = useUIStore((s) => s.openClassPicker);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [draftEnergy, setDraftEnergy] = useState(100);
  const [draftHydration, setDraftHydration] = useState(100);
  const [pickerSkill, setPickerSkill] = useState<string | null>(null);
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ Mental: true, Physical: true, Social: true });
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSkillPicker, setGroupSkillPicker] = useState<string | null>(null);
  const [groupRemovePicker, setGroupRemovePicker] = useState<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null);
  const [attrIconPicker, setAttrIconPicker] = useState<string | null>(null); // group name whose modal is open

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

  const groupedSkillNames = useMemo(
    () => new Set(Object.values(skillGroups).flat()),
    [skillGroups]
  );

  const ungroupedStats = useMemo(
    () => skillStats.filter((s) => !groupedSkillNames.has(s.name)),
    [skillStats, groupedSkillNames]
  );

  const sortedGroupNames = useMemo(
    () => Object.keys(skillGroups).sort((a, b) => a.localeCompare(b)),
    [skillGroups]
  );

  const toggleGroup = (group: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const newlyUnlockableCount = allClasses.filter(
    (cls) =>
      cls.requirements.length > 0 &&
      !unlockedClasses.includes(cls.name) &&
      cls.name !== heroClass &&
      checkClassRequirements(cls, skillLevels, level, log)
  ).length;
  const totalClassLevels = allClasses.reduce((sum, c) => sum + getClassLevel(log, c.name), 0);
  const totalSkillLevels = Object.values(skillLevels).reduce((sum: number, lv: unknown) => sum + (lv as number), 0);

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
              <Text style={styles.fieldLabel}>Attributes &amp; Skills</Text>
              <View style={styles.skillHeaderButtons}>
                <TouchableOpacity
                  style={styles.manageClassesBtn}
                  onPress={() => { setAddingGroup((v) => !v); setNewGroupName(''); }}
                >
                  <Ionicons name={addingGroup ? 'close' : 'folder-open-outline'} size={12} color={addingGroup ? '#a855f7' : theme.textDisabled} />
                  <Text style={[styles.manageClassesText, addingGroup && { color: '#a855f7' }]}>
                    {addingGroup ? 'Cancel' : 'New Attribute'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manageClassesBtn}
                  onPress={() => { setAddingSkill((v) => !v); setNewSkillName(''); }}
                >
                  <Ionicons name={addingSkill ? 'close' : 'add'} size={12} color={addingSkill ? '#a855f7' : theme.textDisabled} />
                  <Text style={[styles.manageClassesText, addingSkill && { color: '#a855f7' }]}>
                    {addingSkill ? 'Cancel' : 'New Skill'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {addingGroup && (
              <View style={styles.skillAddRow}>
                <TextInput
                  style={styles.skillAddInput}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Attribute name..."
                  placeholderTextColor={theme.textDisabled}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const t = newGroupName.trim();
                    if (t) addSkillGroup(t);
                    setNewGroupName('');
                    setAddingGroup(false);
                  }}
                />
                <TouchableOpacity
                  style={[styles.skillAddConfirmBtn, !newGroupName.trim() && styles.skillAddConfirmBtnDisabled]}
                  onPress={() => {
                    const t = newGroupName.trim();
                    if (t) addSkillGroup(t);
                    setNewGroupName('');
                    setAddingGroup(false);
                  }}
                  disabled={!newGroupName.trim()}
                >
                  <Ionicons name="checkmark" size={16} color={newGroupName.trim() ? '#a855f7' : theme.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skillAddCancelBtn}
                  onPress={() => { setNewGroupName(''); setAddingGroup(false); }}
                >
                  <Ionicons name="close" size={16} color={theme.textDisabled} />
                </TouchableOpacity>
              </View>
            )}

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
                  onSubmitEditing={() => {
                    const t = newSkillName.trim();
                    if (t) addStandaloneSkill(t);
                    setNewSkillName('');
                    setAddingSkill(false);
                  }}
                />
                <TouchableOpacity
                  style={[styles.skillAddConfirmBtn, !newSkillName.trim() && styles.skillAddConfirmBtnDisabled]}
                  onPress={() => {
                    const t = newSkillName.trim();
                    if (t) addStandaloneSkill(t);
                    setNewSkillName('');
                    setAddingSkill(false);
                  }}
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

            {skillStats.length === 0 && !addingSkill && !addingGroup && (
              <Text style={styles.skillEmptyText}>No skills yet — complete quests with skills or add one</Text>
            )}

            {/* Collapsible attribute groups */}
            {sortedGroupNames.map((group) => {
              const isCollapsed = !!collapsedGroups[group];
              const groupSkills = skillStats.filter((s) => (skillGroups[group] ?? []).includes(s.name));
              const ATTR_XP_PER_LEVEL = 1000;
              const attrXP = groupSkills.reduce((sum, s) => sum + s.xp, 0);
              const attrLevel = Math.floor(attrXP / ATTR_XP_PER_LEVEL);
              const attrProgress = attrXP % ATTR_XP_PER_LEVEL;
              const attrProgressPct = (attrProgress / ATTR_XP_PER_LEVEL) * 100;
              const rawColor = groupColors[group] ?? '#a855f7';
              const attrColor = resolveIconColor(rawColor, theme.colorScheme);
              const attrIcon = groupIcons[group] as keyof typeof Ionicons.glyphMap | undefined;
              return (
                <View key={group} style={styles.groupContainer}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroup(group)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                      size={14}
                      color={theme.textMuted}
                    />
                    {/* Attribute icon badge */}
                    <TouchableOpacity
                      style={[styles.groupIconBadge, { borderColor: attrColor + '66', backgroundColor: attrColor + '22' }]}
                      onPress={() => { setAttrIconPicker(group); setGroupSkillPicker(null); setGroupRemovePicker(null); }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      {attrIcon
                        ? <Ionicons name={attrIcon} size={16} color={attrColor} />
                        : <Ionicons name="add" size={14} color={attrColor} />
                      }
                      <Text style={[styles.groupLevelText, { color: attrColor + 'cc' }]}>{attrLevel}</Text>
                    </TouchableOpacity>
                    <View style={styles.groupTitleBlock}>
                      <View style={styles.groupTitleRow}>
                        <Text style={[styles.groupName, { color: attrColor }]}>{group}</Text>
                      </View>
                      <View style={styles.groupXpBarTrack}>
                        <View style={[styles.groupXpBarFill, { width: `${attrProgressPct}%` as any, backgroundColor: attrColor }]} />
                      </View>
                      <Text style={styles.groupXpText}>{attrProgress} / 1000 XP to next level</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.groupRemoveSkillBtn}
                      onPress={() => {
                        setGroupRemovePicker(groupRemovePicker === group ? null : group);
                        setGroupSkillPicker(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="remove" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                    <Text style={styles.groupCount}>{groupSkills.length}</Text>
                    <TouchableOpacity
                      style={styles.groupAddSkillBtn}
                      onPress={() => {
                        setGroupSkillPicker(groupSkillPicker === group ? null : group);
                        setGroupRemovePicker(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="add" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.groupDeleteBtn}
                      onPress={() => setConfirmDeleteGroup(group)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={13} color={theme.textDisabled} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* ADD picker — skills not yet in this group */}
                  {groupSkillPicker === group && (
                    <View style={styles.groupSkillPickerContainer}>
                      <Text style={styles.groupSkillPickerLabel}>Add skill to attribute:</Text>
                      <View style={styles.groupSkillPickerList}>
                        {skillStats
                          .filter((s) => !(skillGroups[group] ?? []).includes(s.name))
                          .map((s) => (
                            <TouchableOpacity
                              key={s.name}
                              style={styles.groupSkillPickerChip}
                              onPress={() => { addSkillToGroup(group, s.name); }}
                            >
                              <Text style={styles.groupSkillPickerChipText}>{s.name}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}

                  {/* REMOVE picker — skills currently in this group */}
                  {groupRemovePicker === group && (
                    <View style={styles.groupSkillPickerContainer}>
                      <Text style={styles.groupSkillPickerLabel}>Remove skill from attribute:</Text>
                      <View style={styles.groupSkillPickerList}>
                        {groupSkills.map((s) => (
                          <TouchableOpacity
                            key={s.name}
                            style={styles.groupSkillPickerChipRemove}
                            onPress={() => { removeSkillFromGroup(group, s.name); }}
                          >
                            <Text style={styles.groupSkillPickerChipTextRemove}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {!isCollapsed && (
                    <View style={styles.groupBody}>
                      {groupSkills.length === 0 && (
                        <Text style={styles.groupEmptyText}>No skills in this attribute yet</Text>
                      )}
                      {groupSkills.map((stat, index) => {
                        const color = skillColors[stat.name] ?? '#a855f7';
                        const resolvedColor = resolveIconColor(color, theme.colorScheme);
                        const icon = skillIcons[stat.name] as keyof typeof Ionicons.glyphMap | undefined;
                        return (
                          <View key={stat.name}>
                            {index > 0 && <View style={styles.skillSeparator} />}
                            <View style={styles.skillRow}>
                              <SkillRowItem
                                stat={stat}
                                icon={icon ?? null}
                                resolvedColor={resolvedColor}
                                theme={theme}
                                styles={styles}
                                onPressIcon={() => setPickerSkill(stat.name)}
                              />
                              <TouchableOpacity
                                onPress={() => removeSkillFromGroup(group, stat.name)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="remove-circle-outline" size={18} color={theme.textDisabled} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Ungrouped skills */}
            {ungroupedStats.length > 0 && (
              <View style={styles.ungroupedSection}>
                <Text style={styles.ungroupedLabel}>Skills not associated with an Attribute</Text>
                {ungroupedStats.map((stat, index) => {
                  const color = skillColors[stat.name] ?? '#a855f7';
                  const resolvedColor = resolveIconColor(color, theme.colorScheme);
                  const icon = skillIcons[stat.name] as keyof typeof Ionicons.glyphMap | undefined;
                  return (
                    <View key={stat.name}>
                      {index > 0 && <View style={styles.skillSeparator} />}
                      <SkillRowItem
                        stat={stat}
                        icon={icon ?? null}
                        resolvedColor={resolvedColor}
                        theme={theme}
                        styles={styles}
                        onPressIcon={() => setPickerSkill(stat.name)}
                      />
                    </View>
                  );
                })}
              </View>
            )}
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
          <View style={styles.settingDivider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setDraftEnergy(Math.max(1, Math.min(100, Math.round(energy))));
              setDraftHydration(Math.max(1, Math.min(100, Math.round(hydration))));
              setShowFixModal(true);
            }}
          >
            <View style={styles.settingLabelCol}>
              <Text style={styles.fieldLabel}>Fix Energy and/or Hydration</Text>
              <Text style={styles.settingHint}>Set Energy and/or Hydration to specific levels to reflect your current state accurately</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textDisabled} />
          </TouchableOpacity>
        </View>
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

      {attrIconPicker && (
        <IconPickerModal
          visible
          skillName={attrIconPicker}
          title="Customise Attribute"
          currentIcon={groupIcons[attrIconPicker] ?? null}
          currentColor={groupColors[attrIconPicker] ?? null}
          onConfirm={(icon, color) => {
            setGroupIcon(attrIconPicker, icon);
            setGroupColor(attrIconPicker, color);
          }}
          onClose={() => setAttrIconPicker(null)}
          onRename={(newName) => {
            renameSkillGroup(attrIconPicker, newName);
            setAttrIconPicker(newName);
          }}
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
          useCharacterStore.setState({
            points: 0,
            threshold: 100,
            energy: 100,
            energyLastUpdated: new Date().toISOString(),
            gold: 0,
            customClasses: [],
          });
          useQuestStore.setState({ quests: [], log: [], standaloneSkills: DEFAULT_SKILLS, skillIcons: {}, skillColors: {}, skillGroups: {
            Mental: ['Critical Thinking', 'Discipline', 'Focus', 'Logic', 'Mathematics', 'Memory', 'Philosophy', 'Reading', 'Research', 'Study', 'Writing'],
            Physical: ['Agility', 'Balance', 'Core Strength', 'Endurance', 'Flexibility', 'Meditation', 'Nutrition', 'Strength Training'],
            Social: ['Finance', 'Negotiation', 'Networking', 'Persuasion'],
          } });
          useShopStore.setState({ items: [], inventory: [] });
          Alert.alert('Reset Complete', 'All progress has been cleared.');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmDialog
        visible={confirmDeleteGroup !== null}
        title="Delete Attribute"
        message={`Delete the "${confirmDeleteGroup}" attribute? All skills in this attribute will become ungrouped.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteGroup) deleteSkillGroup(confirmDeleteGroup);
          setConfirmDeleteGroup(null);
        }}
        onCancel={() => setConfirmDeleteGroup(null)}
      />

      <Modal visible={showFixModal} transparent animationType="fade" onRequestClose={() => setShowFixModal(false)}>
        <View style={styles.fixModalOverlay}>
          <View style={styles.fixModalCard}>
            <Text style={styles.fixModalTitle}>Fix Energy &amp; Hydration</Text>
            <Text style={styles.fixModalSubtitle}>Drag the sliders to match your current state</Text>

            <View style={styles.fixModalSection}>
              <View style={styles.fixModalLabelRow}>
                <Ionicons name="flash" size={15} color="#4ade80" />
                <Text style={styles.fixModalLabel}>Energy</Text>
                <Text style={[styles.fixModalValue, { color: '#4ade80' }]}>{draftEnergy}%</Text>
              </View>
              <SliderInput value={draftEnergy} onValueChange={setDraftEnergy} color="#4ade80" />
            </View>

            <View style={styles.fixModalSection}>
              <View style={styles.fixModalLabelRow}>
                <Ionicons name="water" size={15} color="#0ea5e9" />
                <Text style={styles.fixModalLabel}>Hydration</Text>
                <Text style={[styles.fixModalValue, { color: '#0ea5e9' }]}>{draftHydration}%</Text>
              </View>
              <SliderInput value={draftHydration} onValueChange={setDraftHydration} color="#0ea5e9" />
            </View>

            <View style={styles.fixModalButtons}>
              <TouchableOpacity style={styles.fixModalCancelBtn} onPress={() => setShowFixModal(false)}>
                <Text style={styles.fixModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fixModalConfirmBtn}
                onPress={() => {
                  useCharacterStore.setState({
                    energy: draftEnergy,
                    energyLastUpdated: new Date().toISOString(),
                    hydration: draftHydration,
                    hydrationLastUpdated: new Date().toISOString(),
                  });
                  setShowFixModal(false);
                }}
              >
                <Text style={styles.fixModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SkillRowItem({
  stat,
  icon,
  resolvedColor,
  theme,
  styles,
  onPressIcon,
}: {
  stat: { name: string; xp: number; level: number; progress: number; count: number };
  icon: keyof typeof Ionicons.glyphMap | null;
  resolvedColor: string;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof getStyles>;
  onPressIcon: () => void;
}) {
  return (
    <View style={[styles.skillRow, { flex: 1 }]}>
      <TouchableOpacity
        style={[
          styles.skillBadge,
          icon
            ? { borderColor: resolvedColor + '66', backgroundColor: resolvedColor + '22' }
            : { borderColor: theme.borderDefault, backgroundColor: theme.bgDeep },
        ]}
        onPress={onPressIcon}
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
    ungroupedSection: {
      marginTop: 8,
    },
    ungroupedLabel: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
    },
    dangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dangerText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
    skillHeaderButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    groupContainer: {
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.bgDeep,
    },
    groupTitleBlock: {
      flex: 1,
      gap: 4,
    },
    groupTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    groupName: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    groupLevelBadge: {
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#a855f744',
      backgroundColor: '#a855f718',
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    groupLevelText: {
      color: '#a855f7',
      fontSize: 10,
      fontWeight: '700',
    },
    groupXpText: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '600',
    },
    groupXpBarTrack: {
      height: 6,
      backgroundColor: theme.borderDefault,
      borderRadius: 3,
      overflow: 'hidden',
    },
    groupXpBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    groupXpBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#a855f7',
    },
    groupCount: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '600',
      marginRight: 4,
    },
    groupAddSkillBtn: {
      padding: 2,
    },
    groupRemoveSkillBtn: {
      padding: 2,
    },
    groupEditBtn: {
      padding: 2,
      marginLeft: 4,
    },
    groupDeleteBtn: {
      padding: 2,
      marginLeft: 4,
    },
    groupIconBadge: {
      width: 48,
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    groupBody: {
      paddingHorizontal: 12,
      backgroundColor: theme.bgCard,
    },
    groupEmptyText: {
      color: theme.textTertiary,
      fontSize: 12,
      paddingVertical: 10,
    },
    groupSkillPickerContainer: {
      backgroundColor: theme.bgPage,
      borderTopWidth: 1,
      borderTopColor: theme.borderDefault,
      padding: 10,
      gap: 6,
    },
    groupSkillPickerLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    groupSkillPickerList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    groupSkillPickerChip: {
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#a855f744',
      backgroundColor: '#a855f718',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    groupSkillPickerChipRemove: {
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ef444444',
      backgroundColor: '#ef444418',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    groupSkillPickerChipText: {
      color: '#a855f7',
      fontSize: 12,
      fontWeight: '600',
    },
    groupSkillPickerChipTextRemove: {
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '600',
    },
    fixModalOverlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    fixModalCard: {
      width: '100%',
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      padding: 20,
      gap: 16,
    },
    fixModalTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    fixModalSubtitle: {
      color: theme.textDisabled,
      fontSize: 12,
      marginTop: -8,
    },
    fixModalSection: {
      gap: 10,
    },
    fixModalLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    fixModalLabel: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    fixModalValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    fixModalButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    fixModalCancelBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      alignItems: 'center',
    },
    fixModalCancelText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    fixModalConfirmBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#a855f7',
      alignItems: 'center',
    },
    fixModalConfirmText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
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
