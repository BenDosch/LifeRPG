import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ShopItemForm } from '../../src/components/forms/ShopItemForm';
import { useShopStore } from '../../src/store/shopStore';
import { ConfirmDialog } from '../../src/components/shared/ConfirmDialog';

export default function ShopItemFormModal() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const editItem = useShopStore((s) =>
    itemId ? s.items.find((i) => i.id === itemId) ?? null : null
  );
  const deleteItem = useShopStore((s) => s.deleteItem);

  const handleSave = () => router.dismiss();
  const handleCancel = () => router.dismiss();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {editItem ? 'Edit Item' : 'New Shop Item'}
        </Text>
        <View style={styles.headerRight}>
          {editItem && (
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ShopItemForm
        editItem={editItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Item"
        message={`Delete "${editItem?.name}" from the shop?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (editItem) deleteItem(editItem.id);
          router.dismiss();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12121a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: { padding: 4 },
  closeBtn: { padding: 4 },
});
