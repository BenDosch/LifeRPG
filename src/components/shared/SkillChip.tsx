import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuestStore } from '../../store/questStore';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface SkillChipProps {
  name: string;
  textStyle?: TextStyle | TextStyle[];
  iconSize?: number;
  coloredText?: boolean;
}

export function SkillChip({ name, textStyle, iconSize = 12, coloredText = false }: SkillChipProps) {
  const icon = useQuestStore((s) => s.skillIcons[name]);
  const color = useQuestStore((s) => s.skillColors[name]);

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const flatStyle = textStyle ? StyleSheet.flatten(textStyle) : undefined;
  const iconColor = color ?? (flatStyle?.color as string | undefined) ?? '#7c3aed';
  const textColor = coloredText && color ? { color } : undefined;

  return (
    <View style={styles.row}>
      {icon ? (
        <Ionicons name={icon as any} size={iconSize} color={iconColor} />
      ) : null}
      <Text style={[styles.defaultText, textStyle, textColor]}>{name}</Text>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    defaultText: {
      fontSize: 11,
      color: '#7c3aed',
    },
  });
}
