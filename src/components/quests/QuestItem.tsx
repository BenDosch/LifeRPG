import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useShallow } from 'zustand/react/shallow';
import { Quest, getTierColor, getUrgencyLabel } from '../../types';
import { isQuestAvailable, nextAvailableText } from '../../utils/repeat';
import { calcXP } from '../../utils/xp';
import { DifficultyBadge } from './DifficultyBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Tooltip } from '../shared/Tooltip';
import { SkillChip } from '../shared/SkillChip';
import { DateInput } from '../shared/DateInput';
import { tomorrowString } from '../../utils/dueDate';
import { useQuestStore } from '../../store/questStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../theme/ThemeContext';
import { Theme, resolveIconColor } from '../../theme';

type DueDateStatus = 'overdue' | 'today' | 'soon' | 'ok';
const DUE_COLORS: Record<DueDateStatus, string> = {
  overdue: '#ef4444',
  today:   '#f97316',
  soon:    '#f59e0b',
  ok:      '#475569',
};

function getDueInfo(dueDate: string, dueTime: string | null): { text: string; status: DueDateStatus } {
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueDate + 'T00:00:00');
  const due = dueTime ? new Date(`${dueDate}T${dueTime}:00`) : dueDay;
  const diff = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  const timeStr = dueTime ? ` ${dueTime}` : '';
  const isOverdue = dueTime ? due < now : diff < 0;
  if (isOverdue) {
    const daysStr = Math.abs(diff) > 0 ? `${Math.abs(diff)}d ` : '';
    return { text: `${daysStr}overdue${timeStr}`, status: 'overdue' };
  }
  if (diff === 0) return { text: `Due today${timeStr}`, status: 'today' };
  if (diff === 1) return { text: `Tomorrow${timeStr}`,  status: 'soon' };
  if (diff <= 3)  return { text: `${diff}d left${timeStr}`, status: 'soon' };
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return { text: `${dueDay.getDate()} ${months[dueDay.getMonth()]}${timeStr}`, status: 'ok' };
}

interface QuestItemProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onAddSubQuest?: (parentId: string) => void;
  isChild?: boolean;
}

export function QuestItem({ quest, onEdit, onAddSubQuest, isChild }: QuestItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [nextDueModalQuestId, setNextDueModalQuestId] = useState<string | null>(null);
  const [nextDueModalKey, setNextDueModalKey] = useState(0);
  const [nextDueDate, setNextDueDate] = useState<string | null>(null);

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const completeQuest = useQuestStore((s) => s.completeQuest);
  const skipQuest = useQuestStore((s) => s.skipQuest);
  const deleteQuest = useQuestStore((s) => s.deleteQuest);
  const resetQuest = useQuestStore((s) => s.resetQuest);
  const updateQuest = useQuestStore((s) => s.updateQuest);

  const questDueDateId = useUIStore((s) => s.questDueDateId);
  const clearQuestDueDateId = useUIStore((s) => s.clearQuestDueDateId);

  // All children for the checklist (complete + incomplete)
  const children = useQuestStore(
    useShallow((s) => s.quests.filter((q) => q.parentId === quest.id))
  );

  // Parent quest — needed for the unlimited-repeatable sub-quest availability rule
  const parentQuest = useQuestStore(
    (s) => quest.parentId ? (s.quests.find((q) => q.id === quest.parentId) ?? null) : null
  );

  const diffColor = getTierColor(quest.difficulty);
  const urgColor = getTierColor(quest.urgency);
  const isCompleted = !!quest.completedAt;
  const available = isQuestAvailable(quest, parentQuest);
  const cooldownText = nextAvailableText(quest, parentQuest);
  const hasChildren = children.length > 0;
  const autoCompleteDisabled = quest.autoCompleteOnSubQuests && hasChildren;

  const openNextDueModal = (questId: string) => {
    setNextDueDate(tomorrowString());
    setNextDueModalKey((k) => k + 1);
    setNextDueModalQuestId(questId);
  };

  useEffect(() => {
    if (questDueDateId === quest.id) {
      clearQuestDueDateId();
      openNextDueModal(quest.id);
    }
  }, [questDueDateId]);

  const handleSkip = () => {
    const result = skipQuest(quest.id);
    if (result.needsNextDueDate) openNextDueModal(quest.id);
  };

  const handleComplete = () => {
    if (isCompleted || !available || autoCompleteDisabled) return;
    completeQuest(quest.id);
  };

  return (
    <View style={isChild ? styles.childWrapper : styles.rootWrapper}>
      {/* Card */}
      <View style={[
        styles.container,
        isCompleted && styles.completedContainer,
        isChild && styles.childContainer,
      ]}>
        <LinearGradient
          colors={[urgColor, urgColor, diffColor, diffColor]}
          locations={[0, 0.25, 0.75, 1]}
          style={styles.difficultyBar}
        />
        <View style={styles.content}>

          {/* Header */}
          <View style={styles.header}>
            {quest.icon && (
              <View style={[styles.iconBadge, { borderColor: (quest.iconColor ?? '#a855f7') + '44', backgroundColor: (quest.iconColor ?? '#a855f7') + '18' }]}>
                <Ionicons name={quest.icon as any} size={isChild ? 14 : 16} color={resolveIconColor(quest.iconColor ?? '#a855f7', theme.colorScheme)} />
              </View>
            )}
            <Text
              style={[styles.name, isCompleted && styles.completedText, isChild && styles.childName]}
              numberOfLines={2}
            >
              {quest.name}
            </Text>
            <View style={styles.actions}>
              {!isCompleted && (
                <Tooltip label="Edit quest">
                  <TouchableOpacity
                    onPress={() => onEdit(quest)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </Tooltip>
              )}
              <Tooltip label="Delete quest">
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(true)}
                  style={styles.actionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </Tooltip>
            </View>
          </View>

          {/* Details */}
          {!!quest.details && (
            <Text style={styles.details}>{quest.details}</Text>
          )}

          {/* Meta row */}
          <View style={styles.meta}>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Difficulty</Text>
              <DifficultyBadge value={quest.difficulty} />
            </View>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Urgency</Text>
              <DifficultyBadge value={quest.urgency} labelFn={getUrgencyLabel} />
            </View>
            {quest.repeatable && (
              <View style={styles.repeatBadge}>
                <Ionicons name="repeat" size={11} color="#06b6d4" />
                <Text style={styles.repeatText}>Repeatable</Text>
              </View>
            )}
            {!!quest.dueDate && !quest.completedAt && (() => {
              const { text, status } = getDueInfo(quest.dueDate, quest.dueTime ?? null);
              const color = DUE_COLORS[status];
              return (
                <View style={[styles.dueBadge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
                  <Ionicons name="calendar-outline" size={10} color={color} />
                  <Text style={[styles.dueText, { color }]}>{text}</Text>
                </View>
              );
            })()}
          </View>

          {/* Skills row */}
          {quest.skills.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.metaLabel}>Skills</Text>
              <View style={styles.skillsRow}>
                {quest.skills.map((skill) => (
                  <SkillChip key={skill} name={skill} textStyle={styles.skillText} coloredText />
                ))}
              </View>
            </View>
          )}

          {/* Rewards row */}
          {(() => {
            const xp = calcXP(quest.difficulty, quest.urgency);
            const gold = quest.goldReward ?? 0;
            const eRew = quest.energyReward ?? 0;
            const hRew = quest.hydrationReward ?? 0;
            return (
              <View style={styles.rewardsRow}>
                <Text style={styles.rewardsLabel}>Rewards</Text>
                <View style={styles.rewardsBadges}>
                  <View style={[styles.rewardBadge, styles.rewardXP]}>
                    <Ionicons name="sparkles-sharp" size={10} color="#a855f7" />
                    <Text style={[styles.rewardText, { color: '#a855f7' }]}>+{xp} XP</Text>
                  </View>
                  {gold > 0 && (
                    <View style={[styles.rewardBadge, styles.rewardGold]}>
                      <Ionicons name="logo-usd" size={10} color="#FFD700" />
                      <Text style={[styles.rewardText, { color: '#FFD700' }]}>+{gold}</Text>
                    </View>
                  )}
                  {eRew > 0 && (
                    <View style={[styles.rewardBadge, styles.rewardEnergy]}>
                      <Ionicons name="flash" size={10} color="#4ade80" />
                      <Text style={[styles.rewardText, { color: '#4ade80' }]}>+{Math.round(eRew)}%</Text>
                    </View>
                  )}
                  {hRew > 0 && (
                    <View style={[styles.rewardBadge, styles.rewardHydration]}>
                      <Ionicons name="water-outline" size={10} color="#0ea5e9" />
                      <Text style={[styles.rewardText, { color: '#0ea5e9' }]}>+{Math.round(hRew)}%</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

          {/* Costs row — only if any costs are set */}
          {((quest.energyCost ?? 0) > 0 || (quest.hydrationCost ?? 0) > 0) && (
            <View style={styles.rewardsRow}>
              <Text style={styles.costsLabel}>Costs</Text>
              <View style={styles.rewardsBadges}>
                {(quest.energyCost ?? 0) > 0 && (
                  <View style={[styles.rewardBadge, styles.costEnergy]}>
                    <Ionicons name="flash" size={10} color="#4ade80" />
                    <Text style={[styles.rewardText, { color: '#4ade80' }]}>-{Math.round(quest.energyCost)}%</Text>
                  </View>
                )}
                {(quest.hydrationCost ?? 0) > 0 && (
                  <View style={[styles.rewardBadge, styles.costHydration]}>
                    <Ionicons name="water-outline" size={10} color="#0ea5e9" />
                    <Text style={[styles.rewardText, { color: '#0ea5e9' }]}>-{Math.round(quest.hydrationCost)}%</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sub-quest checklist — shown on the card when there are children */}
          {!isChild && hasChildren && (
            <View style={styles.checklist}>
              {children.map((child) => {
                // Non-repeatable: done when completedAt is set.
                // Repeatable: "done" when it has been completed and is currently unavailable.
                // Pass `quest` as the parent so the unlimited sub-quest rule is applied.
                const done = child.repeatable
                  ? !!child.lastCompletedAt && !isQuestAvailable(child, quest)
                  : !!child.completedAt;
                return (
                  <View key={child.id} style={styles.checkRow}>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={done ? '#ADFF2F' : theme.textTertiary}
                    />
                    <Text
                      style={[styles.checkText, done && styles.checkTextDone]}
                      numberOfLines={1}
                    >
                      {child.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Complete button */}
          {(!isCompleted || quest.repeatable) && (
            <>
              {autoCompleteDisabled ? (
                <Text style={styles.cooldownText}>Completes automatically when all sub-quests are done</Text>
              ) : (
                <View style={styles.completeBtnRow}>
                  <TouchableOpacity
                    style={[styles.completeBtn, !available && styles.completeBtnDisabled]}
                    onPress={handleComplete}
                    disabled={!available}
                  >
                    <Ionicons
                      name={quest.repeatable ? 'refresh-circle-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color={available ? '#ADFF2F' : theme.textTertiary}
                    />
                    <Text style={[styles.completeBtnText, !available && styles.completeBtnTextDisabled]}>
                      {quest.repeatable ? 'Complete Again' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                  {quest.repeatable && !!quest.dueDate && (
                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                      <Ionicons name="play-skip-forward-outline" size={16} color={theme.textMuted} />
                      <Text style={styles.skipBtnText}>Skip</Text>
                    </TouchableOpacity>
                  )}
                  {cooldownText && (
                    <Text style={styles.cooldownText}>{cooldownText}</Text>
                  )}
                </View>
              )}
            </>
          )}

          {isCompleted && quest.completedAt && (
            <View style={styles.completedRow}>
              <Text style={styles.completedDate}>
                Completed · Lv {quest.levelAtCompletion}
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => resetQuest(quest.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="refresh-outline" size={13} color="#38bdf8" />
                <Text style={styles.resetBtnText}>Renew</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sub-quest toggle / add button */}
          {!isChild && (
            hasChildren ? (
              <TouchableOpacity
                style={styles.subQuestToggle}
                onPress={() => setExpanded((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 24, right: 8 }}
              >
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={theme.textDisabled}
                />
                <Text style={styles.subQuestToggleText}>
                  {expanded ? 'Hide subquests' : 'Show subquests'}
                </Text>
              </TouchableOpacity>
            ) : onAddSubQuest ? (
              <TouchableOpacity
                style={styles.subQuestToggle}
                onPress={() => onAddSubQuest(quest.id)}
                hitSlop={{ top: 8, bottom: 8, left: 24, right: 8 }}
              >
                <Ionicons name="add-circle-outline" size={14} color={theme.textDisabled} />
                <Text style={styles.subQuestToggleText}>Add sub-quest</Text>
              </TouchableOpacity>
            ) : null
          )}
        </View>
      </View>

      {/* Expanded full sub-quest cards */}
      {!isChild && expanded && (
        <View style={styles.childrenSection}>
          {children.filter((c) => !c.completedAt).map((child) => (
            <QuestItem
              key={child.id}
              quest={child}
              onEdit={onEdit}
              isChild
            />
          ))}
          {onAddSubQuest && (
            <TouchableOpacity
              style={styles.addChildBtn}
              onPress={() => onAddSubQuest(quest.id)}
            >
              <Ionicons name="add-circle-outline" size={15} color={theme.textDisabled} />
              <Text style={styles.addChildText}>Add sub-quest</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Quest"
        message={`Delete "${quest.name}"? This will also remove all sub-quests.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteQuest(quest.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <Modal
        visible={!!nextDueModalQuestId}
        transparent
        animationType="fade"
        onRequestClose={() => setNextDueModalQuestId(null)}
      >
        <View style={styles.nextDueOverlay}>
          <View style={styles.nextDueModal}>
            <Text style={styles.nextDueTitle}>Next Due Date</Text>
            <Text style={styles.nextDueSubtitle}>When should this quest be due again?</Text>
            <DateInput key={nextDueModalKey} value={nextDueDate} onChange={setNextDueDate} />
            <View style={styles.nextDueBtns}>
              <TouchableOpacity
                style={styles.nextDueSkipBtn}
                onPress={() => setNextDueModalQuestId(null)}
              >
                <Text style={styles.nextDueSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextDueSetBtn, !nextDueDate && styles.nextDueSetBtnDisabled]}
                onPress={() => {
                  if (nextDueDate && nextDueModalQuestId) updateQuest(nextDueModalQuestId, { dueDate: nextDueDate });
                  setNextDueModalQuestId(null);
                }}
                disabled={!nextDueDate}
              >
                <Text style={styles.nextDueSetText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    rootWrapper: {
      marginBottom: 8,
    },
    childWrapper: {
      marginBottom: 4,
    },
    container: {
      flexDirection: 'row',
      backgroundColor: theme.bgCard,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.borderDefault,
    },
    childContainer: {
      backgroundColor: theme.bgDeep,
      borderColor: theme.borderSubtle,
      borderRadius: 8,
    },
    completedContainer: {
      opacity: 0.55,
    },
    difficultyBar: {
      width: 4,
    },
    content: {
      flex: 1,
      padding: 12,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    name: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
    },
    details: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 6,
    },
    childName: {
      fontSize: 14,
      fontWeight: '500',
    },
    completedText: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },
    iconBadge: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      padding: 4,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    metaGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '600',
    },

    skillsSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    skillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      flex: 1,
    },
    skillText: {
      color: '#7c3aed',
      fontSize: 11,
    },
    rewardsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rewardsLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '600',
      width: 44,
    },
    costsLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '600',
      width: 44,
    },
    rewardsBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      flex: 1,
    },
    rewardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    rewardText: {
      fontSize: 10,
      fontWeight: '700',
    },
    rewardXP: { backgroundColor: '#a855f711', borderColor: '#a855f733' },
    rewardGold: { backgroundColor: '#FFD70011', borderColor: '#FFD70033' },
    rewardEnergy: { backgroundColor: '#4ade8011', borderColor: '#4ade8033' },
    rewardHydration: { backgroundColor: '#0ea5e911', borderColor: '#0ea5e933' },
    costEnergy: { backgroundColor: '#4ade8011', borderColor: '#4ade8055' },
    costHydration: { backgroundColor: '#0ea5e911', borderColor: '#0ea5e955' },
    goldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#FFD70018',
      borderWidth: 1,
      borderColor: '#FFD70044',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    goldText: {
      color: '#FFD700',
      fontSize: 10,
      fontWeight: '700',
    },
    repeatBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#06b6d411',
      borderWidth: 1,
      borderColor: '#06b6d433',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    repeatText: {
      color: '#06b6d4',
      fontSize: 10,
      fontWeight: '600',
    },
    // Checklist on the card
    checklist: {
      gap: 5,
      paddingTop: 2,
      borderTopWidth: 1,
      borderTopColor: theme.borderDefault,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    checkText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 12,
    },
    checkTextDone: {
      textDecorationLine: 'line-through',
      color: theme.textDisabled,
    },
    completeBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    completeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ADFF2F33',
      backgroundColor: '#ADFF2F11',
    },
    skipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.textDisabled,
      backgroundColor: 'transparent',
    },
    skipBtnText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    completeBtnText: {
      color: '#ADFF2F',
      fontSize: 12,
      fontWeight: '600',
    },
    completeBtnDisabled: {
      borderColor: theme.borderDefault,
      backgroundColor: 'transparent',
    },
    completeBtnTextDisabled: {
      color: theme.textTertiary,
    },
    cooldownText: {
      color: theme.textMuted,
      fontSize: 11,
    },
    completedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    completedDate: {
      color: theme.textSecondary,
      fontSize: 11,
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#38bdf844',
      backgroundColor: '#38bdf811',
    },
    resetBtnText: {
      color: '#38bdf8',
      fontSize: 11,
      fontWeight: '600',
    },
    subQuestToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      gap: 4,
    },
    subQuestToggleText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    // Expanded sub-quest cards
    childrenSection: {
      marginTop: 2,
      marginLeft: 12,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: theme.borderDefault,
    },
    addChildBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 2,
    },
    addChildText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    dueBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    dueText: {
      fontSize: 10,
      fontWeight: '700',
    },
    // Next Due Date modal
    nextDueOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    nextDueModal: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      padding: 20,
      gap: 12,
    },
    nextDueTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    nextDueSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
    },
    nextDueBtns: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    nextDueSkipBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
    },
    nextDueSkipText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    nextDueSetBtn: {
      flex: 2,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 8,
      backgroundColor: '#7c3aed',
    },
    nextDueSetBtnDisabled: {
      backgroundColor: theme.borderDefault,
    },
    nextDueSetText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
