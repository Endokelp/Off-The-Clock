import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PurchaseProvider } from '../src/purchases.tsx';
import { StoreProvider } from '../src/store.tsx';
import { darkTheme, lightTheme } from '../src/theme.ts';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  // Paper draws its icons from this font family. Loading it here rather than relying on the
  // native config plugin keeps the icons working in Expo Go as well as in a compiled build.
  const [fontsLoaded] = useFonts({
    MaterialDesignIcons: require('@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StoreProvider>
          <PurchaseProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.background },
                headerTintColor: theme.colors.onSurface,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Off the Clock' }} />
              <Stack.Screen name="shift" options={{ title: 'Add a shift' }} />
              <Stack.Screen name="scan" options={{ title: 'Scan a schedule' }} />
              <Stack.Screen name="settings" options={{ title: 'About you' }} />
              <Stack.Screen name="export" options={{ title: 'Your record' }} />
            </Stack>
          </PurchaseProvider>
        </StoreProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
