import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../store/uiStore';
import { useCharacterStore } from '../../store/characterStore';
import { getClassDef } from '../../data/heroClasses';
import { Confetti } from './Confetti';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

function useCountUp(target: number, running: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running || target === 0) { setValue(0); return; }
    const steps = 24;
    const interval = 800 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setValue(Math.round(target * Math.min(step / steps, 1)));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [target, running]);
  return value;
}

interface XPLineProps {
  xpAwarded: number;
  xpClass: string | undefined;
  classDef: { icon: string; color: string; name: string } | undefined;
  running: boolean;
  styles: ReturnType<typeof getStyles>;
}

function XPLine({ xpAwarded, xpClass, classDef, running, styles }: XPLineProps) {
  const animated = useCountUp(xpAwarded, running);
  const classColor = classDef?.color ?? '#94a3b8';
  return (
    <View style={[styles.rewardLine, { backgroundColor: '#a855f711', borderColor: '#a855f733' }]}>
      {xpClass && (
        <>
          <Ionicons name={(classDef?.icon ?? 'shield-outline') as any} size={18} color={classColor} />
          <Text style={[styles.classLabel, { color: classColor }]}>{xpClass}</Text>
          <Text style={styles.receiveText}>receives</Text>
        </>
      )}
      <Text style={[styles.rewardAmount, { color: '#a855f7' }]}>+{animated}</Text>
      <Ionicons name="sparkles-sharp" size={16} color="#a855f7" />
      <Text style={styles.rewardLabel}>XP</Text>
    </View>
  );
}

interface RewardLineProps {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  value: number;
  label: string;
  unit?: string;
  negative?: boolean;
  running: boolean;
  styles: ReturnType<typeof getStyles>;
}

function RewardLine({ icon, color, bgColor, borderColor, value, label, unit, negative, running, styles }: RewardLineProps) {
  const animated = useCountUp(value, running);
  if (value === 0) return null;
  return (
    <View style={[styles.rewardLine, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.rewardAmount, { color }]}>
        {negative ? '-' : '+'}{animated}{unit ?? ''}
      </Text>
      <Text style={styles.rewardLabel}>{label}</Text>
    </View>
  );
}

export function QuestCompleteModal() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const event = useUIStore((s) => s.questCompleteEvent);
  const clearQuestComplete = useUIStore((s) => s.clearQuestComplete);
  const customClasses = useCharacterStore((s) => s.customClasses);
  const classDef = event?.xpClass ? getClassDef(event.xpClass, customClasses) : undefined;

  const visible = event !== null;
  const [animRunning, setAnimRunning] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setAnimRunning(true), 250);
      return () => clearTimeout(t);
    } else {
      setAnimRunning(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={clearQuestComplete}>
      <View style={styles.overlay}>
        <Confetti running={visible} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconBadge,
              {
                borderColor: (event?.questIconColor ?? '#ADFF2F') + '55',
                backgroundColor: (event?.questIconColor ?? '#ADFF2F') + '22',
              },
            ]}>
              <Ionicons
                name={(event?.questIcon ?? 'checkmark-circle') as any}
                size={30}
                color={event?.questIconColor ?? '#ADFF2F'}
              />
            </View>
            <Text style={styles.title}>QUEST COMPLETE!</Text>
            <Text style={styles.questName} numberOfLines={2}>{event?.questName}</Text>
          </View>

          <View style={styles.divider} />

          {/* Rewards & Costs */}
          <View style={styles.rewardsSection}>
            <XPLine
              xpAwarded={event?.xpAwarded ?? 0}
              xpClass={event?.xpClass}
              classDef={classDef}
              running={animRunning}
              styles={styles}
            />
            <RewardLine
              icon="logo-usd" color="#FFD700"
              bgColor="#FFD70011" borderColor="#FFD70033"
              value={event?.goldAwarded ?? 0} label="Gold"
              running={animRunning}
              styles={styles}
            />
            <RewardLine
              icon="water" color="#0ea5e9"
              bgColor="#0ea5e911" borderColor="#0ea5e933"
              value={event?.hydrationReward ?? 0} label="Hydration" unit="%"
              running={animRunning}
              styles={styles}
            />
            <RewardLine
              icon="battery-charging-outline" color="#4ade80"
              bgColor="#4ade8011" borderColor="#4ade8033"
              value={event?.energyReward ?? 0} label="Energy" unit="%"
              running={animRunning}
              styles={styles}
            />
            <RewardLine
              icon="water" color="#0ea5e9"
              bgColor="#0ea5e911" borderColor="#0ea5e955"
              value={event?.hydrationCost ?? 0} label="Hydration" unit="%" negative
              running={animRunning}
              styles={styles}
            />
            <RewardLine
              icon="battery-charging-outline" color="#4ade80"
              bgColor="#4ade8011" borderColor="#4ade8055"
              value={event?.energyCost ?? 0} label="Energy" unit="%" negative
              running={animRunning}
              styles={styles}
            />
          </View>

          {/* Skills */}
          {(event?.skills.length ?? 0) > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.skillsRow}>
                <Text style={styles.skillsLabel}>Skills</Text>
                <Text style={styles.skillsText}>{event?.skills.join(', ')}</Text>
              </View>
            </>
          )}

          {/* Claim */}
          <TouchableOpacity style={styles.claimBtn} onPress={clearQuestComplete}>
            <Ionicons name="checkmark-circle" size={18} color="#000" />
            <Text style={styles.claimText}>Claim!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 20,
      paddingHorizontal: 20,
      gap: 8,
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    title: {
      color: '#ADFF2F',
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 2,
      fontFamily: 'Electrolize-Regular',
    },
    questName: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderDefault,
      marginHorizontal: 16,
    },
    rewardsSection: {
      padding: 16,
      gap: 8,
    },
    rewardLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    rewardAmount: {
      fontSize: 22,
      fontWeight: '800',
      fontFamily: 'Electrolize-Regular',
      minWidth: 60,
    },
    rewardLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    classLabel: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Electrolize-Regular',
    },
    receiveText: {
      color: theme.textDisabled,
      fontSize: 13,
      marginRight: 2,
    },
    skillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    skillsLabel: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    skillsText: {
      flex: 1,
      color: '#a855f7',
      fontSize: 13,
      fontWeight: '600',
    },
    claimBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      margin: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#ADFF2F',
    },
    claimText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });
}
