import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroClassDef, HeroClassRequirement, Tier, TIER_LABELS, TIER_COLORS, getTier } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { HERO_CLASSES } from '../../data/heroClasses';
import { SkillChip } from '../shared/SkillChip';
import { IconPickerModal } from '../skills/IconPickerModal';
import { getSkillLevels } from '../../utils/skillLevels';
import { getClassLevel } from '../../utils/classLevels';
import { calcLevel } from '../../utils/xp';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#FFD700', '#ADFF2F',
  '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  '#94a3b8', '#e2e8f0',
];


const REQ_TYPES = [
  { key: 'skill', label: 'Skill' },
  { key: 'playerLevel', label: 'Player Lv' },
  { key: 'classLevel', label: 'Class Lv' },
  { key: 'questsCompleted', label: 'Quests' },
] as const;

interface Props {
  visible: boolean;
  editClass?: HeroClassDef | null;
  onClose: () => void;
}

export function ClassFormModal({ visible, editClass, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#a855f7');
  const [icon, setIcon] = useState('star-outline');
  const [requirements, setRequirements] = useState<HeroClassRequirement[]>([]);
  const [focusedReqIdx, setFocusedReqIdx] = useState<number | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { addCustomClass, updateCustomClass, customClasses, heroClass, threshold, setHeroClass, lockClass } = useCharacterStore(
    useShallow((s) => ({
      addCustomClass: s.addCustomClass,
      updateCustomClass: s.updateCustomClass,
      customClasses: s.customClasses,
      heroClass: s.heroClass,
      threshold: s.threshold,
      setHeroClass: s.setHeroClass,
      lockClass: s.lockClass,
    }))
  );
  const allSkills = useQuestStore(useShallow((s) => s.getAllSkills()));
  const log = useQuestStore((s) => s.log);

  const allClassNames = useMemo(
    () => [...HERO_CLASSES.map((c) => c.name), ...customClasses.map((c) => c.name)],
    [customClasses]
  );

  useEffect(() => {
    if (visible) {
      setName(editClass?.name ?? '');
      setDescription(editClass?.description ?? '');
      setColor(editClass?.color ?? '#a855f7');
      setIcon(editClass?.icon ?? 'star-outline');
      setRequirements(editClass?.requirements ?? []);
    }
  }, [visible, editClass]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    const input = {
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      requirements: requirements.filter((r) => {
        if (r.type === 'skill') return r.skill.trim().length > 0;
        if (r.type === 'classLevel') return r.className.trim().length > 0;
        return true;
      }),
    };
    if (editClass) {
      updateCustomClass(editClass.id, input);
      // If this class is currently equipped, check if the player still meets the new requirements
      if (heroClass === editClass.name) {
        const skillLevels = getSkillLevels(log);
        const playerLevel = calcLevel(threshold);
        const questCount = log.length;
        const stillMeets = input.requirements.every((r) => {
          switch (r.type) {
            case 'skill': return (skillLevels[r.skill] ?? 0) >= r.level;
            case 'playerLevel': return playerLevel >= r.level;
            case 'classLevel': return getClassLevel(log, r.className) >= r.level;
            case 'questsCompleted': {
              const qualifying = log.filter(
                (e) =>
                  (r.allowedDifficulties.length === 0 || r.allowedDifficulties.length === 4 || r.allowedDifficulties.includes(getTier(e.difficulty))) &&
                  (r.allowedUrgencies.length === 0 || r.allowedUrgencies.length === 4 || r.allowedUrgencies.includes(getTier(e.urgency)))
              );
              return qualifying.length >= r.count;
            }
            default: return true;
          }
        });
        if (!stillMeets) {
          lockClass(editClass.name);
          setHeroClass('Adventurer');
        }
      }
    } else {
      addCustomClass(input);
    }
    onClose();
  };

  const addRequirement = () =>
    setRequirements((prev) => [...prev, { type: 'skill' as const, skill: '', level: 1 }]);

  const changeReqType = (index: number, newType: HeroClassRequirement['type']) => {
    setRequirements((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        switch (newType) {
          case 'skill': return { type: 'skill', skill: '', level: 1 };
          case 'playerLevel': return { type: 'playerLevel', level: 1 };
          case 'classLevel': return { type: 'classLevel', className: '', level: 1 };
          case 'questsCompleted': return { type: 'questsCompleted', count: 1, allowedDifficulties: ['easy', 'medium', 'hard', 'very_hard'], allowedUrgencies: ['easy', 'medium', 'hard', 'very_hard'] };
        }
      })
    );
  };

  const updateReqLevel = (index: number, delta: number) =>
    setRequirements((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        return { ...r, level: Math.max(1, (r as any).level + delta) };
      })
    );

  const updateReqText = (index: number, value: string) =>
    setRequirements((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        if (r.type === 'skill') return { ...r, skill: value };
        if (r.type === 'classLevel') return { ...r, className: value };
        return r;
      })
    );

  const updateQuestsCount = (index: number, delta: number) =>
    setRequirements((prev) =>
      prev.map((r, i) => {
        if (i !== index || r.type !== 'questsCompleted') return r;
        return { ...r, count: Math.max(1, r.count + delta) };
      })
    );

  const toggleQuestsTier = (index: number, field: 'allowedDifficulties' | 'allowedUrgencies', tier: Tier) =>
    setRequirements((prev) =>
      prev.map((r, i) => {
        if (i !== index || r.type !== 'questsCompleted') return r;
        const current = r[field];
        const updated = current.includes(tier)
          ? current.filter((t) => t !== tier)
          : [...current, tier];
        return { ...r, [field]: updated };
      })
    );

  const removeReq = (index: number) =>
    setRequirements((prev) => prev.filter((_, i) => i !== index));

  const getReqValue = (r: HeroClassRequirement): number =>
    r.type === 'questsCompleted' ? r.count : r.level;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.heading}>{editClass ? 'Edit Class' : 'New Class'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview */}
          <View style={[styles.preview, { borderColor: color + '44', backgroundColor: color + '11' }]}>
            <View style={[styles.previewIcon, { backgroundColor: color + '22', borderColor: color + '44' }]}>
              <Ionicons name={icon as any} size={28} color={color} />
            </View>
            <Text style={[styles.previewName, { color }]}>{name || 'Class Name'}</Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Class Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ranger, Ninja, Chef..."
              placeholderTextColor="#334155"
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="A short flavour text..."
              placeholderTextColor="#334155"
              returnKeyType="done"
            />
          </View>

          {/* Color */}
          <View style={styles.field}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    color === c && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={14} color="#0a0a0f" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon */}
          <View style={styles.field}>
            <Text style={styles.label}>Icon</Text>
            <TouchableOpacity
              style={[styles.iconPickerBtn, { borderColor: color + '55', backgroundColor: color + '11' }]}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={[styles.iconPickerPreview, { borderColor: color + '44', backgroundColor: color + '22' }]}>
                <Ionicons name={icon as any} size={24} color={color} />
              </View>
              <Text style={[styles.iconPickerLabel, { color }]}>{icon.replace(/-outline$/, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Requirements */}
          <View style={styles.field}>
            <Text style={styles.label}>Requirements</Text>
            {requirements.map((req, idx) => {
              // Autocomplete chips for skill / classLevel text inputs
              const q = req.type === 'skill'
                ? req.skill.trim().toLowerCase()
                : req.type === 'classLevel'
                  ? req.className.trim().toLowerCase()
                  : '';
              const usedSkills = requirements
                .filter((r): r is Extract<HeroClassRequirement, { type: 'skill' }> => r.type === 'skill')
                .map((r) => r.skill.trim())
                .filter(Boolean);
              const chips =
                req.type === 'skill'
                  ? allSkills.filter((s) => !usedSkills.includes(s) && (!q || s.toLowerCase().includes(q)))
                  : req.type === 'classLevel'
                    ? allClassNames.filter((c) => !q || c.toLowerCase().includes(q))
                    : [];

              return (
                <View key={idx} style={styles.reqBlock}>
                  {/* Type selector row */}
                  <View style={styles.reqTypeRow}>
                    <View style={styles.reqTypePills}>
                      {REQ_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.key}
                          style={[styles.typePill, req.type === t.key && styles.typePillActive]}
                          onPress={() => changeReqType(idx, t.key)}
                        >
                          <Text style={[styles.typePillText, req.type === t.key && styles.typePillTextActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => removeReq(idx)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={20} color="#475569" />
                    </TouchableOpacity>
                  </View>

                  {/* Type-specific inputs */}
                  <View style={styles.reqRow}>
                    {(req.type === 'skill' || req.type === 'classLevel') && (
                      <TextInput
                        style={[styles.input, styles.reqTextInput]}
                        value={req.type === 'skill' ? req.skill : req.className}
                        onChangeText={(v) => updateReqText(idx, v)}
                        onFocus={() => setFocusedReqIdx(idx)}
                        onBlur={() =>
                          setTimeout(
                            () => setFocusedReqIdx((prev) => (prev === idx ? null : prev)),
                            150
                          )
                        }
                        placeholder={req.type === 'skill' ? 'Skill name' : 'Class name'}
                        placeholderTextColor="#334155"
                        returnKeyType="done"
                      />
                    )}
                    {req.type === 'playerLevel' && (
                      <Text style={styles.reqStaticLabel}>Player level</Text>
                    )}
                    {req.type !== 'questsCompleted' && (
                      <View style={styles.reqStepper}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateReqLevel(idx, -1)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepValue}>{getReqValue(req)}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => updateReqLevel(idx, 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Quests-completed fields */}
                  {req.type === 'questsCompleted' && (
                    <View style={styles.questsFields}>
                      {/* Count */}
                      <View style={styles.questsRow}>
                        <Text style={styles.questsFieldLabel}>Count</Text>
                        <View style={styles.reqStepper}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuestsCount(idx, -1)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                            <Text style={styles.stepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepValue}>{req.count}</Text>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuestsCount(idx, 1)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {/* Difficulty badges */}
                      <View style={styles.questsRow}>
                        <Text style={styles.questsFieldLabel}>Difficulty</Text>
                        <View style={styles.tierBadgeRow}>
                          {(Object.keys(TIER_LABELS) as Tier[]).map((tier) => {
                            const active = req.allowedDifficulties.includes(tier);
                            const tc = TIER_COLORS[tier];
                            return (
                              <TouchableOpacity
                                key={tier}
                                style={[styles.tierBadge, active && { borderColor: tc, backgroundColor: tc + '33' }]}
                                onPress={() => toggleQuestsTier(idx, 'allowedDifficulties', tier)}
                              >
                                <Text style={[styles.tierBadgeText, active && { color: tc }]}>
                                  {TIER_LABELS[tier]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      {/* Urgency badges */}
                      <View style={styles.questsRow}>
                        <Text style={styles.questsFieldLabel}>Urgency</Text>
                        <View style={styles.tierBadgeRow}>
                          {(Object.keys(TIER_LABELS) as Tier[]).map((tier) => {
                            const active = req.allowedUrgencies.includes(tier);
                            const tc = TIER_COLORS[tier];
                            return (
                              <TouchableOpacity
                                key={tier}
                                style={[styles.tierBadge, active && { borderColor: tc, backgroundColor: tc + '33' }]}
                                onPress={() => toggleQuestsTier(idx, 'allowedUrgencies', tier)}
                              >
                                <Text style={[styles.tierBadgeText, active && { color: tc }]}>
                                  {TIER_LABELS[tier]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Autocomplete chips */}
                  {focusedReqIdx === idx && chips.length > 0 && (
                    <View style={styles.chipList}>
                      {chips.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={styles.chip}
                          onPress={() => {
                            updateReqText(idx, s);
                            setFocusedReqIdx(null);
                          }}
                        >
                          {req.type === 'skill' ? (
                            <SkillChip name={s} textStyle={styles.chipText} iconSize={12} />
                          ) : (
                            <Text style={styles.chipText}>{s}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <TouchableOpacity style={styles.addReqBtn} onPress={addRequirement}>
              <Ionicons name="add-circle-outline" size={16} color="#7c3aed" />
              <Text style={styles.addReqText}>Add Requirement</Text>
            </TouchableOpacity>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, canSave ? { backgroundColor: color } : styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              {editClass ? 'Save Changes' : 'Create Class'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <IconPickerModal
        visible={showIconPicker}
        skillName={name || 'Class Icon'}
        currentIcon={icon}
        currentColor={color}
        onConfirm={(newIcon) => { if (newIcon) setIcon(newIcon); }}
        onClose={() => setShowIconPicker(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    backgroundColor: '#12121a',
  },
  heading: { color: '#e2e8f0', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: 18, fontWeight: '700' },
  field: { gap: 8 },
  label: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optional: { color: '#334155', fontWeight: '500', textTransform: 'none' },
  input: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 14,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconPickerPreview: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  reqBlock: { gap: 6, marginBottom: 6 },
  reqTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqTypePills: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
  },
  typePillActive: {
    borderColor: '#7c3aed55',
    backgroundColor: '#7c3aed22',
  },
  typePillText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: '#a855f7',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqTextInput: { flex: 1 },
  reqStaticLabel: {
    flex: 1,
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  questsFields: {
    gap: 8,
    paddingLeft: 4,
  },
  questsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  questsFieldLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    width: 60,
  },
  tierBadgeRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'flex-end',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    backgroundColor: '#0a0a0f',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#12121a',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: '#64748b', fontSize: 12 },
  reqStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12121a',
  },
  stepBtnText: { color: '#a855f7', fontSize: 18, fontWeight: '300', lineHeight: 20 },
  stepValue: {
    minWidth: 32,
    textAlign: 'center',
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: { padding: 2 },
  addReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addReqText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: '#1e1e2e' },
  saveBtnText: { color: '#0a0a0f', fontSize: 15, fontWeight: '700' },
  saveBtnTextDisabled: { color: '#334155' },
});
