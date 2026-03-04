import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useShopStore } from '../../src/store/shopStore';
import { useCharacterStore } from '../../src/store/characterStore';
import { ShopItemCard } from '../../src/components/shop/ShopItemCard';
import { InventoryItemCard } from '../../src/components/shop/InventoryItemCard';
import { ShopItem } from '../../src/types';

type Tab = 'shop' | 'inventory';

export default function StoreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  const { items, inventory, purchaseItem } = useShopStore(
    useShallow((s) => ({
      items: s.items,
      inventory: s.inventory,
      purchaseItem: s.purchaseItem,
    }))
  );

  const gold = useCharacterStore((s) => s.gold);

  const handleEdit = (item: ShopItem) => {
    router.push({ pathname: '/modals/shop-item-form', params: { itemId: item.id } });
  };

  const handleBuy = (item: ShopItem) => {
    const result = purchaseItem(item.id);
    if (!result.success) {
      Alert.alert('Purchase Failed', result.reason ?? 'Unable to buy item.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={[styles.toggle, { marginTop: 16 }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'inventory' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.toggleText, activeTab === 'inventory' && styles.toggleTextActive]}>
            Inventory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'shop' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={[styles.toggleText, activeTab === 'shop' && styles.toggleTextActive]}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'shop' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={40} color="#1e1e2e" />
              <Text style={styles.emptyText}>No items in the shop yet.</Text>
              <Text style={styles.emptySubText}>Tap "Add Item" to create one.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => router.push('/modals/shop-item-form')}
              >
                <Text style={styles.addCardPlus}>+</Text>
                <Text style={styles.addCardLabel}>Add Item</Text>
              </TouchableOpacity>
              {items.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  userGold={gold}
                  onEdit={handleEdit}
                  onBuy={handleBuy}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {inventory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#1e1e2e" />
              <Text style={styles.emptyText}>Your inventory is empty.</Text>
              <Text style={styles.emptySubText}>Purchase items from the Shop.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {inventory.map((item) => (
                <InventoryItemCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD70011',
    borderWidth: 1,
    borderColor: '#FFD70033',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goldPillText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  addCard: {
    width: 220,
    height: 110,
    backgroundColor: '#12121a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7c3aed44',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addCardPlus: {
    color: '#7c3aed',
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
  },
  addCardLabel: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
  },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#12121a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#7c3aed33',
  },
  toggleText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#a855f7',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#334155',
    fontSize: 13,
  },
});
