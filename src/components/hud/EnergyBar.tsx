import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCharacterStore } from '../../store/characterStore';

function lerpColor(from: string, to: string, t: number): string {
  const p = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  const r = Math.round(p(from, 1) + (p(to, 1) - p(from, 1)) * t);
  const g = Math.round(p(from, 3) + (p(to, 3) - p(from, 3)) * t);
  const b = Math.round(p(from, 5) + (p(to, 5) - p(from, 5)) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function EnergyBar() {
  const energy = useCharacterStore((s) => s.energy);
  const fullRest = useCharacterStore((s) => s.fullRest);
  const ratio = Math.min(1, Math.max(0, energy / 100));

  const color = lerpColor('#ef4444', '#4ade80', ratio);

  return (
    <View style={styles.row}>
      <View style={styles.barArea}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>ENERGY</Text>
          <Text style={[styles.value, { color }]}>
            {Math.round(energy)}%
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${ratio * 100}%` as any, backgroundColor: color }]}
          />
        </View>
      </View>
      <TouchableOpacity style={styles.btn} onPress={fullRest}>
        <Ionicons name="moon-outline" size={11} color="#818cf8" />
        <Text style={styles.btnText} numberOfLines={1}>Full Rest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barArea: { flex: 1, gap: 4 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 4,
    backgroundColor: '#1e1e2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 152,
    backgroundColor: '#818cf811',
    borderWidth: 1,
    borderColor: '#818cf833',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  btnText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Electrolize-Regular',
  },
});
