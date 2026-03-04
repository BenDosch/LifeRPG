import React, { useState, useEffect } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = [
  '#FFD700', '#a855f7', '#06b6d4', '#f97316',
  '#4ade80', '#f43f5e', '#e2e8f0', '#38bdf8',
];
const PARTICLE_COUNT = 70;

interface Particle {
  id: number;
  x: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
  translateY: Animated.Value;
  translateX: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  delay: number;
  duration: number;
  xDrift: number;
}

function makeParticles(screenWidth: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const w = 5 + Math.random() * 7;
    const h = w * (Math.random() > 0.5 ? 1.8 : 1);
    return {
      id: i,
      x: Math.random() * Math.max(screenWidth, 400),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: w,
      height: h,
      borderRadius: Math.random() > 0.6 ? w / 2 : 2,
      translateY: new Animated.Value(-30),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      delay: Math.random() * 700,
      duration: 2000 + Math.random() * 1000,
      xDrift: (Math.random() - 0.5) * 180,
    };
  });
}

export function Confetti({ running }: { running: boolean }) {
  const { width, height } = useWindowDimensions();
  const [particles] = useState<Particle[]>(() => makeParticles(width));

  useEffect(() => {
    if (!running) {
      particles.forEach((p) => {
        p.translateY.stopAnimation();
        p.translateX.stopAnimation();
        p.rotate.stopAnimation();
        p.opacity.stopAnimation();
        p.translateY.setValue(-30);
        p.translateX.setValue(0);
        p.rotate.setValue(0);
        p.opacity.setValue(1);
      });
      return;
    }

    const screenH = Math.max(height, 800);
    const anims = particles.map((p) =>
      Animated.parallel([
        Animated.timing(p.translateY, {
          toValue: screenH + 60,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: false,
        }),
        Animated.timing(p.translateX, {
          toValue: p.xDrift,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: false,
        }),
        Animated.timing(p.rotate, {
          toValue: 8,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: false,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: p.duration * 0.3,
          delay: p.delay + p.duration * 0.7,
          useNativeDriver: false,
        }),
      ])
    );

    Animated.parallel(anims).start();
  }, [running]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: p.x,
            width: p.width,
            height: p.height,
            borderRadius: p.borderRadius,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [
              { translateY: p.translateY },
              { translateX: p.translateX },
              {
                rotate: p.rotate.interpolate({
                  inputRange: [0, 8],
                  outputRange: ['0deg', '720deg'],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
