import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateInputProps {
  value: string | null; // YYYY-MM-DD or null
  onChange: (value: string | null) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="calendar-outline" size={16} color="#475569" />
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange((e.target as HTMLInputElement).value || null)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: value ? '#e2e8f0' : '#475569',
          fontSize: 14,
          outline: 'none',
          colorScheme: 'dark',
          paddingLeft: 6,
          cursor: 'pointer',
        } as React.CSSProperties}
      />
      {value && (
        <TouchableOpacity
          onPress={() => onChange(null)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={16} color="#475569" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
});
