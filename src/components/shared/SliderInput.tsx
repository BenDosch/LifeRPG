import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface SliderInputProps {
  value: number; // 1–100
  onValueChange: (v: number) => void;
  color?: string;
}

export function SliderInput({ value, onValueChange, color = '#7c3aed' }: SliderInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const trackWidth = useRef(1);

  const update = (x: number) => {
    const pct = Math.max(0, Math.min(1, x / trackWidth.current));
    onValueChange(Math.max(1, Math.min(100, Math.round(pct * 99 + 1))));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    })
  ).current;

  const pct = ((value - 1) / 99) * 100;

  return (
    <View
      style={styles.hitArea}
      onLayout={(e: LayoutChangeEvent) => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={[
        styles.thumb,
        { left: `${pct}%` as any, borderColor: color, backgroundColor: color + '44' },
      ]} />
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    hitArea: {
      height: 36,
      justifyContent: 'center',
    },
    track: {
      height: 6,
      backgroundColor: theme.borderDefault,
      borderRadius: 3,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 3,
    },
    thumb: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      marginLeft: -11,
      top: '50%',
      marginTop: -11,
    },
  });
}
