import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../../store/profileStore';
import { XpBar } from './XpBar';
import { MomentumBar } from './MomentumBar';

export function HudBar() {
  const name = useProfileStore((s) => s.name);
  const title = useProfileStore((s) => s.title);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.bars}>
          <XpBar />
          <MomentumBar />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#12121a' },
  container: {
    backgroundColor: '#12121a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  identity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Electrolize-Regular',
  },
  title: {
    color: '#7c3aed',
    fontSize: 12,
    fontFamily: 'Electrolize-Regular',
  },
  bars: { gap: 6 },
});
