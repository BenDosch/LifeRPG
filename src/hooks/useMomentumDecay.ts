import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useProfileStore } from '../store/profileStore';
import { todayString } from '../utils/date';

export function useMomentumDecay() {
  useEffect(() => {
    // Apply on cold start — use getState() to avoid depending on a store reference
    useProfileStore.getState().applyMomentumDecay(todayString());

    // Apply when app comes to foreground
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        useProfileStore.getState().applyMomentumDecay(todayString());
      }
    };

    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, []); // empty deps — intentional, getState() always reads latest value
}
