import React, { useRef } from 'react';
import { View, PanResponder, LayoutChangeEvent, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  value: number; // 0–100
  onValueChange: (v: number) => void;
}

const H = 160;
const W = H;

function lerpColor(from: string, to: string, t: number): string {
  const p = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  const r = Math.round(p(from, 1) + (p(to, 1) - p(from, 1)) * t);
  const g = Math.round(p(from, 3) + (p(to, 3) - p(from, 3)) * t);
  const b = Math.round(p(from, 5) + (p(to, 5) - p(from, 5)) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function WaterDropSlider({ value, onValueChange }: Props) {
  const theme = useTheme();
  const containerH = useRef(H);

  const update = (y: number) => {
    const pct = 1 - Math.max(0, Math.min(1, y / containerH.current));
    onValueChange(Math.max(0, Math.min(100, Math.round(pct * 100))));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationY),
      onPanResponderMove: (e) => update(e.nativeEvent.locationY),
    })
  ).current;

  const ratio = value / 100;
  const color = lerpColor('#ef4444', '#0ea5e9', ratio);
  const fillH = Math.round(H * ratio);

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => { containerH.current = e.nativeEvent.layout.height; }}
      {...pan.panHandlers}
    >
      {/* Dim base icon */}
      <Ionicons name="water" size={H} color={theme.borderDefault} />

      {/* Rising fill */}
      <View style={[styles.fillClip, { height: fillH }]}>
        <View style={styles.fillIconWrap}>
          <Ionicons name="water" size={H} color={color} />
        </View>
      </View>

      {/* Outline on top */}
      <View style={styles.overlay}>
        <Ionicons name="water-outline" size={H} color={theme.textDisabled} style={{ opacity: 0.4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillClip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    alignItems: 'center',
  },
  fillIconWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
