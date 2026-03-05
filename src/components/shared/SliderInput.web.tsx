import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SliderInputProps {
  value: number; // 1–100
  onValueChange: (v: number) => void;
  color?: string;
}

export function SliderInput({ value, onValueChange, color = '#7c3aed' }: SliderInputProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingVertical: 4 }}>
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onValueChange(parseInt(e.target.value, 10))}
        style={{
          width: '100%',
          accentColor: color,
          cursor: 'pointer',
          height: 28,
        }}
      />
    </View>
  );
}
