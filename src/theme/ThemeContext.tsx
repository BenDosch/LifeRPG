import React, { createContext, useContext } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Theme, darkTheme, lightTheme } from './index';

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useCharacterStore((s) => s.colorScheme);
  const theme = colorScheme === 'light' ? lightTheme : darkTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
