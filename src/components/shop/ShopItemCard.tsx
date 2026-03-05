import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../types';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useShopStore } from '../../store/shopStore';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface ShopItemCardProps {
  item: ShopItem;
  userGold: number;
  onEdit: (item: ShopItem) => void;
  onBuy: (item: ShopItem) => void;
}

export function ShopItemCard({ item, userGold, onEdit, onBuy }: ShopItemCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteItem = useShopStore((s) => s.deleteItem);
  const canAfford = userGold >= item.cost;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          {item.icon && (
            <View style={[styles.iconWrap, { borderColor: (item.iconColor ?? '#a855f7') + '44', backgroundColor: (item.iconColor ?? '#a855f7') + '18' }]}>
              <Ionicons name={item.icon as any} size={18} color={item.iconColor ?? '#a855f7'} />
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.meta}>
          <View style={styles.goldBadge}>
            <Ionicons name="logo-usd" size={10} color="#FFD700" />
            <Text style={styles.goldText}>{item.cost}</Text>
          </View>
          <View style={styles.qtyBadge}>
            <Ionicons name="layers-outline" size={11} color="#94a3b8" />
            <Text style={styles.qtyText}>
              {item.quantity === null ? '∞' : String(item.quantity)}
            </Text>
          </View>
          {item.energyEffect !== 0 && (
            <View style={[styles.effectBadge, { borderColor: item.energyEffect > 0 ? '#4ade8044' : '#ef444444', backgroundColor: item.energyEffect > 0 ? '#4ade8011' : '#ef444411' }]}>
              <Text style={[styles.effectText, { color: item.energyEffect > 0 ? '#4ade80' : '#ef4444' }]}>
                ⚡{item.energyEffect > 0 ? '+' : ''}{item.energyEffect}%
              </Text>
            </View>
          )}
          {item.hydrationEffect !== 0 && (
            <View style={[styles.effectBadge, { borderColor: item.hydrationEffect > 0 ? '#0ea5e944' : '#ef444444', backgroundColor: item.hydrationEffect > 0 ? '#0ea5e911' : '#ef444411' }]}>
              <Text style={[styles.effectText, { color: item.hydrationEffect > 0 ? '#0ea5e9' : '#ef4444' }]}>
                💧{item.hydrationEffect > 0 ? '+' : ''}{item.hydrationEffect}%
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
          onPress={() => onBuy(item)}
          disabled={!canAfford}
        >
          <Ionicons
            name="cart-outline"
            size={15}
            color={canAfford ? '#FFD700' : theme.textTertiary}
          />
          <Text style={[styles.buyBtnText, !canAfford && styles.buyBtnTextDisabled]}>
            Buy
          </Text>
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Item"
        message={`Delete "${item.name}" from the shop?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteItem(item.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: 220,
      backgroundColor: theme.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
    },
    content: {
      padding: 12,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 7,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
    },
    description: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: { padding: 4 },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    goldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#FFD70018',
      borderWidth: 1,
      borderColor: '#FFD70044',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    goldText: {
      color: '#FFD700',
      fontSize: 11,
      fontWeight: '700',
    },
    qtyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#94a3b811',
      borderWidth: 1,
      borderColor: '#94a3b833',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    qtyText: {
      color: '#94a3b8',
      fontSize: 11,
      fontWeight: '600',
    },
    effectBadge: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    effectText: {
      fontSize: 11,
      fontWeight: '600',
    },
    buyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#FFD70044',
      backgroundColor: '#FFD70011',
    },
    buyBtnDisabled: {
      borderColor: theme.borderDefault,
      backgroundColor: 'transparent',
    },
    buyBtnText: {
      color: '#FFD700',
      fontSize: 12,
      fontWeight: '600',
    },
    buyBtnTextDisabled: {
      color: theme.textTertiary,
    },
  });
}
