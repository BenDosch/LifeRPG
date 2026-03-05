import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface ShopItemFormProps {
  editItem?: ShopItem | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ShopItemForm({ editItem, onSave, onCancel }: ShopItemFormProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [name, setName] = useState(editItem?.name ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');

  const [cost, setCost] = useState(editItem?.cost ?? 0);
  const [costText, setCostText] = useState(String(editItem?.cost ?? 0));

  const [unlimited, setUnlimited] = useState(editItem?.quantity === null);
  const [quantity, setQuantity] = useState(
    editItem?.quantity !== null && editItem?.quantity !== undefined ? editItem.quantity : 1
  );
  const [quantityText, setQuantityText] = useState(
    String(editItem?.quantity !== null && editItem?.quantity !== undefined ? editItem.quantity : 1)
  );

  const [energyEffect, setEnergyEffect] = useState(editItem?.energyEffect ?? 0);
  const [energyText, setEnergyText] = useState(String(editItem?.energyEffect ?? 0));

  const [hydrationEffect, setHydrationEffect] = useState(editItem?.hydrationEffect ?? 0);
  const [hydrationText, setHydrationText] = useState(String(editItem?.hydrationEffect ?? 0));

  const [icon, setIcon] = useState<string | null>(editItem?.icon ?? null);
  const [iconColor, setIconColor] = useState<string | null>(editItem?.iconColor ?? null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const addItem = useShopStore((s) => s.addItem);
  const updateItem = useShopStore((s) => s.updateItem);

  const canSave = name.trim().length > 0;

  // Helpers: step a numeric field and sync both number + text states
  const stepCost = (delta: number) => {
    const next = Math.max(0, cost + delta);
    setCost(next);
    setCostText(String(next));
  };
  const stepQuantity = (delta: number) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    setQuantityText(String(next));
  };
  const stepEnergy = (delta: number) => {
    const next = Math.max(-100, Math.min(100, energyEffect + delta));
    setEnergyEffect(next);
    setEnergyText(String(next));
  };
  const stepHydration = (delta: number) => {
    const next = Math.max(-100, Math.min(100, hydrationEffect + delta));
    setHydrationEffect(next);
    setHydrationText(String(next));
  };

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
      {/* Name + Icon Row */}
      <View style={styles.nameIconRow}>
        <View style={styles.iconColumn}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity
            style={[styles.iconPreview, { borderColor: iconColor ?? theme.borderDefault }]}
            onPress={() => setShowIconPicker(true)}
          >
            {icon ? (
              <Ionicons name={icon as any} size={26} color={iconColor ?? '#a855f7'} />
            ) : (
              <Ionicons name="add" size={22} color={theme.textTertiary} />
            )}
            {icon && (
              <TouchableOpacity onPress={() => { setIcon(null); setIconColor(null); }} style={styles.clearIcon}>
                <Ionicons name="close-circle" size={16} color={theme.textDisabled} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.nameField}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter item name"
            placeholderTextColor={theme.textTertiary}
            returnKeyType="done"
            autoFocus={!editItem}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description..."
          placeholderTextColor={theme.textTertiary}
          multiline
          blurOnSubmit
        />
      </View>

      {/* Cost + Quantity Row */}
      <View style={styles.costQuantityRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Cost (Gold)</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepCost(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.stepInput}
              value={costText}
              onChangeText={(v) => {
                setCostText(v);
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 0) setCost(n);
              }}
              onBlur={() => setCostText(String(cost))}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepCost(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.quantityInputRow}>
            {!unlimited && (
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => stepQuantity(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepInput}
                  value={quantityText}
                  onChangeText={(v) => {
                    setQuantityText(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n >= 1) setQuantity(n);
                  }}
                  onBlur={() => setQuantityText(String(quantity))}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity style={styles.stepBtn} onPress={() => stepQuantity(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.unlimitedRow}>
              <Text style={styles.unlimitedLabel}>∞</Text>
              <Switch
                value={unlimited}
                onValueChange={setUnlimited}
                trackColor={{ false: theme.borderMuted, true: '#4ade8066' }}
                thumbColor={unlimited ? '#4ade80' : '#fff'}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Effects */}
      <View style={styles.field}>
        <Text style={styles.label}>Effects on Use</Text>
        <View style={styles.effectRow}>
          <View style={styles.effectItem}>
            <Text style={styles.effectLabel}>⚡ Energy</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => stepEnergy(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepInputRow}>
                <TextInput
                  style={[styles.stepInput, { color: energyEffect > 0 ? '#4ade80' : energyEffect < 0 ? '#ef4444' : theme.textPrimary }]}
                  value={energyText}
                  onChangeText={(v) => {
                    setEnergyText(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setEnergyEffect(Math.max(-100, Math.min(100, n)));
                  }}
                  onBlur={() => setEnergyText(String(energyEffect))}
                  keyboardType="numbers-and-punctuation"
                  selectTextOnFocus
                />
                <Text style={[styles.stepSuffix, { color: energyEffect > 0 ? '#4ade80' : energyEffect < 0 ? '#ef4444' : theme.textPrimary }]}>%</Text>
              </View>
              <TouchableOpacity style={styles.stepBtn} onPress={() => stepEnergy(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.effectItem}>
            <Text style={styles.effectLabel}>💧 Hydration</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => stepHydration(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepInputRow}>
                <TextInput
                  style={[styles.stepInput, { color: hydrationEffect > 0 ? '#0ea5e9' : hydrationEffect < 0 ? '#ef4444' : theme.textPrimary }]}
                  value={hydrationText}
                  onChangeText={(v) => {
                    setHydrationText(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setHydrationEffect(Math.max(-100, Math.min(100, n)));
                  }}
                  onBlur={() => setHydrationText(String(hydrationEffect))}
                  keyboardType="numbers-and-punctuation"
                  selectTextOnFocus
                />
                <Text style={[styles.stepSuffix, { color: hydrationEffect > 0 ? '#0ea5e9' : hydrationEffect < 0 ? '#ef4444' : theme.textPrimary }]}>%</Text>
              </View>
              <TouchableOpacity style={styles.stepBtn} onPress={() => stepHydration(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
        title="Customise item"
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

function getStyles(theme: Theme) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 20, gap: 20, paddingBottom: 40 },
    field: { gap: 8 },
    label: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 12,
      height: 42,
      color: theme.textPrimary,
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
      alignSelf: 'flex-start',
      backgroundColor: theme.bgPage,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    stepBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bgCard,
    },
    stepBtnText: {
      color: '#a855f7',
      fontSize: 20,
      fontWeight: '300',
      lineHeight: 22,
    },
    stepInput: {
      width: 48,
      height: 40,
      textAlign: 'center',
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      paddingHorizontal: 2,
    },
    stepInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepSuffix: {
      fontSize: 13,
      fontWeight: '600',
      paddingRight: 4,
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
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    costQuantityRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },
    quantityInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    nameIconRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    iconColumn: {
      alignItems: 'center',
      gap: 8,
    },
    nameField: {
      flex: 1,
      gap: 8,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconPreview: {
      width: 42,
      height: 42,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: theme.bgPage,
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
      color: theme.textSecondary,
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
      borderColor: theme.borderDefault,
      alignItems: 'center',
    },
    cancelText: {
      color: theme.textMuted,
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
      backgroundColor: theme.borderDefault,
    },
    saveText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    saveTextDisabled: {
      color: theme.textTertiary,
    },
  });
}
