import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface TimeInputProps {
  value: string | null; // HH:MM or null
  onChange: (value: string | null) => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timeToDate(time: string | null): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(12, 0, 0, 0);
  }
  return d;
}

function formatDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${meridiem}`;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const [show, setShow] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(`${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`);
  };

  if (!value && !show) {
    return (
      <TouchableOpacity
        style={styles.setBtn}
        onPress={() => setShow(true)}
      >
        <Ionicons name="time-outline" size={16} color={theme.textDisabled} />
        <Text style={styles.setBtnText}>Set time</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {value && (
        <View style={styles.valueRow}>
          <TouchableOpacity onPress={() => setShow((v) => !v)}>
            <Text style={styles.valueText}>{formatDisplay(value)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onChange(null); setShow(false); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={theme.textDisabled} />
          </TouchableOpacity>
        </View>
      )}

      {show && (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          themeVariant="dark"
        />
      )}
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    setBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignSelf: 'flex-start',
    },
    setBtnText: { color: theme.textDisabled, fontSize: 14 },
    container: {
      gap: 8,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    valueText: {
      color: '#a855f7',
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
