import React, { useState, useRef, useMemo } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme';

interface TooltipProps {
  label: string;
  children: React.ReactElement<{
    onLongPress?: () => void;
  }>;
}

export function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<View>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const show = () => {
    wrapperRef.current?.measure((_fx, _fy, width, height, px, py) => {
      // Position bubble below-right of the button
      setPos({ x: px + width, y: py + height + 4 });
      setVisible(true);
      timer.current = setTimeout(() => setVisible(false), 1500);
    });
  };

  const child = React.cloneElement(children, {
    onLongPress: show,
  });

  return (
    <View ref={wrapperRef} collapsable={false}>
      {child}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.bubble, { top: pos.y, right: undefined, left: pos.x - 90 }]}>
            <Text style={styles.text}>{label}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    bubble: {
      position: 'absolute',
      backgroundColor: theme.borderDefault,
      borderWidth: 1,
      borderColor: theme.textTertiary,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 90,
    },
    text: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
    },
  });
}
