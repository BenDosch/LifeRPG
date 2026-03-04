import React, { useState, useRef } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 90,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
