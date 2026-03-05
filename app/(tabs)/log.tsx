import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogList } from '../../src/components/log/LogList';
import { useTheme } from '../../src/theme/ThemeContext';
import { Theme } from '../../src/theme';

export default function LogScreen() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Activity Log</Text>
        <LogList />
      </View>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bgPage },
    container: { flex: 1 },
    heading: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });
}
