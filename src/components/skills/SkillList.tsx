import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuestStore } from '../../store/questStore';
import { useShallow } from 'zustand/react/shallow';
import { IconPickerModal, DEFAULT_SKILL_COLOR } from './IconPickerModal';

interface SkillStat {
  name: string;
  count: number;
  xp: number;
  level: number;
  progress: number;
}

const XP_PER_LEVEL = 100;

export function SkillList() {
  const { log, quests } = useQuestStore(useShallow((s) => ({ log: s.log, quests: s.quests })));
  const { skillIcons, skillColors, standaloneSkills, setSkillIcon, setSkillColor, addStandaloneSkill, renameSkill, deleteSkill } = useQuestStore(
    useShallow((s) => ({
      skillIcons: s.skillIcons,
      skillColors: s.skillColors,
      standaloneSkills: s.standaloneSkills,
      setSkillIcon: s.setSkillIcon,
      setSkillColor: s.setSkillColor,
      addStandaloneSkill: s.addStandaloneSkill,
      renameSkill: s.renameSkill,
      deleteSkill: s.deleteSkill,
    }))
  );
  const [pickerSkill, setPickerSkill] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  const stats = useMemo(() => {
    const map = new Map<string, SkillStat>();
    for (const entry of log) {
      for (const skill of entry.skills) {
        const existing = map.get(skill);
        if (existing) {
          existing.xp += entry.xpAwarded;
        } else {
          map.set(skill, { name: skill, count: 0, xp: entry.xpAwarded, level: 0, progress: 0 });
        }
      }
    }
    // Include standalone skills not yet in the log
    for (const skill of standaloneSkills) {
      if (!map.has(skill)) {
        map.set(skill, { name: skill, count: 0, xp: 0, level: 0, progress: 0 });
      }
    }
    // Count uncompleted quests per skill; also surfaces skills not yet in the log
    for (const quest of quests) {
      if (quest.completedAt !== null) continue;
      for (const skill of quest.skills) {
        const existing = map.get(skill);
        if (existing) { existing.count++; }
        else { map.set(skill, { name: skill, count: 1, xp: 0, level: 0, progress: 0 }); }
      }
    }
    const result = Array.from(map.values());
    for (const stat of result) {
      stat.level = Math.floor(stat.xp / XP_PER_LEVEL);
      stat.progress = stat.xp % XP_PER_LEVEL;
    }
    return result.sort((a, b) => b.xp - a.xp);
  }, [log, standaloneSkills, quests]);

  const handleConfirmAdd = () => {
    const trimmed = newSkillName.trim();
    if (trimmed) addStandaloneSkill(trimmed);
    setNewSkillName('');
    setAdding(false);
  };

  const addInputRow = adding && (
    <View style={styles.addRow}>
      <TextInput
        style={styles.addInput}
        value={newSkillName}
        onChangeText={setNewSkillName}
        placeholder="Skill name..."
        placeholderTextColor="#475569"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleConfirmAdd}
      />
      <TouchableOpacity
        style={[styles.addConfirmBtn, !newSkillName.trim() && styles.addConfirmBtnDisabled]}
        onPress={handleConfirmAdd}
        disabled={!newSkillName.trim()}
      >
        <Ionicons name="checkmark" size={18} color={newSkillName.trim() ? '#a855f7' : '#334155'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addCancelBtn}
        onPress={() => { setNewSkillName(''); setAdding(false); }}
      >
        <Ionicons name="close" size={18} color="#475569" />
      </TouchableOpacity>
    </View>
  );

  if (stats.length === 0) {
    return (
      <View style={styles.emptyWrapper}>
        <View style={styles.listHeader}>
          <TouchableOpacity style={styles.addFab} onPress={() => setAdding((v) => !v)}>
            <Ionicons name={adding ? 'close' : 'add'} size={18} color="#a855f7" />
            <Text style={styles.addFabText}>{adding ? 'Cancel' : 'New Skill'}</Text>
          </TouchableOpacity>
        </View>
        {addInputRow}
        {!adding && (
          <View style={styles.empty}>
            <Ionicons name="flash-outline" size={48} color="#1e1e2e" />
            <Text style={styles.emptyText}>No skills yet</Text>
            <Text style={styles.emptySubtext}>
              Complete quests with skills, or add one above
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      <View style={styles.listHeader}>
        <TouchableOpacity style={styles.addFab} onPress={() => setAdding((v) => !v)}>
          <Ionicons name={adding ? 'close' : 'add'} size={18} color="#a855f7" />
          <Text style={styles.addFabText}>{adding ? 'Cancel' : 'New Skill'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stats}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={addInputRow || undefined}
        renderItem={({ item }) => (
          <SkillRow
            item={item}
            icon={(skillIcons[item.name] as keyof typeof Ionicons.glyphMap) ?? null}
            color={skillColors[item.name] ?? null}
            onPressIcon={() => setPickerSkill(item.name)}
          />
        )}
        removeClippedSubviews={Platform.OS !== 'web'}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {pickerSkill && (
        <IconPickerModal
          visible
          skillName={pickerSkill}
          currentIcon={skillIcons[pickerSkill] ?? null}
          currentColor={skillColors[pickerSkill] ?? null}
          onConfirm={(icon, color) => {
            setSkillIcon(pickerSkill, icon);
            setSkillColor(pickerSkill, color);
          }}
          onClose={() => setPickerSkill(null)}
          onRename={(newName) => { renameSkill(pickerSkill, newName); setPickerSkill(newName); }}
          onDelete={() => { deleteSkill(pickerSkill); setPickerSkill(null); }}
        />
      )}
    </>
  );
}

function SkillRow({
  item,
  icon,
  color,
  onPressIcon,
}: {
  item: SkillStat;
  icon: keyof typeof Ionicons.glyphMap | null;
  color: string | null;
  onPressIcon: () => void;
}) {
  const progressPct = item.progress / XP_PER_LEVEL;
  const activeColor = color ?? DEFAULT_SKILL_COLOR;
  const hasBadge = !!icon;

  return (
    <View style={styles.row}>
      {/* Icon / level badge */}
      <TouchableOpacity
        style={[
          styles.badge,
          hasBadge
            ? { borderColor: activeColor + '66', backgroundColor: activeColor + '22' }
            : { borderColor: '#1e1e2e', backgroundColor: '#0d0d14' },
        ]}
        onPress={onPressIcon}
        activeOpacity={0.7}
      >
        {icon ? (
          <Ionicons name={icon} size={22} color={activeColor} />
        ) : (
          <Ionicons name="add" size={18} color="#334155" />
        )}
        <Text style={[styles.levelValue, hasBadge && { color: activeColor + 'cc' }]}>
          {item.level}
        </Text>
      </TouchableOpacity>

      {/* Name + progress bar */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.skillName}>{item.name}</Text>
          <Text style={[styles.xpText, { color: activeColor }]}>{item.xp} XP</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progressPct * 100}%` as any, backgroundColor: activeColor }]} />
        </View>
        <Text style={styles.progressLabel}>
          {item.progress} / {XP_PER_LEVEL} to next level · {item.count} active quest{item.count !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 40,
  },
  emptyText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#334155', fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  badge: {
    width: 48,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#0d0d14',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  levelValue: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  info: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  skillName: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  xpText: { color: '#7c3aed', fontSize: 12, fontWeight: '700' },
  barTrack: {
    height: 6,
    backgroundColor: '#1e1e2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: { color: '#475569', fontSize: 11 },
  separator: { height: 1, backgroundColor: '#1e1e2e', marginHorizontal: 16 },
  emptyWrapper: { flex: 1 },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  addFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed18',
    borderWidth: 1,
    borderColor: '#7c3aed44',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addFabText: { color: '#a855f7', fontSize: 13, fontWeight: '600' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e2e8f0',
    fontSize: 14,
  },
  addConfirmBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c3aed44',
    backgroundColor: '#7c3aed18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmBtnDisabled: {
    borderColor: '#1e1e2e',
    backgroundColor: 'transparent',
  },
  addCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
