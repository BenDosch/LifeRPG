import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCharacterStore } from '../store/characterStore';

export function useEnergyDecay() {
  useEffect(() => {
    useCharacterStore.getState().applyEnergyDecay();

    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        useCharacterStore.getState().applyEnergyDecay();
      }
    };
    const subscription = AppState.addEventListener('change', onStateChange);

    const interval = setInterval(() => {
      useCharacterStore.getState().applyEnergyDecay();
    }, 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);
}
