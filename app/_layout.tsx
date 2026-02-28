import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMomentumDecay } from '../src/hooks/useMomentumDecay';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function MomentumDecayWatcher() {
  useMomentumDecay();
  return null;
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
      <MomentumDecayWatcher />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/project-form"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
