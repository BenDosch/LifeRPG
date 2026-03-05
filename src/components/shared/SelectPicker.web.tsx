import React from 'react';
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
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value as T)}
      style={{
        backgroundColor: theme.bgCard,
        color: theme.textPrimary,
        border: `1px solid ${theme.borderDefault}`,
        borderRadius: 6,
        padding: '6px 8px',
        fontSize: 14,
        width: '100%',
        ...style,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
