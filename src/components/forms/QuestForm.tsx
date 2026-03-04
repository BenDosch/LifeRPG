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
import { Ionicons } from '@expo/vector-icons';
import { Quest, RepeatSchedule, getTierLabel, getTierColor, getUrgencyLabel } from '../../types';
import { IconPickerModal } from '../skills/IconPickerModal';
import { calcXP } from '../../utils/xp';
import { ArcSlider } from '../shared/ArcSlider';
import { SelectPicker } from '../shared/SelectPicker';
import { SkillInput } from './SkillInput';
import { DateInput } from '../shared/DateInput';
import { TimeInput } from '../shared/TimeInput';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { useCharacterStore } from '../../store/characterStore';
import { HERO_CLASSES } from '../../data/heroClasses';
import { Tooltip } from '../shared/Tooltip';

interface QuestFormProps {
  editQuest?: Quest | null;
  defaultParentId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function QuestForm({
  editQuest,
  defaultParentId,
  onSave,
  onCancel,
}: QuestFormProps) {
  const [name, setName] = useState('');
  const [details, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(50);
  const [urgency, setUrgency] = useState(50);
  const [skills, setSkills] = useState<string[]>([]);
  const [pendingSkill, setPendingSkill] = useState('');
  const [repeatable, setRepeatable] = useState(false);
  const [autoCompleteOnSubQuests, setAutoCompleteOnSubQuests] = useState(false);
  const [scheduleType, setScheduleType] = useState<RepeatSchedule['type']>('unlimited');
  const [scheduleEvery, setScheduleEvery] = useState(1);
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [goldReward, setGoldReward] = useState(0);
  const [hydrationReward, setHydrationReward] = useState(0);
  const [energyReward, setEnergyReward] = useState(0);
  const [hydrationCost, setHydrationCost] = useState(0);
  const [energyCost, setEnergyCost] = useState(0);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [dueTime, setDueTime] = useState<string | null>(null);
  type DueDateScheduleType = Exclude<RepeatSchedule['type'], 'unlimited'>;
  const [dueDateScheduleEnabled, setDueDateScheduleEnabled] = useState(false);
  const [dueDateScheduleType, setDueDateScheduleType] = useState<DueDateScheduleType>('days');
  const [dueDateScheduleEvery, setDueDateScheduleEvery] = useState(1);
  const [dueDateScheduleWeekdays, setDueDateScheduleWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [classQuestEnabled, setClassQuestEnabled] = useState(false);
  const [classQuest, setClassQuest] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [hasParent, setHasParent] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentAutoComplete, setParentAutoComplete] = useState(false);

  const rootQuests = useQuestStore(
    useShallow((s) => s.quests.filter((p) => p.parentId === null && !p.completedAt))
  );
  const hasSubQuests = useQuestStore(
    (s) => !!editQuest && s.quests.some((p) => p.parentId === editQuest.id)
  );
  const subQuests = useQuestStore(
    useShallow((s) => editQuest ? s.quests.filter((p) => p.parentId === editQuest.id) : [])
  );
  const addQuest = useQuestStore((s) => s.addQuest);
  const updateQuest = useQuestStore((s) => s.updateQuest);

  const { heroClass, unlockedClasses, customClasses } = useCharacterStore(
    useShallow((s) => ({ heroClass: s.heroClass, unlockedClasses: s.unlockedClasses, customClasses: s.customClasses }))
  );
  const availableClasses = [...HERO_CLASSES, ...customClasses].filter(
    (c) => c.name === heroClass || unlockedClasses.includes(c.name) || c.requirements.length === 0
  );

  const parentOptions = rootQuests.map((p) => ({ label: p.name, value: p.id }));

  useEffect(() => {
    if (editQuest) {
      setName(editQuest.name);
      setDescription(editQuest.details ?? '');
      setDifficulty(editQuest.difficulty);
      setUrgency(editQuest.urgency);
      setSkills(editQuest.skills);
      setRepeatable(editQuest.repeatable);
      setAutoCompleteOnSubQuests(editQuest.autoCompleteOnSubQuests ?? false);
      const s = editQuest.repeatSchedule ?? { type: 'unlimited' };
      setScheduleType(s.type);
      if (s.type === 'hours' || s.type === 'days' || s.type === 'weeks' || s.type === 'months') setScheduleEvery(s.every);
      if (s.type === 'weekdays') setScheduleWeekdays(s.days);
      setGoldReward(editQuest.goldReward ?? 0);
      setHydrationReward(editQuest.hydrationReward ?? 0);
      setEnergyReward(editQuest.energyReward ?? 0);
      setHydrationCost(editQuest.hydrationCost ?? 0);
      setEnergyCost(editQuest.energyCost ?? 0);
      setDueDate(editQuest.dueDate ?? null);
      setDueTime(editQuest.dueTime ?? null);
      const ds = editQuest.dueDateSchedule;
      if (ds && ds.type !== 'unlimited') {
        setDueDateScheduleEnabled(true);
        setDueDateScheduleType(ds.type as DueDateScheduleType);
        if (ds.type === 'hours' || ds.type === 'days' || ds.type === 'weeks' || ds.type === 'months') setDueDateScheduleEvery(ds.every);
        if (ds.type === 'weekdays') setDueDateScheduleWeekdays(ds.days);
      } else {
        setDueDateScheduleEnabled(false);
        setDueDateScheduleType('days');
        setDueDateScheduleEvery(1);
        setDueDateScheduleWeekdays([1, 2, 3, 4, 5]);
      }
      setClassQuestEnabled(!!editQuest.classQuest);
      setClassQuest(editQuest.classQuest ?? null);
      setIcon(editQuest.icon ?? null);
      setIconColor(editQuest.iconColor ?? null);
      setHasParent(!!editQuest.parentId);
      setParentId(editQuest.parentId);
    } else if (defaultParentId) {
      setHasParent(true);
      setParentId(defaultParentId);
    }
  }, [editQuest, defaultParentId]);

  const handleDetachSubQuest = (id: string) => {
    updateQuest(id, { parentId: null });
  };

  // Keep parentAutoComplete in sync with the selected parent quest's current setting
  useEffect(() => {
    if (hasParent && parentId) {
      const parent = rootQuests.find((q) => q.id === parentId);
      setParentAutoComplete(parent?.autoCompleteOnSubQuests ?? false);
    } else {
      setParentAutoComplete(false);
    }
  }, [parentId, hasParent, rootQuests]);

  const buildDueDateSchedule = (): RepeatSchedule | null => {
    if (!dueDateScheduleEnabled || !dueDate) return null;
    if (dueDateScheduleType === 'hours') return { type: 'hours', every: dueDateScheduleEvery };
    if (dueDateScheduleType === 'days') return { type: 'days', every: dueDateScheduleEvery };
    if (dueDateScheduleType === 'weeks') return { type: 'weeks', every: dueDateScheduleEvery };
    if (dueDateScheduleType === 'months') return { type: 'months', every: dueDateScheduleEvery };
    return { type: 'weekdays', days: dueDateScheduleWeekdays };
  };

  const buildSchedule = (): RepeatSchedule => {
    if (scheduleType === 'hours') return { type: 'hours', every: scheduleEvery };
    if (scheduleType === 'days') return { type: 'days', every: scheduleEvery };
    if (scheduleType === 'weeks') return { type: 'weeks', every: scheduleEvery };
    if (scheduleType === 'months') return { type: 'months', every: scheduleEvery };
    if (scheduleType === 'weekdays') return { type: 'weekdays', days: scheduleWeekdays };
    return { type: 'unlimited' };
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const trimmed = pendingSkill.trim();
    const finalSkills = trimmed && !skills.includes(trimmed) ? [...skills, trimmed] : skills;
    const repeatSchedule = repeatable ? buildSchedule() : { type: 'unlimited' as const };
    if (editQuest) {
      updateQuest(editQuest.id, {
        name: name.trim(), details, difficulty, urgency, skills: finalSkills,
        repeatable, repeatSchedule, parentId: hasParent ? parentId : null,
        autoCompleteOnSubQuests: hasParent ? false : autoCompleteOnSubQuests,
        goldReward, hydrationReward, energyReward, hydrationCost, energyCost, dueDate, dueTime, dueDateSchedule: buildDueDateSchedule(),
        icon, iconColor, classQuest,
      });
    } else {
      addQuest({
        name: name.trim(), details, difficulty, urgency, skills: finalSkills,
        repeatable, repeatSchedule, parentId: hasParent ? parentId : null,
        autoCompleteOnSubQuests: hasParent ? false : autoCompleteOnSubQuests,
        goldReward, hydrationReward, energyReward, hydrationCost, energyCost, dueDate, dueTime, dueDateSchedule: buildDueDateSchedule(),
        icon, iconColor, classQuest,
      });
    }
    // Propagate parent auto-complete preference to the parent quest
    if (hasParent && parentId) {
      updateQuest(parentId, { autoCompleteOnSubQuests: parentAutoComplete });
    }
    onSave();
  };

  const xpPreview = calcXP(difficulty, urgency);
  const diffColor = getTierColor(difficulty);
  const impColor = getTierColor(urgency);

  return (
    <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Quest Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter quest name..."
          placeholderTextColor="#475569"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Icon */}
        <Text style={styles.sectionLabel}>Icon</Text>
        <TouchableOpacity
          style={[
            styles.iconPickerBtn,
            icon && { borderColor: (iconColor ?? '#a855f7') + '55', backgroundColor: (iconColor ?? '#a855f7') + '11' },
          ]}
          onPress={() => setShowIconPicker(true)}
        >
          {icon ? (
            <>
              <View style={[styles.iconPickerPreview, { borderColor: (iconColor ?? '#a855f7') + '44', backgroundColor: (iconColor ?? '#a855f7') + '22' }]}>
                <Ionicons name={icon as any} size={22} color={iconColor ?? '#a855f7'} />
              </View>
              <Text style={[styles.iconPickerLabel, { color: iconColor ?? '#a855f7' }]}>
                {icon.replace(/-(outline|sharp)$/, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.iconPickerPreviewEmpty}>
                <Ionicons name="image-outline" size={22} color="#334155" />
              </View>
              <Text style={styles.iconPickerLabelEmpty}>No icon — tap to set</Text>
            </>
          )}
          <Ionicons name="chevron-forward" size={16} color="#475569" />
        </TouchableOpacity>

        {/* Details */}
        <Text style={styles.sectionLabel}>Details</Text>
        <TextInput
          style={[styles.textInput, styles.detailsInput]}
          value={details}
          onChangeText={setDescription}
          placeholder="Optional details..."
          placeholderTextColor="#475569"
          multiline
          returnKeyType="done"
          blurOnSubmit
        />

        {/* Difficulty & Urgency */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }}>
          <ArcSlider
            value={difficulty}
            onValueChange={setDifficulty}
            color={diffColor}
            label="DIFFICULTY"
            getLabel={getTierLabel}
          />
          <ArcSlider
            value={urgency}
            onValueChange={setUrgency}
            color={impColor}
            label="URGENCY"
            getLabel={getUrgencyLabel}
          />
        </View>
        <View style={styles.xpRow}>
          <Ionicons name="sparkles-sharp" size={13} color="#a855f7" />
          <Text style={styles.xpRowText}>{xpPreview} XP</Text>
        </View>

        {/* Class Quest */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.sectionLabel}>Class Quest</Text>
            <Text style={styles.switchHint}>XP goes to a specific class instead of your equipped class</Text>
          </View>
          <Switch
            value={classQuestEnabled}
            onValueChange={(v) => {
              setClassQuestEnabled(v);
              if (!v) setClassQuest(null);
            }}
            trackColor={{ true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>
        {classQuestEnabled && (
          <View style={styles.classChipRow}>
            {availableClasses.map((cls) => (
              <TouchableOpacity
                key={cls.name}
                style={[
                  styles.classChip,
                  classQuest === cls.name && { borderColor: cls.color + '99', backgroundColor: cls.color + '22' },
                ]}
                onPress={() => setClassQuest(cls.name)}
              >
                <Ionicons name={cls.icon as any} size={13} color={classQuest === cls.name ? cls.color : '#64748b'} />
                <Text style={[styles.classChipText, classQuest === cls.name && { color: cls.color, fontWeight: '600' }]}>
                  {cls.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Rewards */}
        <Text style={styles.sectionLabel}>Rewards</Text>
        <View style={styles.rewardRow}>
          <View style={styles.goldInputRow}>
            <Ionicons name="logo-usd" size={14} color="#FFD700" />
            <TextInput
              style={styles.goldInput}
              value={goldReward === 0 ? '' : String(goldReward)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                setGoldReward(isNaN(n) || n < 0 ? 0 : n);
              }}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
            />
            <Text style={styles.goldLabel}>Gold</Text>
          </View>
          <View style={[styles.costInputRow, hydrationCost > 0 && styles.inputDisabled]}>
            <Ionicons name="water" size={14} color={hydrationCost > 0 ? '#334155' : '#0ea5e9'} />
            <TextInput
              style={[styles.costInput, hydrationCost > 0 && styles.inputTextDisabled]}
              value={hydrationReward === 0 ? '' : String(hydrationReward)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                setHydrationReward(isNaN(n) || n < 0 ? 0 : Math.min(100, n));
              }}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              editable={hydrationCost === 0}
            />
            <Text style={[styles.costLabelBlue, hydrationCost > 0 && styles.inputTextDisabled]}>Hydration</Text>
          </View>
          <View style={[styles.costInputRow, styles.costInputRowAmber, energyCost > 0 && styles.inputDisabled]}>
            <Ionicons name="flash" size={14} color={energyCost > 0 ? '#334155' : '#4ade80'} />
            <TextInput
              style={[styles.costInput, styles.costInputAmber, energyCost > 0 && styles.inputTextDisabled]}
              value={energyReward === 0 ? '' : String(energyReward)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                setEnergyReward(isNaN(n) || n < 0 ? 0 : Math.min(100, n));
              }}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              editable={energyCost === 0}
            />
            <Text style={[styles.costLabelAmber, energyCost > 0 && styles.inputTextDisabled]}>Energy</Text>
          </View>
        </View>

        {/* Costs */}
        <Text style={styles.sectionLabel}>Costs</Text>
        <View style={styles.rewardRow}>
          <View style={[styles.costInputRow, hydrationReward > 0 && styles.inputDisabled]}>
            <Ionicons name="water" size={14} color={hydrationReward > 0 ? '#334155' : '#0ea5e9'} />
            <TextInput
              style={[styles.costInput, hydrationReward > 0 && styles.inputTextDisabled]}
              value={hydrationCost === 0 ? '' : String(hydrationCost)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                setHydrationCost(isNaN(n) || n < 0 ? 0 : Math.min(100, n));
              }}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              editable={hydrationReward === 0}
            />
            <Text style={[styles.costLabelBlue, hydrationReward > 0 && styles.inputTextDisabled]}>Hydration</Text>
          </View>
          <View style={[styles.costInputRow, styles.costInputRowAmber, energyReward > 0 && styles.inputDisabled]}>
            <Ionicons name="flash" size={14} color={energyReward > 0 ? '#334155' : '#4ade80'} />
            <TextInput
              style={[styles.costInput, styles.costInputAmber, energyReward > 0 && styles.inputTextDisabled]}
              value={energyCost === 0 ? '' : String(energyCost)}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                setEnergyCost(isNaN(n) || n < 0 ? 0 : Math.min(100, n));
              }}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              editable={energyReward === 0}
            />
            <Text style={[styles.costLabelAmber, energyReward > 0 && styles.inputTextDisabled]}>Energy</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Skills</Text>
        <SkillInput skills={skills} onChange={setSkills} onPendingChange={setPendingSkill} />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.sectionLabel}>Repeatable</Text>
            <Text style={styles.switchHint}>Quest resets after each completion</Text>
          </View>
          <Switch
            value={repeatable}
            onValueChange={(v) => {
              setRepeatable(v);
              if (v) {
                // switching to repeatable — clear specific due date
                setDueDate(null);
              } else {
                // switching to non-repeatable — clear due every
                setDueDateScheduleEnabled(false);
                setDueDateScheduleType('days');
                setDueDateScheduleEvery(1);
                setDueDateScheduleWeekdays([1, 2, 3, 4, 5]);
                setDueDate(null);
              }
            }}
            trackColor={{ true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>

        {/* Non-repeatable: plain due date picker */}
        {!repeatable && (
          <>
            <Text style={styles.sectionLabel}>Due Date</Text>
            <DateInput
              value={dueDate}
              onChange={(v) => { setDueDate(v); if (!v) setDueTime(null); }}
            />
            {dueDate && (
              <TimeInput value={dueTime} onChange={setDueTime} />
            )}
          </>
        )}

        {repeatable && (
          <>
            <Text style={styles.sectionLabel}>Repeat Schedule</Text>
            <View style={styles.scheduleTypeRow}>
              {(['unlimited', 'hours', 'days', 'weeks', 'months', 'weekdays'] as RepeatSchedule['type'][]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.scheduleChip, scheduleType === t && styles.scheduleChipActive]}
                  onPress={() => setScheduleType(t)}
                >
                  <Text style={[styles.scheduleChipText, scheduleType === t && styles.scheduleChipTextActive]}>
                    {t === 'unlimited' ? 'Always' : t === 'weekdays' ? 'Weekdays' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(scheduleType === 'hours' || scheduleType === 'days' || scheduleType === 'weeks' || scheduleType === 'months') && (
              <View style={styles.everyRow}>
                <Text style={styles.everyLabel}>Every</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setScheduleEvery((n) => Math.max(1, n - 1))}>
                  <Ionicons name="remove" size={18} color="#a855f7" />
                </TouchableOpacity>
                <Text style={styles.everyValue}>{scheduleEvery}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setScheduleEvery((n) => n + 1)}>
                  <Ionicons name="add" size={18} color="#a855f7" />
                </TouchableOpacity>
                <Text style={styles.everyLabel}>
                  {scheduleType === 'hours' ? 'hour' : scheduleType.replace(/s$/, '')}{scheduleEvery !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {scheduleType === 'weekdays' && (
              <View style={styles.weekdayRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label, idx) => {
                  const active = scheduleWeekdays.includes(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() =>
                        setScheduleWeekdays((prev) =>
                          active ? prev.filter((d) => d !== idx) : [...prev, idx]
                        )
                      }
                    >
                      <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Due Every — for repeatable quests */}
            <Text style={styles.sectionLabel}>Due Every</Text>
            <View style={styles.scheduleTypeRow}>
              <TouchableOpacity
                style={[styles.scheduleChip, !dueDateScheduleEnabled && styles.dueDateChipActive]}
                onPress={() => { setDueDateScheduleEnabled(false); setDueDate(null); }}
              >
                <Text style={[styles.scheduleChipText, !dueDateScheduleEnabled && styles.dueDateChipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {(['hours', 'days', 'weeks', 'months', 'weekdays'] as DueDateScheduleType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.scheduleChip, dueDateScheduleEnabled && dueDateScheduleType === t && styles.dueDateChipActive]}
                  onPress={() => { setDueDateScheduleEnabled(true); setDueDateScheduleType(t); }}
                >
                  <Text style={[styles.scheduleChipText, dueDateScheduleEnabled && dueDateScheduleType === t && styles.dueDateChipTextActive]}>
                    {t === 'weekdays' ? 'Weekdays' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {dueDateScheduleEnabled && (dueDateScheduleType === 'hours' || dueDateScheduleType === 'days' || dueDateScheduleType === 'weeks' || dueDateScheduleType === 'months') && (
              <View style={styles.everyRow}>
                <Text style={styles.everyLabel}>Every</Text>
                <TouchableOpacity style={styles.stepBtnBlue} onPress={() => setDueDateScheduleEvery((n) => Math.max(1, n - 1))}>
                  <Ionicons name="remove" size={18} color="#0ea5e9" />
                </TouchableOpacity>
                <Text style={styles.everyValue}>{dueDateScheduleEvery}</Text>
                <TouchableOpacity style={styles.stepBtnBlue} onPress={() => setDueDateScheduleEvery((n) => n + 1)}>
                  <Ionicons name="add" size={18} color="#0ea5e9" />
                </TouchableOpacity>
                <Text style={styles.everyLabel}>
                  {dueDateScheduleType === 'hours' ? 'hour' : dueDateScheduleType.replace(/s$/, '')}{dueDateScheduleEvery !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {dueDateScheduleEnabled && dueDateScheduleType === 'weekdays' && (
              <View style={styles.weekdayRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label, idx) => {
                  const active = dueDateScheduleWeekdays.includes(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dayChip, active && styles.dueDateDayChipActive]}
                      onPress={() =>
                        setDueDateScheduleWeekdays((prev) =>
                          active ? prev.filter((d) => d !== idx) : [...prev, idx]
                        )
                      }
                    >
                      <Text style={[styles.dayChipText, active && styles.dueDateDayChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {dueDateScheduleEnabled && (
              <>
                <Text style={styles.sectionLabel}>Starting</Text>
                <DateInput
                  value={dueDate}
                  onChange={(v) => { setDueDate(v); if (!v) setDueTime(null); }}
                />
                {dueDate && (
                  <TimeInput value={dueTime} onChange={setDueTime} />
                )}
              </>
            )}
          </>
        )}

        {!hasParent && hasSubQuests && (
          <>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.sectionLabel}>Auto-complete</Text>
                <Text style={styles.switchHint}>Completes automatically when all sub-quests are done</Text>
              </View>
              <Switch
                value={autoCompleteOnSubQuests}
                onValueChange={setAutoCompleteOnSubQuests}
                trackColor={{ true: '#7c3aed' }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionLabel}>Sub-quests</Text>
            <View style={styles.subQuestList}>
              {subQuests.map((sub) => (
                <View key={sub.id} style={styles.subQuestRow}>
                  <Text style={styles.subQuestName} numberOfLines={1}>{sub.name}</Text>
                  <Tooltip label="Detach sub-quest">
                    <TouchableOpacity
                      onPress={() => handleDetachSubQuest(sub.id)}
                      style={styles.subQuestBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </Tooltip>
                </View>
              ))}
            </View>
          </>
        )}

        {rootQuests.length > 0 && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.sectionLabel}>Sub-quest</Text>
              <Switch
                value={hasParent}
                onValueChange={(v) => {
                  setHasParent(v);
                  if (v && rootQuests.length > 0) { setParentId(rootQuests[0].id); } else { setParentId(null); }
                }}
                trackColor={{ true: '#7c3aed' }}
                thumbColor="#fff"
              />
            </View>
            {hasParent && parentOptions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Parent Quest</Text>
                <SelectPicker
                  value={parentId ?? rootQuests[0].id}
                  onValueChange={(v) => setParentId(v)}
                  options={parentOptions}
                  style={styles.picker}
                />
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.sectionLabel}>Auto-complete parent</Text>
                    <Text style={styles.switchHint}>Parent completes when all sub-quests are done</Text>
                  </View>
                  <Switch
                    value={parentAutoComplete}
                    onValueChange={setParentAutoComplete}
                    trackColor={{ true: '#7c3aed' }}
                    thumbColor="#fff"
                  />
                </View>
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
            <Text style={styles.saveText}>{editQuest ? 'Update Quest' : 'Post Quest'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <IconPickerModal
        visible={showIconPicker}
        skillName={name.trim() || 'Quest'}
        currentIcon={icon}
        currentColor={iconColor}
        onConfirm={(newIcon, newColor) => {
          setIcon(newIcon);
          setIconColor(newIcon ? newColor : null);
        }}
        onClose={() => setShowIconPicker(false)}
      />
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
  detailsInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sliderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderValue: {
    color: '#475569',
    fontSize: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  xpPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7c3aed22',
    borderWidth: 1,
    borderColor: '#7c3aed44',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpPreviewText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
  },
  goldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFD70011',
    borderWidth: 1,
    borderColor: '#FFD70033',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goldInput: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  goldLabel: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  costInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0ea5e911',
    borderWidth: 1,
    borderColor: '#0ea5e933',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  costInput: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  costInputAmber: {
    color: '#4ade80',
  },
  costInputRowAmber: {
    backgroundColor: '#4ade8011',
    borderColor: '#4ade8033',
  },
  inputDisabled: {
    opacity: 0.35,
  },
  inputTextDisabled: {
    color: '#475569',
  },
  costLabelBlue: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '700',
  },
  costLabelAmber: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '700',
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
  switchHint: {
    color: '#334155',
    fontSize: 11,
    marginTop: 2,
  },
  scheduleTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scheduleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
  },
  scheduleChipActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed22',
  },
  scheduleChipText: { color: '#64748b', fontSize: 13 },
  scheduleChipTextActive: { color: '#a855f7', fontWeight: '600' },
  everyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  everyLabel: { color: '#64748b', fontSize: 14 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c3aed44',
    backgroundColor: '#7c3aed11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  everyValue: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  weekdayRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
  },
  dayChipActive: { borderColor: '#7c3aed', backgroundColor: '#7c3aed22' },
  dayChipText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: '#a855f7' },
  dueDateChipActive: { borderColor: '#0ea5e9', backgroundColor: '#0ea5e922' },
  dueDateChipTextActive: { color: '#0ea5e9', fontWeight: '600' },
  dueDateDayChipActive: { borderColor: '#0ea5e9', backgroundColor: '#0ea5e922' },
  dueDateDayChipTextActive: { color: '#0ea5e9' },
  stepBtnBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e944',
    backgroundColor: '#0ea5e911',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  xpRowText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
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
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0a0a0f',
  },
  iconPickerPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerPreviewEmpty: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0d0d14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  iconPickerLabelEmpty: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
  },
  classChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
  },
  classChipActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed22',
  },
  classChipText: { color: '#64748b', fontSize: 13 },
  classChipTextActive: { color: '#a855f7', fontWeight: '600' },
  subQuestList: {
    borderWidth: 1,
    borderColor: '#1e1e2e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  subQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  subQuestName: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
  },
  subQuestBtn: {
    padding: 4,
  },
});
