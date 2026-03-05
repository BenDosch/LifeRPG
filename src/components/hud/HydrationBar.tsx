import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore } from '../../store/characterStore';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

function lerpColor(from: string, to: string, t: number): string {
  const p = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  const r = Math.round(p(from, 1) + (p(to, 1) - p(from, 1)) * t);
  const g = Math.round(p(from, 3) + (p(to, 3) - p(from, 3)) * t);
  const b = Math.round(p(from, 5) + (p(to, 5) - p(from, 5)) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function HydrationBar() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const { hydration, drinkWater, waterUnit } = useCharacterStore(
    useShallow((s) => ({
      hydration: s.hydration,
      drinkWater: s.drinkWater,
      waterUnit: s.waterUnit,
    }))
  );
  const ratio = Math.min(1, Math.max(0, hydration / 100));
  const overhydrated = hydration > 100;

  const color = lerpColor('#ef4444', '#0ea5e9', ratio);

  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!overhydrated) {
      glowAnim.setValue(0);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [overhydrated]);

  const btnLabel = waterUnit === 'imperial' ? 'Drank ~8oz' : 'Drank ~240ml';

  return (
    <View style={styles.row}>
      <View style={styles.barArea}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>HYDRATION</Text>
          <Text style={[styles.value, { color }]}>{Math.round(hydration)}%</Text>
        </View>
        <View style={styles.trackOuter}>
          {overhydrated && (
            <Animated.View
              style={[
                styles.glow,
                { opacity: glowAnim },
                Platform.OS === 'web' && ({ boxShadow: '0 0 6px 3px #0ea5e9' } as any),
              ]}
            />
          )}
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${ratio * 100}%` as any, backgroundColor: color }]}
            />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.btn} onPress={drinkWater}>
        <Ionicons name="water-outline" size={11} color="#0ea5e9" />
        <Text style={styles.btnText} numberOfLines={1}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
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
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    value: {
      fontSize: 11,
      fontWeight: '700',
    },
    trackOuter: {
      height: 4,
    },
    glow: {
      position: 'absolute',
      top: -4,
      left: 0,
      right: 0,
      bottom: -4,
      borderRadius: 3,
      backgroundColor: '#0ea5e9',
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 8,
    },
    track: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.borderDefault,
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
      backgroundColor: '#0ea5e911',
      borderWidth: 1,
      borderColor: '#0ea5e933',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    btnText: {
      color: '#0ea5e9',
      fontSize: 11,
      fontWeight: '700',
      fontFamily: 'Electrolize-Regular',
    },
  });
}
