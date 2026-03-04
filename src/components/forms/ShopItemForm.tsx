import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../types';
import { useShopStore } from '../../store/shopStore';
import { IconPickerModal } from '../skills/IconPickerModal';

interface ShopItemFormProps {
  editItem?: ShopItem | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ShopItemForm({ editItem, onSave, onCancel }: ShopItemFormProps) {
  const [name, setName] = useState(editItem?.name ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [cost, setCost] = useState(editItem?.cost ?? 0);
  const [unlimited, setUnlimited] = useState(editItem?.quantity === null);
  const [quantity, setQuantity] = useState(
    editItem?.quantity !== null && editItem?.quantity !== undefined ? editItem.quantity : 1
  );
  const [energyEffect, setEnergyEffect] = useState(editItem?.energyEffect ?? 0);
  const [hydrationEffect, setHydrationEffect] = useState(editItem?.hydrationEffect ?? 0);
  const [icon, setIcon] = useState<string | null>(editItem?.icon ?? null);
  const [iconColor, setIconColor] = useState<string | null>(editItem?.iconColor ?? null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const addItem = useShopStore((s) => s.addItem);
  const updateItem = useShopStore((s) => s.updateItem);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const input = {
      name: name.trim(),
      description,
      cost,
      quantity: unlimited ? null : quantity,
      energyEffect,
      hydrationEffect,
      icon,
      iconColor,
    };
    if (editItem) {
      updateItem(editItem.id, input);
    } else {
      addItem(input);
    }
    onSave();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter item name"
          placeholderTextColor="#334155"
          returnKeyType="done"
          autoFocus={!editItem}
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description..."
          placeholderTextColor="#334155"
          multiline
          blurOnSubmit
        />
      </View>

      {/* Icon */}
      <View style={styles.field}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={[styles.iconPreview, { borderColor: iconColor ?? '#1e1e2e' }]}
            onPress={() => setShowIconPicker(true)}
          >
            {icon ? (
              <Ionicons name={icon as any} size={26} color={iconColor ?? '#a855f7'} />
            ) : (
              <Ionicons name="add" size={22} color="#334155" />
            )}
          </TouchableOpacity>
          {icon && (
            <TouchableOpacity onPress={() => { setIcon(null); setIconColor(null); }} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cost */}
      <View style={styles.field}>
        <Text style={styles.label}>Cost (Gold)</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setCost((v) => Math.max(0, v - 1))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepValue}>{cost}</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setCost((v) => v + 1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quantity */}
      <View style={styles.field}>
        <View style={styles.quantityHeader}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.unlimitedRow}>
            <Text style={styles.unlimitedLabel}>Unlimited</Text>
            <Switch
              value={unlimited}
              onValueChange={setUnlimited}
              trackColor={{ false: '#1e1e2e', true: '#7c3aed' }}
              thumbColor={unlimited ? '#a855f7' : '#475569'}
            />
          </View>
        </View>
        {!unlimited && (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQuantity((v) => Math.max(1, v - 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQuantity((v) => v + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Effects */}
      <View style={styles.field}>
        <Text style={styles.label}>Effects on Use</Text>
        <View style={styles.effectRow}>
          <View style={styles.effectItem}>
            <Text style={styles.effectLabel}>⚡ Energy</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setEnergyEffect((v) => Math.max(-100, v - 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: energyEffect > 0 ? '#4ade80' : energyEffect < 0 ? '#ef4444' : '#e2e8f0' }]}>
                {energyEffect > 0 ? `+${energyEffect}` : energyEffect}%
              </Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setEnergyEffect((v) => Math.min(100, v + 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.effectItem}>
            <Text style={styles.effectLabel}>💧 Hydration</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setHydrationEffect((v) => Math.max(-100, v - 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: hydrationEffect > 0 ? '#0ea5e9' : hydrationEffect < 0 ? '#ef4444' : '#e2e8f0' }]}>
                {hydrationEffect > 0 ? `+${hydrationEffect}` : hydrationEffect}%
              </Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setHydrationEffect((v) => Math.min(100, v + 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
            {editItem ? 'Save Changes' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </View>
      <IconPickerModal
        visible={showIconPicker}
        skillName="Item Icon"
        currentIcon={icon ?? null}
        currentColor={iconColor ?? null}
        onConfirm={(selectedIcon, selectedColor) => {
          setIcon(selectedIcon);
          setIconColor(selectedColor);
          setShowIconPicker(false);
        }}
        onClose={() => setShowIconPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 8 },
  label: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 15,
  },
  descriptionInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  stepBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12121a',
  },
  stepBtnText: {
    color: '#a855f7',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
  },
  stepValue: {
    minWidth: 48,
    textAlign: 'center',
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlimitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlimitedLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPreview: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    padding: 4,
  },
  effectRow: {
    flexDirection: 'row',
    gap: 12,
  },
  effectItem: {
    flex: 1,
    gap: 6,
  },
  effectLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#1e1e2e',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  saveTextDisabled: {
    color: '#334155',
  },
});
