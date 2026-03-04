import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkillAutocomplete } from '../../hooks/useSkillAutocomplete';

interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillInput({ skills, onChange }: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');
  const suggestions = useSkillAutocomplete(inputValue);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInputValue('');
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  return (
    <View style={styles.container}>
      {/* Existing skills */}
      <View style={styles.tags}>
        {skills.map((skill) => (
          <View key={skill} style={styles.tag}>
            <Text style={styles.tagText}>{skill}</Text>
            <TouchableOpacity onPress={() => removeSkill(skill)}>
              <Ionicons name="close" size={12} color="#a855f7" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Add skill..."
          placeholderTextColor="#475569"
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

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.suggestion}
              onPress={() => addSkill(s)}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    paddingVertical: 8,
  },
  addBtn: { padding: 4 },
  suggestions: {
    backgroundColor: '#12121a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  suggestionText: { color: '#94a3b8', fontSize: 13 },
});
