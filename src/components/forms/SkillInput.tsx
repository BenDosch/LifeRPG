import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useQuestStore } from '../../store/questStore';
import { SkillChip } from '../shared/SkillChip';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  onPendingChange?: (pending: string) => void;
}

export function SkillInput({ skills, onChange, onPendingChange }: SkillInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [inputValue, setInputValue] = useState('');
  const allSkills = useQuestStore(useShallow((s) => s.getAllSkills()));

  // All existing skills not yet selected, filtered by current input
  const availableChips = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return allSkills.filter((s) => {
      if (skills.includes(s)) return false;
      if (q) return s.toLowerCase().includes(q);
      return true;
    });
  }, [allSkills, skills, inputValue]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    onPendingChange?.(text);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInputValue('');
    onPendingChange?.('');
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  return (
    <View style={styles.container}>
      {/* Selected skill tags */}
      {skills.length > 0 && (
        <View style={styles.tags}>
          {skills.map((skill) => (
            <View key={skill} style={styles.tag}>
              <SkillChip name={skill} textStyle={styles.tagText} iconSize={12} />
              <TouchableOpacity onPress={() => removeSkill(skill)}>
                <Ionicons name="close" size={12} color="#a855f7" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="Add skill..."
          placeholderTextColor={theme.textDisabled}
          onSubmitEditing={() => addSkill(inputValue)}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {inputValue.trim() ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addSkill(inputValue)}
          >
            <Ionicons name="add" size={18} color="#a855f7" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Existing skill chips */}
      {availableChips.length > 0 && (
        <View style={styles.chipList}>
          {availableChips.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.chip}
              onPress={() => addSkill(s)}
            >
              <SkillChip name={s} textStyle={styles.chipText} iconSize={12} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: { gap: 8 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#7c3aed22',
      borderWidth: 1,
      borderColor: '#7c3aed44',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: { color: '#a855f7', fontSize: 12 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      paddingVertical: 8,
    },
    addBtn: { padding: 4 },
    chipList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.textTertiary,
      backgroundColor: theme.bgCard,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipText: { color: theme.textMuted, fontSize: 12 },
  });
}
