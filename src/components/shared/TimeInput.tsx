import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeInputProps {
  value: string | null; // HH:MM or null
  onChange: (value: string | null) => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseTimeParts(value: string | null): [number, number] {
  if (value) {
    const [h, m] = value.split(':').map(Number);
    return [h, m];
  }
  return [12, 0];
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const [hour, setHour] = useState(() => parseTimeParts(value)[0]);
  const [minute, setMinute] = useState(() => parseTimeParts(value)[1]);

  const emit = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);

  const adjustHour = (delta: number) => {
    const next = (hour + delta + 24) % 24;
    setHour(next);
    emit(next, minute);
  };

  const adjustMinute = (delta: number) => {
    const next = (minute + delta + 60) % 60;
    setMinute(next);
    emit(hour, next);
  };

  if (!value) {
    return (
      <TouchableOpacity
        style={styles.setBtn}
        onPress={() => { setHour(12); setMinute(0); emit(12, 0); }}
      >
        <Ionicons name="time-outline" size={16} color="#475569" />
        <Text style={styles.setBtnText}>Set time</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Stepper label="Hour" value={pad(hour)} onUp={() => adjustHour(1)} onDown={() => adjustHour(-1)} />
      <Text style={styles.sep}>:</Text>
      <Stepper label="Min" value={pad(minute)} onUp={() => adjustMinute(5)} onDown={() => adjustMinute(-5)} />
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => onChange(null)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={18} color="#475569" />
      </TouchableOpacity>
    </View>
  );
}

function Stepper({
  label, value, onUp, onDown,
}: { label: string; value: string; onUp: () => void; onDown: () => void }) {
  return (
    <View style={stepStyles.wrap}>
      <Text style={stepStyles.label}>{label}</Text>
      <TouchableOpacity onPress={onUp} hitSlop={{ top: 6, bottom: 4, left: 8, right: 8 }}>
        <Ionicons name="chevron-up" size={16} color="#a855f7" />
      </TouchableOpacity>
      <Text style={stepStyles.value}>{value}</Text>
      <TouchableOpacity onPress={onDown} hitSlop={{ top: 4, bottom: 6, left: 8, right: 8 }}>
        <Ionicons name="chevron-down" size={16} color="#a855f7" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  setBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  setBtnText: { color: '#475569', fontSize: 14 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  sep: { color: '#334155', fontSize: 16, marginHorizontal: 2 },
  clearBtn: { marginLeft: 6 },
});

const stepStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 1 },
  label: { color: '#334155', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', minWidth: 28, textAlign: 'center' },
});
