import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '../../types';
import { useShopStore } from '../../store/shopStore';

interface InventoryItemCardProps {
  item: InventoryItem;
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const useInventoryItem = useShopStore((s) => s.useInventoryItem);
  const shopItem = useShopStore((s) => s.items.find((i) => i.name === item.name));
  const icon = shopItem?.icon ?? null;
  const iconColor = shopItem?.iconColor ?? '#a855f7';

  return (
    <View style={styles.container}>
      {/* Top: icon + name */}
      <View style={styles.top}>
        <View style={[styles.iconWrap, { borderColor: iconColor + '44', backgroundColor: iconColor + '18' }]}>
          <Ionicons name={(icon ?? 'cube-outline') as any} size={20} color={iconColor} />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {(item.energyEffect !== 0 || item.hydrationEffect !== 0) && (
            <View style={styles.effectRow}>
              {item.energyEffect !== 0 && (
                <Text style={[styles.effectText, { color: item.energyEffect > 0 ? '#4ade80' : '#ef4444' }]}>
                  ⚡{item.energyEffect > 0 ? '+' : ''}{item.energyEffect}%
                </Text>
              )}
              {item.hydrationEffect !== 0 && (
                <Text style={[styles.effectText, { color: item.hydrationEffect > 0 ? '#0ea5e9' : '#ef4444' }]}>
                  💧{item.hydrationEffect > 0 ? '+' : ''}{item.hydrationEffect}%
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Bottom: qty + use */}
      <View style={styles.bottom}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>×{item.quantity}</Text>
        </View>
        <TouchableOpacity
          style={styles.useBtn}
          onPress={() => useInventoryItem(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="flash" size={13} color="#ADFF2F" />
          <Text style={styles.useBtnText}>Use</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: '#12121a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    padding: 12,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  effectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  effectText: {
    fontSize: 11,
    fontWeight: '600',
  },
  qtyBadge: {
    backgroundColor: '#a855f722',
    borderWidth: 1,
    borderColor: '#a855f744',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ADFF2F11',
    borderWidth: 1,
    borderColor: '#ADFF2F33',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  useBtnText: {
    color: '#ADFF2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
