import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useProfileStore } from '../store/profileStore';
import { todayString } from '../utils/date';

export function useMomentumDecay() {
  const applyDecay = useProfileStore((s) => s.applyMomentumDecay);

  useEffect(() => {
    // Apply on cold start
    applyDecay(todayString());

    // Apply when app comes to foreground
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        applyDecay(todayString());
      }
    };

    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, [applyDecay]);
}
