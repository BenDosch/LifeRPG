import React from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
  return (
    <View style={style}>
      <Picker
        selectedValue={value}
        onValueChange={(v) => onValueChange(v as T)}
        style={{ color: '#e2e8f0', backgroundColor: '#12121a' }}
        dropdownIconColor="#64748b"
      >
        {options.map((opt) => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}
