import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface DateInputProps {
  value: string | null; // YYYY-MM-DD or null
  onChange: (value: string | null) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Ionicons name="calendar-outline" size={16} color={theme.textDisabled} />
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange((e.target as HTMLInputElement).value || null)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: value ? theme.textPrimary : theme.textDisabled,
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
          <Ionicons name="close-circle" size={16} color={theme.textDisabled} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 4,
    },
  });
}
