import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCharacterStore } from '../store/characterStore';

export function useHydrationDecay() {
  useEffect(() => {
    useCharacterStore.getState().applyHydrationDecay();

    // Re-apply when app comes to foreground
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        useCharacterStore.getState().applyHydrationDecay();
      }
    };
    const subscription = AppState.addEventListener('change', onStateChange);

    // Tick every minute while the app is open
    const interval = setInterval(() => {
      useCharacterStore.getState().applyHydrationDecay();
    }, 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);
}
