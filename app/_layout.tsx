import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEnergyDecay } from '../src/hooks/useEnergyDecay';
import { useHydrationDecay } from '../src/hooks/useHydrationDecay';
import { LevelUpModal } from '../src/components/shared/LevelUpModal';
import { ClassPickerModal } from '../src/components/character/ClassPickerModal';
import { useUIStore } from '../src/store/uiStore';
import { useCharacterStore } from '../src/store/characterStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function EnergyDecayWatcher() {
  useEnergyDecay();
  return null;
}

function HydrationDecayWatcher() {
  useHydrationDecay();
  return null;
}

function GlobalClassPicker() {
  const classPickerOpen = useUIStore((s) => s.classPickerOpen);
  const closeClassPicker = useUIStore((s) => s.closeClassPicker);
  const heroClass = useCharacterStore((s) => s.heroClass);
  const setHeroClass = useCharacterStore((s) => s.setHeroClass);

  return (
    <ClassPickerModal
      visible={classPickerOpen}
      currentClass={heroClass}
      onSelect={(name) => setHeroClass(name)}
      onClose={closeClassPicker}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Electrolize-Regular': require('../assets/fonts/Electrolize-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <EnergyDecayWatcher />
      <HydrationDecayWatcher />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="skills"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modals/quest-form"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modals/shop-item-form"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      <LevelUpModal />
      <GlobalClassPicker />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
