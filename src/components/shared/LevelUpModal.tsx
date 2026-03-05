import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore, LevelUpEntry } from '../../store/uiStore';
import { Confetti } from './Confetti';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

const TYPE_LABELS: Record<LevelUpEntry['type'], string> = {
  player: 'PLAYER',
  skill: 'SKILL',
  class: 'CLASS',
  unlock: 'NOW AVAILABLE',
};

function EntryRow({ entry, onUnlock, theme, styles }: { entry: LevelUpEntry; onUnlock?: () => void; theme: Theme; styles: ReturnType<typeof getStyles> }) {
  const color = entry.color ?? '#a855f7';
  return (
    <View style={[styles.entryRow, { borderColor: color + '33', backgroundColor: color + '0d' }]}>
      <View style={[styles.entryIcon, { borderColor: color + '55', backgroundColor: color + '22' }]}>
        <Ionicons
          name={(entry.icon ?? 'star-outline') as any}
          size={22}
          color={color}
        />
      </View>
      <View style={styles.entryInfo}>
        <Text style={[styles.entryType, { color: color + 'bb' }]}>
          {TYPE_LABELS[entry.type]}
        </Text>
        <Text style={styles.entryName} numberOfLines={1}>{entry.name}</Text>
      </View>
      {entry.type === 'unlock' ? (
        <TouchableOpacity
          style={[styles.unlockBadge, { borderColor: color + '88', backgroundColor: color + '22' }]}
          onPress={onUnlock}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="lock-open-outline" size={12} color={color} />
          <Text style={[styles.unlockBadgeText, { color }]}>Unlock!</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.levelBadge}>
          <Text style={styles.levelPrev}>Lv. {entry.previousLevel}</Text>
          <Ionicons name="arrow-forward" size={12} color={theme.textDisabled} />
          <Text style={[styles.levelNew, { color }]}>Lv. {entry.newLevel}</Text>
        </View>
      )}
    </View>
  );
}

export function LevelUpModal() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const entries = useUIStore((s) => s.levelUpEvent);
  const clearLevelUp = useUIStore((s) => s.clearLevelUp);
  const openClassPicker = useUIStore((s) => s.openClassPicker);

  const handleUnlock = () => {
    clearLevelUp();
    openClassPicker();
  };

  const visible = entries !== null && entries.length > 0;

  // Pick accent color: player gold > first entry color
  const accentColor = entries?.find((e) => e.type === 'player')?.color
    ?? entries?.[0]?.color
    ?? '#FFD700';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={clearLevelUp}>
      <View style={styles.overlay}>
        <Confetti running={visible} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.starRow]}>
              <Ionicons name="star" size={18} color={accentColor} />
              <Ionicons name="star" size={22} color={accentColor} />
              <Ionicons name="star" size={18} color={accentColor} />
            </View>
            <Text style={[styles.title, { color: accentColor }]}>LEVEL UP!</Text>
            <Text style={styles.subtitle}>You've grown stronger</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: accentColor + '33' }]} />

          {/* Entries */}
          <ScrollView
            style={styles.entriesScroll}
            contentContainerStyle={styles.entriesContent}
            showsVerticalScrollIndicator={false}
          >
            {entries?.map((entry, i) => (
              <EntryRow
                key={i}
                entry={entry}
                onUnlock={entry.type === 'unlock' ? handleUnlock : undefined}
                theme={theme}
                styles={styles}
              />
            ))}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: accentColor }]}
            onPress={clearLevelUp}
          >
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
      gap: 6,
    },
    starRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: 3,
      fontFamily: 'Electrolize-Regular',
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      marginHorizontal: 16,
    },
    entriesScroll: {
      maxHeight: 320,
    },
    entriesContent: {
      padding: 16,
      gap: 10,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
    },
    entryIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    entryInfo: {
      flex: 1,
      gap: 2,
    },
    entryType: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    entryName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    unlockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      flexShrink: 0,
    },
    unlockBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Electrolize-Regular',
    },
    levelPrev: {
      color: theme.textDisabled,
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Electrolize-Regular',
    },
    levelNew: {
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'Electrolize-Regular',
    },
    claimBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      margin: 16,
      paddingVertical: 14,
      borderRadius: 12,
    },
    claimText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });
}
