import { useEffect, useRef, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEnergyDecay } from '../src/hooks/useEnergyDecay';
import { useHydrationDecay } from '../src/hooks/useHydrationDecay';
import { LevelUpModal } from '../src/components/shared/LevelUpModal';
import { QuestCompleteModal } from '../src/components/shared/QuestCompleteModal';
import { ClassPickerModal } from '../src/components/character/ClassPickerModal';
import { useUIStore } from '../src/store/uiStore';
import { useCharacterStore, mountCharacterListener, unmountCharacterListener } from '../src/store/characterStore';
import { unmountQuestListeners } from '../src/store/questStore';
import { unmountShopListeners } from '../src/store/shopStore';
import { useAuthStore } from '../src/store/authStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
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

function AppShell({ dataLoaded }: { dataLoaded: boolean }) {
  const theme = useTheme();
  const colorScheme = useCharacterStore((s) => s.colorScheme);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  // The Stack is always mounted so that all routes (including "auth") are
  // registered with Expo Router before any Redirect fires.
  return (
    <>
      {/* Redirect fires inside the Stack so the route is already registered. */}
      {!authLoading && !user && <Redirect href="/auth" />}

      {/* Decay watchers and modals only make sense when authenticated and data is loaded. */}
      {!authLoading && user && dataLoaded && (
        <>
          <EnergyDecayWatcher />
          <HydrationDecayWatcher />
          <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
          <QuestCompleteModal />
          <LevelUpModal />
          <GlobalClassPicker />
        </>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bgPage },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
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
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Electrolize-Regular': require('../assets/fonts/Electrolize-Regular.ttf'),
  });

  const authLoading = useAuthStore((s) => s.loading);
  const [dataLoaded, setDataLoaded] = useState(false);
  // Holds the cleanup for the FCM token-refresh listener so it can be called on sign-out / unmount.
  const fcmRefreshCleanupRef = useRef<(() => void) | null>(null);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { getFirebaseAuth } = await import('../src/lib/firebase');
      const { _setUser, _setLoading } = useAuthStore.getState();
      const auth = await getFirebaseAuth();

      if (Platform.OS === 'web') {
        const { onAuthStateChanged } = await import('firebase/auth');
        unsubscribe = onAuthStateChanged(auth as any, (firebaseUser) => {
          _setUser(
            firebaseUser
              ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName }
              : null
          );
          _setLoading(false);
        });
      } else {
        unsubscribe = (auth as any).onAuthStateChanged((firebaseUser: any) => {
          _setUser(
            firebaseUser
              ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName }
              : null
          );
          _setLoading(false);
        });
      }
    })();

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Once auth resolves and we have a user, hydrate all stores from Firestore in parallel.
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user && !authLoading) {
      // Flag so the async IIFE can bail out if this effect is cleaned up before it finishes.
      let cancelled = false;

      (async () => {
        const { loadCharacterFromFirestore } = useCharacterStore.getState();
        const questStoreModule = await import('../src/store/questStore');
        const shopStoreModule = await import('../src/store/shopStore');

        if (cancelled) return;

        const { loadQuestDataFromFirestore } = questStoreModule.useQuestStore.getState();
        const { loadShopDataFromFirestore } = shopStoreModule.useShopStore.getState();
        const { mountQuestListeners } = questStoreModule;
        const { mountShopListeners } = shopStoreModule;

        await Promise.all([
          loadCharacterFromFirestore(user.uid),
          loadQuestDataFromFirestore(user.uid),
          loadShopDataFromFirestore(user.uid),
        ]);

        if (cancelled) return;

        setDataLoaded(true);

        // Mount real-time listeners after initial data load
        mountCharacterListener(user.uid);
        mountQuestListeners(user.uid);
        mountShopListeners(user.uid);

        // Register FCM token after data is loaded and capture the refresh listener cleanup.
        try {
          const { registerFcmToken, setupTokenRefreshListener } = await import('../src/lib/fcmTokens');
          if (!cancelled) {
            await registerFcmToken(user.uid);
            // setupTokenRefreshListener is async but we need its cleanup; store it in a ref.
            setupTokenRefreshListener(user.uid).then((cleanup) => {
              if (!cancelled) {
                fcmRefreshCleanupRef.current = cleanup;
              } else {
                cleanup();
              }
            });
          }
        } catch (e) {
          console.warn('[RootLayout] FCM token registration failed:', e);
        }
      })();

      // useEffect cleanup: runs when user changes, effect re-runs, or component unmounts.
      return () => {
        cancelled = true;
        // Tear down real-time listeners (these are synchronous and idempotent).
        unmountCharacterListener();
        unmountQuestListeners();
        unmountShopListeners();
        // Tear down the FCM token-refresh listener if it was registered.
        fcmRefreshCleanupRef.current?.();
        fcmRefreshCleanupRef.current = null;
      };
    } else if (!user && !authLoading) {
      // Signed out — unmount listeners and reset all store state so stale data from
      // the previous user is never visible to a new sign-in.
      unmountCharacterListener();
      unmountQuestListeners();
      unmountShopListeners();
      fcmRefreshCleanupRef.current?.();
      fcmRefreshCleanupRef.current = null;

      // Dynamically import to clear quest/shop store state (modules may not be loaded yet).
      Promise.all([
        import('../src/store/questStore'),
        import('../src/store/shopStore'),
      ]).then(([questMod, shopMod]) => {
        // Clear quest/shop state
        questMod.useQuestStore.setState({ quests: [], log: [] });
        shopMod.useShopStore.setState({ items: [], inventory: [] });
      });

      // Clear character state (keep defaults for fields that always need a value)
      useCharacterStore.setState({
        name: 'Hero',
        heroClass: 'Adventurer',
        points: 0,
        threshold: 100,
        gold: 0,
        hydration: 100,
        hydrationLastUpdated: new Date().toISOString(),
        energy: 100,
        energyLastUpdated: new Date().toISOString(),
        customClasses: [],
        unlockedClasses: [],
      });

      // Reset dataLoaded so next sign-in triggers a fresh hydration
      setDataLoaded(false);
    }
  }, [user?.uid, authLoading]);

  // Hide the splash screen only when fonts are loaded, auth is resolved, AND data is loaded (or no user).
  useEffect(() => {
    const ready = fontsLoaded && !authLoading && (dataLoaded || !user);
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading, dataLoaded, user]);

  // Keep splash screen up until fonts are ready.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell dataLoaded={dataLoaded} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
