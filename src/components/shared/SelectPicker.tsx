import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../theme/ThemeContext';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface SelectPickerProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Option<T>[];
  style?: object;
}

export function SelectPicker<T extends string>({
  value,
  onValueChange,
  options,
  style,
}: SelectPickerProps<T>) {
  const theme = useTheme();

  return (
    <View style={style}>
      <Picker
        selectedValue={value}
        onValueChange={(v) => onValueChange(v as T)}
        style={{ color: theme.textPrimary, backgroundColor: theme.bgCard }}
        dropdownIconColor={theme.textMuted}
      >
        {options.map((opt) => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}
