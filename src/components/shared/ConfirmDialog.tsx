import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.destructiveBtn]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialog: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: theme.borderDefault,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 20,
      lineHeight: 20,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderDefault,
    },
    cancelText: { color: theme.textSecondary, fontSize: 14 },
    confirmBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: '#7c3aed',
    },
    destructiveBtn: { backgroundColor: '#dc2626' },
    confirmText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  });
}
