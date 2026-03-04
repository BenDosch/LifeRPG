import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateInputProps {
  value: string | null; // YYYY-MM-DD or null
  onChange: (value: string | null) => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseDateParts(value: string | null): [number, number, number] {
  if (value) {
    const d = new Date(value + 'T00:00:00');
    return [d.getDate(), d.getMonth() + 1, d.getFullYear()];
  }
  const now = new Date();
  return [now.getDate(), now.getMonth() + 1, now.getFullYear()];
}

export function DateInput({ value, onChange }: DateInputProps) {
  const [day, setDay] = useState(() => parseDateParts(value)[0]);
  const [month, setMonth] = useState(() => parseDateParts(value)[1]);
  const [year, setYear] = useState(() => parseDateParts(value)[2]);

  const emit = (d: number, m: number, y: number) => {
    onChange(`${y}-${pad(m)}-${pad(d)}`);
  };

  const adjustDay = (delta: number) => {
    const max = daysInMonth(year, month);
    const next = ((day - 1 + delta + max) % max) + 1;
    setDay(next);
    emit(next, month, year);
  };

  const adjustMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    const d = Math.min(day, daysInMonth(y, m));
    setMonth(m); setYear(y); setDay(d);
    emit(d, m, y);
  };

  const adjustYear = (delta: number) => {
    const y = year + delta;
    const d = Math.min(day, daysInMonth(y, month));
    setYear(y); setDay(d);
    emit(d, month, y);
  };

  if (!value) {
    return (
      <TouchableOpacity
        style={styles.setBtn}
        onPress={() => {
          const now = new Date();
          const d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear();
          setDay(d); setMonth(m); setYear(y);
          emit(d, m, y);
        }}
      >
        <Ionicons name="calendar-outline" size={16} color="#475569" />
        <Text style={styles.setBtnText}>Set due date</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Stepper label="Day" value={pad(day)} onUp={() => adjustDay(1)} onDown={() => adjustDay(-1)} />
      <Text style={styles.sep}>/</Text>
      <Stepper label="Month" value={MONTHS[month - 1]} onUp={() => adjustMonth(1)} onDown={() => adjustMonth(-1)} />
      <Text style={styles.sep}>/</Text>
      <Stepper label="Year" value={String(year)} onUp={() => adjustYear(1)} onDown={() => adjustYear(-1)} />
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
  value: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', minWidth: 36, textAlign: 'center' },
});
