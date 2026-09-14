import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { dark, light } from './palette.ts';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: dark.money,
    onPrimary: dark.onMoney,
    background: dark.background,
    surface: dark.surface,
    surfaceVariant: dark.surfaceVariant,
    onSurface: dark.onSurface,
    onSurfaceVariant: dark.onSurfaceVariant,
    outline: dark.outline,
    outlineVariant: dark.outline,
    error: dark.error,
    elevation: { ...MD3DarkTheme.colors.elevation, level1: dark.surface, level2: dark.surfaceVariant },
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: light.money,
    onPrimary: light.onMoney,
    background: light.background,
    surface: light.surface,
    surfaceVariant: light.surfaceVariant,
    onSurface: light.onSurface,
    onSurfaceVariant: light.onSurfaceVariant,
    outline: light.outline,
    outlineVariant: light.outline,
    error: light.error,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: light.surface,
      level2: light.surfaceVariant,
    },
  },
};
