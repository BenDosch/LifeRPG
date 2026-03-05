import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore } from '../../store/characterStore';
import { useQuestStore } from '../../store/questStore';
import { getClassDef } from '../../data/heroClasses';
import { getClassLevel } from '../../utils/classLevels';
import { XpBar } from './XpBar';
import { EnergyBar } from './EnergyBar';
import { HydrationBar } from './HydrationBar';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

export function HudBar() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const { name, heroClass, customClasses, gold } = useCharacterStore(
    useShallow((s) => ({ name: s.name, heroClass: s.heroClass, customClasses: s.customClasses, gold: s.gold }))
  );
  const log = useQuestStore((s) => s.log);
  const classDef = getClassDef(heroClass, customClasses);
  const classColor = classDef?.color ?? '#7c3aed';
  const classLevel = getClassLevel(log, heroClass);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.classRow}>
              {classDef && <Ionicons name={classDef.icon as any} size={11} color={classColor} />}
              <Text style={[styles.title, { color: classColor }]}>
                Level {classLevel} {heroClass}
              </Text>
            </View>
          </View>
          <View style={styles.badges}>
            <View style={styles.goldBadge}>
              <Ionicons name="logo-usd" size={11} color="#FFD700" />
              <Text style={styles.goldText}>{gold}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bars}>
          <XpBar />
          <EnergyBar />
          <HydrationBar />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { backgroundColor: theme.bgCard },
    container: {
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderDefault,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    identity: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    classRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    name: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Electrolize-Regular',
    },
    title: {
      color: '#7c3aed',
      fontSize: 12,
      fontFamily: 'Electrolize-Regular',
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    goldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FFD70018',
      borderWidth: 1,
      borderColor: '#FFD70044',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    goldText: {
      color: '#FFD700',
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Electrolize-Regular',
    },
    bars: { gap: 6 },
  });
}
